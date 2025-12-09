SELECT * FROM CStone 
WHERE EventID=1 
AND SessionID=6 
AND GameID=3 
AND EndID=5
AND StoneID=10


SELECT * FROM CTeam WHERE EventID=21

SELECT * FROM CSession

SELECT * FROM CGame WHERE EventID=21 AND SessionID=46


EXEC spstats_GameStatusUpdate 0,0,2, 'READY'

SELECT * FROM TESTDATA_2026.dbo.CStone WHERE EventID=21 AND SessionID=2

EXEC dbo.spprint_C76D 21, 13

EXEC dbo.sptsf_Result 'RESULT', 'INTERMEDIATE', 21, 2, 1

EXEC ssptsf_Result_Results 'RESULT', 'INTERMEDIATE', 21, 2, 1, 0

EXEC ssptsf_Result_Results_Result_Details 21, 2, 1, 37


SELECT 
EventID, SessionID, GameID, EndID, StoneID, TeamID, PlayerID, Task, Handle, Points, SVG 
FROM CStone WHERE EventID=2 AND SessionID=8 AND GameID=4 AND EndID=1

SELECT * FROM CWebTriggerStone