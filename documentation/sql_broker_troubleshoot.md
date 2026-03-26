# SQL Broker Troubleshooting

This document contains useful SQL snippets and troubleshooting techniques for common database issues. It is intended for quick reference and practical debugging in the case of performance drop.

---

## Table of Contents

* [SQL Broker Setup](#sql-broker-setup)
    * [Add a Broker](#add-a-broker)
    * [SQL Broker Status](#sql-broker-status)
    * [Disable a Broker](#disable-a-broker)
* [SQL Broker Troubleshoot](#sql-broker-troubleshoot)
    * [Broker Health Check](#broker-health-check)
        * [Metrics](#health-check-metrics)
    * [Broker Cleanup](#broker-cleanup)

---

## SQL Broker Setup

### Add a broker

```sql
ALTER DATABASE {YOUR_DB} SET NEW_BROKER WITH ROLLBACK IMMEDIATE;
```
> If the broker already exists, this will reset it, along with all the clients connected (downtime of ~5 seconds).


### Find which broker is active across all databases

```sql
SELECT name, is_broker_enabled
FROM sys.databases
WHERE is_broker_enabled = 1;
```

> As the newest implementation (1.10rc1 and later) do not rely on signalR/SQLDependency once the session/event/competition is OFFICIAL, we want to disable the brokers for past competitions.

### Disable a broker

This can either be within the following stored procedure, or copy/paste the T-SQL as of `Step 1`

```sql
CREATE OR ALTER PROCEDURE spsse_DeactivateServiceBroker
    @Password NVARCHAR(10)           -- Password to authorize run
AS
BEGIN
    SET NOCOUNT ON;

    -- Step 0: Validate password
    DECLARE @CurrentMinute NVARCHAR(2) = RIGHT('0' + CAST(DATEPART(MINUTE, SYSDATETIME()) AS VARCHAR(2)), 2);
    DECLARE @ExpectedPassword NVARCHAR(10) = 'curs' + @CurrentMinute;

    IF @Password <> @ExpectedPassword
    BEGIN
        PRINT 'Unauthorized: Password is incorrect or expired.';
        RETURN;
    END

    PRINT 'Password accepted. Starting maintenance...';


    -- Step 1: Disable all queue activation
    PRINT 'Disabling queue activation...';

    DECLARE @sql NVARCHAR(MAX) = N'';

    SELECT @sql = @sql + '
        ALTER QUEUE [' + name + '] WITH ACTIVATION (STATUS = OFF);'
    FROM sys.service_queues
    WHERE is_ms_shipped = 0;

    EXEC (@sql);

    -- Step 2: End all conversations
    PRINT 'Ending all conversation endpoints...';

    DECLARE @conv uniqueidentifier;

    DECLARE conv_cursor CURSOR LOCAL FAST_FORWARD FOR
        SELECT conversation_handle
        FROM sys.conversation_endpoints;

    OPEN conv_cursor;
    FETCH NEXT FROM conv_cursor INTO @conv;

    WHILE @@FETCH_STATUS = 0
    BEGIN
        PRINT 'Ending conversation: ' + CAST(@conv AS VARCHAR(36));
        END CONVERSATION @conv WITH CLEANUP;
        FETCH NEXT FROM conv_cursor INTO @conv;
    END

    CLOSE conv_cursor;
    DEALLOCATE conv_cursor;

    -- Step 3: Drain all messages from all queues
    PRINT 'Draining all queues...';

    DECLARE @queue NVARCHAR(255);

    DECLARE queue_cursor CURSOR LOCAL FAST_FORWARD FOR
        SELECT name FROM sys.service_queues WHERE is_ms_shipped = 0;

    OPEN queue_cursor;
    FETCH NEXT FROM queue_cursor INTO @queue;

    WHILE @@FETCH_STATUS = 0
    BEGIN
        PRINT 'Draining queue: ' + @queue;

        DECLARE @drain_sql NVARCHAR(MAX) = '
            WHILE 1 = 1
            BEGIN
                WITH cte AS (
                    RECEIVE TOP(5000) * FROM [' + @queue + ']
                )
                SELECT * FROM cte;

                IF NOT EXISTS (SELECT * FROM [' + @queue + ']) BREAK;
            END';

        EXEC (@drain_sql);

        FETCH NEXT FROM queue_cursor INTO @queue;
    END

    CLOSE queue_cursor;
    DEALLOCATE queue_cursor;

    -- Step 4: Disable the Service Broker
    PRINT 'Disabling Service Broker for this database...';

    DECLARE @disable NVARCHAR(MAX) = '
        ALTER DATABASE [' + DB_NAME() + '] 
        SET DISABLE_BROKER WITH ROLLBACK IMMEDIATE;';

    EXEC (@disable);

    PRINT 'Service Broker Deactivation Completed for [' + DB_NAME() + ']';
END
GO
```

---

## SQL Broker Troubleshoot

### Broker Health Check

Again, this can either be within the following stored procedure, or copy/paste the T-SQL. <br>
`Broker waits` has been removed from that procedure as it is a misleading indicator. 
As soon as they are up and running, SQL Brokers perform a `WAITFOR(RECEIVE...)` periodically on queues. They sit idle, continuously wait and make that counter increment, but it does not signal a leak. 
<p>

#### Health Check metrics
The following indicators are more relevant: 


| Column              | Metric              | Meaning                  | Reasonable value |
|---------------------|---------------------|--------------------------|------------------|
|PendingMessages| `sys.transmission_queue`      | Messages that have been sent but not delivered yet.            | • Ideally `0` <br>• `1`-`10` is a normal transient <br>• `10`-`100` shows slownesses<br>• `100`+ is definitely wrong      
|Subscriptions| `sys.dm_qn_subscriptions` | # of open Service Broker conversations. <p>  There should be 1 per SqlDependency, so 1 per QueryContext.<br>As a reminder, we can either have params defined or equal 0 (e.g. SessionID), which would create 2 separate Query Contexts.   | • If 1 Competition is running, we expect less than `10` (QueryContext can be set down to the `GameID` or `Sheet`) <br>• `10`-`20` would signal that some haven't been closed properly <br>• More than `20` is definitely wrong and signal SqlDependency objects not unsubscribed or disposed             |
|ActiveConversations| `sys.conversation_endpoints where state <> 'CD'`     | Slightly different than **Subscriptions**, as one subscription can use multiple conversations (SQL Server manages it internally)   | Hard to predict the range as it is internally managed (likely between `1` and `3` per Subscription), but if we execute that query multiple times, **Subscriptions** and **ActiveConversations** should definitely remain proportional.             |
|StuckConversations| `sys.conversation_endpoints WHERE state_desc NOT IN ('CLOSED', 'CONVERSING')`       | Broken converations, either `ERROR`, `DISCONNECTED`,`ENDING` or `DOOMED`.,<br>Something went wrong with the lifecycle, but most likely another conversation took over      | • Ideally `0` <br>• `1`-`5` signals occasional issues <br>• `5`+ is definitely wrong                   |
|DisabledQueues| `sys.service_queues WHERE is_receive_enabled = 0 OR is_enqueue_enabled = 0`       | # of Queues that cannot send or receive messages      | • Should definitely be `0` <br> • `1` signals a problem internally with the SQL Broker, that needs to be reset                   |

<p>

```sql
CREATE OR ALTER PROCEDURE spsse_BrokerHealthCheck
AS
BEGIN
    SET NOCOUNT ON;

    ------------------------------------------------------------
    -- Core metrics
    ------------------------------------------------------------

    DECLARE @PendingMessages INT = (
        SELECT COUNT(*) FROM sys.transmission_queue
    );

    DECLARE @StuckConversations INT = (
        SELECT COUNT(*) 
        FROM sys.conversation_endpoints 
        WHERE state_desc NOT IN ('CLOSED', 'CONVERSING')
    );

    DECLARE @ActiveConversations INT = (
        SELECT COUNT(*)
        FROM sys.conversation_endpoints
        WHERE state <> 'CD' -- CD = CLOSED
    );

    DECLARE @DisabledQueues INT = (
        SELECT COUNT(*) 
        FROM sys.service_queues 
        WHERE is_receive_enabled = 0 OR is_enqueue_enabled = 0
    );

    DECLARE @Subscriptions INT = (
        SELECT COUNT(*) 
        FROM sys.dm_qn_subscriptions
    );

    ------------------------------------------------------------
    -- Wait stats (still included but de-emphasized)
    ------------------------------------------------------------

    DECLARE @Waits BIGINT = (
        SELECT SUM(waiting_tasks_count)
        FROM sys.dm_os_wait_stats
        WHERE wait_type LIKE 'BROKER%'
    );

    ------------------------------------------------------------
    -- Output
    ------------------------------------------------------------

    SELECT 
        'PendingMessages' AS Metric,
        CAST(@PendingMessages AS VARCHAR) AS Value,
        CASE 
            WHEN @PendingMessages = 0 THEN 'Healthy'
            WHEN @PendingMessages < 10 THEN 'Warning'
            ELSE 'Error'
        END AS Status,
        'Messages waiting in transmission queue (should usually be 0).' AS Description
            
    UNION ALL

    SELECT 
        'Subscriptions',
        CAST(@Subscriptions AS VARCHAR),
        CASE 
            WHEN @Subscriptions < 20 THEN 'Healthy'
            WHEN @Subscriptions < 100 THEN 'Warning'
            ELSE 'Error'
        END,
        'Active SqlDependency subscriptions (should not grow indefinitely).'

    UNION ALL

    SELECT 
        'ActiveConversations',
        CAST(@ActiveConversations AS VARCHAR),
        CASE 
            WHEN @ActiveConversations < 20 THEN 'Healthy'
            WHEN @ActiveConversations < 100 THEN 'Warning'
            ELSE 'Error'
        END,
        'Open Service Broker conversations (should remain low and stable).'

    UNION ALL

    SELECT 
        'StuckConversations',
        CAST(@StuckConversations AS VARCHAR),
        CASE 
            WHEN @StuckConversations = 0 THEN 'Healthy'
            ELSE 'Warning'
        END,
        'Conversations not in expected state.'

    UNION ALL

    SELECT 
        'DisabledQueues',
        CAST(@DisabledQueues AS VARCHAR),
        CASE 
            WHEN @DisabledQueues = 0 THEN 'Healthy'
            ELSE 'Error'
        END,
        'Queues disabled for send/receive.'
END
GO
```


### Broker Health Check

This will drain the current broker's messages from **stuck** conversations only.

```sql
CREATE OR ALTER PROCEDURE spsse_CleanBrokerMaintenance
    @TargetDb SYSNAME = NULL,        -- Optional: database name to clean
    @Password NVARCHAR(10)           -- Password to authorize run
AS
BEGIN
    SET NOCOUNT ON;

    -- Step 0: Validate password
    DECLARE @CurrentMinute NVARCHAR(2) = RIGHT('0' + CAST(DATEPART(MINUTE, SYSDATETIME()) AS VARCHAR(2)), 2);
    DECLARE @ExpectedPassword NVARCHAR(10) = 'curs' + @CurrentMinute;

    IF @Password <> @ExpectedPassword
    BEGIN
        PRINT 'Unauthorized: Password is incorrect or expired.';
        RETURN;
    END

    PRINT 'Password accepted. Starting maintenance...';

    -- Step 1: Reset wait stats server-wide (only if cleaning all DBs)
    IF @TargetDb IS NULL OR @TargetDb = ''
    BEGIN
        PRINT 'Resetting wait stats server-wide...';
        DBCC SQLPERF('sys.dm_os_wait_stats', CLEAR);
        PRINT 'Wait stats reset completed.';
    END
    ELSE
    BEGIN
        PRINT 'Targeting database: ' + QUOTENAME(@TargetDb);
    END

    -- Helper: Clean one database - ends stuck conversations only
    DECLARE @sql NVARCHAR(MAX);

    IF @TargetDb IS NOT NULL AND @TargetDb <> ''
    BEGIN
        SET @sql = N'
        USE ' + QUOTENAME(@TargetDb) + ';

        PRINT ''Finding stuck conversations...'';

        DECLARE @conv_handle UNIQUEIDENTIFIER;

        DECLARE conv_cursor CURSOR LOCAL FAST_FORWARD FOR
        SELECT conversation_handle
        FROM sys.conversation_endpoints
        WHERE state <> ''CD'';

        OPEN conv_cursor;
        FETCH NEXT FROM conv_cursor INTO @conv_handle;

        WHILE @@FETCH_STATUS = 0
        BEGIN
            PRINT ''Ending conversation: '' + CONVERT(varchar(36), @conv_handle);

            END CONVERSATION @conv_handle WITH CLEANUP;

            FETCH NEXT FROM conv_cursor INTO @conv_handle;
        END

        CLOSE conv_cursor;
        DEALLOCATE conv_cursor;

        PRINT ''Stuck conversations cleaned.'';
        ';
        BEGIN TRY
            EXEC sp_executesql @sql;
            PRINT 'Database ' + QUOTENAME(@TargetDb) + ' processed successfully.';
        END TRY
        BEGIN CATCH
            PRINT 'Error processing database ' + QUOTENAME(@TargetDb) + ': ' + ERROR_MESSAGE();
        END CATCH
    END
    ELSE
    BEGIN
        -- Process all user DBs
        DECLARE @db SYSNAME;
        DECLARE db_cursor CURSOR FOR
        SELECT name FROM sys.databases
        WHERE state = 0 AND database_id > 4;

        OPEN db_cursor;
        FETCH NEXT FROM db_cursor INTO @db;

        WHILE @@FETCH_STATUS = 0
        BEGIN
            PRINT '--- Processing database: ' + @db + ' ---';

            SET @sql = '
            USE ' + QUOTENAME(@db) + ';

            PRINT ''Finding stuck conversations...'';

            DECLARE @conv_handle UNIQUEIDENTIFIER;

            DECLARE conv_cursor CURSOR LOCAL FAST_FORWARD FOR
            SELECT conversation_handle
            FROM sys.conversation_endpoints
            WHERE state <> ''CD'';

            OPEN conv_cursor;
            FETCH NEXT FROM conv_cursor INTO @conv_handle;

            WHILE @@FETCH_STATUS = 0
            BEGIN
                PRINT ''Ending conversation: '' + CONVERT(varchar(36), @conv_handle);

                END CONVERSATION @conv_handle WITH CLEANUP;

                FETCH NEXT FROM conv_cursor INTO @conv_handle;
            END

            CLOSE conv_cursor;
            DEALLOCATE conv_cursor;

            PRINT ''Stuck conversations cleaned.'';
            ';

            BEGIN TRY
                EXEC sp_executesql @sql;
                PRINT 'Database ' + @db + ' processed successfully.';
            END TRY
            BEGIN CATCH
                PRINT 'Error processing database ' + @db + ': ' + ERROR_MESSAGE();
            END CATCH

            FETCH NEXT FROM db_cursor INTO @db;
        END

        CLOSE db_cursor;
        DEALLOCATE db_cursor;
    END

    PRINT 'Maintenance completed.';
END
GO

```

---

## Notes

* The troubleshoot stored procedures are non disruptive, thus can be executed during a session.
* Be cautious while executing the [SQL Broker Setup](#sql-broker-setup). SignalR is designed to re-attempt connections after a given interval (current is 5 seconds) so it would be almost seamless to clients, but SSE may not like it.

