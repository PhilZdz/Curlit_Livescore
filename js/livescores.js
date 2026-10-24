// Version 2.0rc1 from 12.10.26

$(document).ready(function () {
    const apiUrl = "https://livescores.worldcurling.org/curlitsse";
    //const apiUrl = "http://sse.curlit.local:5057";

    const params = new URLSearchParams(window.location.search);
    const pathSegments = window.location.pathname.split("/");
    var season = params.get("Season");
    var competition = params.get("Competition");
    var eventId = params.get("EventID") ?? 0;
    var sessionId = params.get("SessionID") ?? 0;
    var isTestMode = params.get("TestMode") ?? 0;

    if (document.getElementById('ContentMain_HiddenSeason') != null)
        season = document.getElementById('ContentMain_HiddenSeason').value;
    if (document.getElementById('ContentMain_HiddenCompetition') != null)
        competition = document.getElementById('ContentMain_HiddenCompetition').value;
    if (document.getElementById('ContentMain_HiddenEventID') != null)
        eventId = document.getElementById('ContentMain_HiddenEventID').value ?? 0;
    if (document.getElementById('ContentMain_HiddenSessionID') != null)
        sessionId = document.getElementById('ContentMain_HiddenSessionID').value ?? 0;

    const competitionCode = pathSegments[1] ?? competition;


    // The name of the group that sign
    const signalGroupName = `${competition != null ? competition : "TEST"}-${eventId}-${sessionId}-0-${(isTestMode ? "True" : "False")}`;

    const $container = $('#scoreboard');
    const $template = $('#template');
    const $sessionHeader = $('#session-header');


    var nbGames = 0;
    var isLive = true;

    function startConnection() {
        const connection = new signalR.HubConnectionBuilder()
            .withUrl(`${apiUrl}/notificationHub`, { withCredentials: false })
            .build();

        connection.on("ReceiveMessage", function (resultList) {
            // Refresh the tiles
            renderTileData(resultList);

            // Refresh the tile size
            refreshContainer(resultList);
        });

        connection.on("LiveEnded", () => {
            isLive = false;

            $("#RefreshButton").attr("src", "../general/Refresh_D.svg");

            connection.off("ReceiveMessage");
            connection.stop();
        });

        connection.onclose(function () {

            if (isLive) {
                // Handle connection closed event
                setOnlineHeader(false);
                console.error("Connection closed. Retrying in 5 seconds");
                setTimeout(startConnection, 5000);
            }

        });

        connection.start().then(function () {
            const urlParams = {}
            if (season != null) {
                urlParams["season"] = season;
            }
            if (competition != null) {
                urlParams["competition"] = competition;
            }
            if (eventId != null) {
                urlParams["eventId"] = eventId;
            }
            if (sessionId != null) {
                urlParams["sessionId"] = sessionId;
            }
            if (isTestMode != null) {
                urlParams["testMode"] = isTestMode == 1;
            }

            var callUrl = `${apiUrl}/Result/LiveResults`

            if (Object.keys(urlParams).length > 0) {
                const keys = Object.keys(urlParams);

                for (let i = 0; i < keys.length; i++) {
                    const key = keys[i];
                    callUrl = callUrl + `${i == 0 ? "?" : "&"}${key}=${urlParams[key]}`
                }
            }

            // Call the subscription API endpoint
            fetch(callUrl)
                .then(response => response.json())
                .then(function (data) {
                    // Hide the loader and show the session title
                    $("#loader").hide();

                    // Build the scoreboard
                    renderTileData(data);

                    refreshContainer(data);

                    setOnlineHeader(true);

                    // Subscribe to real time updates
                    connection.invoke("SubscribeToGroup", signalGroupName).catch(err => console.error(err.toString()));
                });
        }).catch(function (err) {
            setOnlineHeader(false);
            console.error(err.toString())
            setTimeout(startConnection, 5000);
        });

    }

    function refreshContainer(data) {
        var nbMatchups = data.length;
        var gamesTitle = data.length > 0 ? data[0].gamesTitle : "";

        if (nbGames == nbMatchups && gamesTitle == $sessionHeader.html()) {
            return;
        }

        //$sessionHeader.html(gamesTitle);

        // let $rows = $container.children('.row').sort(function(a, b) {
        //     let dataA = $(a).data('id').toString().toLowerCase(); // Convert data-id to lowercase for consistent alphabetical order
        //     let dataB = $(b).data('id').toString().toLowerCase();
        //     return dataA.localeCompare(dataB); // Compare alphabetically
        // });

        // // Append the sorted divs back to the container
        // $container.append($rows);
        const isMobile = /iPhone|iPad|iPod|Android|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

        $container.removeClass("tile-s");
        $container.removeClass("tile-m");
        $container.removeClass("tile-l");

        if (nbMatchups <= 4) {
            $container.addClass("tile-l");
        }
        else if (nbMatchups == 5 || (nbMatchups == 6 && !isMobile)) {
            $container.addClass("tile-m");
        }
        else {
            $container.addClass("tile-s");
        }

        nbGames = nbMatchups;
    }

    function renderTileData(data) {
        window.CurlitLiveScoresRenderer.renderTileData(data, $template, $container, competitionCode);
    }

    function setOnlineHeader(online) {
        window.CurlitLiveCommon.setOnlineHeader($sessionHeader, online);
    }

    async function getGameStatus(retry = true) {
        try {
            const urlParams = {}
            if (season != null) {
                urlParams["season"] = season;
            }
            if (competition != null) {
                urlParams["competition"] = competition;
            }
            if (eventId != null) {
                urlParams["eventId"] = eventId;
            }
            if (sessionId != null) {
                urlParams["sessionId"] = sessionId;
            }
            if (isTestMode != null) {
                urlParams["testMode"] = isTestMode == 1;
            }


            var callUrl = `${apiUrl}/Status/Game`

            if (Object.keys(urlParams).length > 0) {
                const keys = Object.keys(urlParams);

                for (let i = 0; i < keys.length; i++) {
                    const key = keys[i];
                    callUrl = callUrl + `${i == 0 ? "?" : "&"}${key}=${urlParams[key]}`
                }
            }

            const response = await fetch(callUrl);
            if (!response.ok) {
                debugger;
                throw new Error(`Error: ${response.statusText}`);
            }
            return await response.json();
        } catch (error) {
            console.error('Error fetching game status:', error);

            if (retry) {
                console.log("Retrying in 5 seconds...");
                await new Promise(res => setTimeout(res, 5000));
                return getGameStatus(true);
            }
        }
    }


    async function fetchResultsAsync() {
        try {
            const urlParams = {}
            if (season != null) {
                urlParams["season"] = season;
            }
            if (competition != null) {
                urlParams["competition"] = competition;
            }
            if (eventId != null) {
                urlParams["eventId"] = eventId;
            }
            if (sessionId != null) {
                urlParams["sessionId"] = sessionId;
            }
            if (isTestMode != null) {
                urlParams["testMode"] = isTestMode == 1;
            }

            var callUrl = `${apiUrl}/Result/Results`

            if (Object.keys(urlParams).length > 0) {
                const keys = Object.keys(urlParams);

                for (let i = 0; i < keys.length; i++) {
                    const key = keys[i];
                    callUrl = callUrl + `${i == 0 ? "?" : "&"}${key}=${urlParams[key]}`
                }
            }

            const response = await fetch(callUrl);
            if (!response.ok) {
                throw new Error(`Error: ${response.statusText}`);
            }
            return await response.json();
        } catch (error) {
            console.error('Error fetching results:', error);
        }
    }


    // Get the game status before opening signalR connections
    getGameStatus().then(gameStatus => {
        var useSignalR = true;

        if (gameStatus.competitionFinished ||
            (eventId != 0 && gameStatus.eventFinished) ||
            (sessionId != 0 && gameStatus.sessionFinished)) {
            useSignalR = false;
        }

        // Live mode
        if (useSignalR) {
            startConnection();
        }
        // Session is finished -- history mode
        else {

            $("#RefreshButton").hide();

            fetchResultsAsync().then(resultList => {
                $("#loader").hide();
                $("#game-tile").show();

                renderTileData(resultList);
                refreshContainer(resultList);
            });
        }
    });


    // ------------------ //
    // ----- EVENTS ----- //
    // ------------------ //
    $(document).on("click", ".row", function () {
        const dataId = $(this).data('id');

        if (!$(e.target).closest('.btnStats, .btnGraphics').length) {
            if (dataId) {
                var sheet = $(this).find('.sheet').first().text();

                const [dataEvent, dataSession] = dataId.split("-");

                if (dataEvent && dataSession && sheet) {
                    window.location.href = `/${competitionCode}/aspnet/GameCenter.aspx?EventID=${dataEvent}&Sheet=${sheet}&SessionID=${dataSession}`;
                }
            }
        }
    });

});