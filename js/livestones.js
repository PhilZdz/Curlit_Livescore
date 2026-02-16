// Version 1.6rc5 from 2.2.25

$(document).ready(function () {

    const apiUrl = "https://livescores.worldcurling.org/curlitsse";
    //const apiUrl = "http://sse.curlit.local:5057";
    //const apiUrl = "https://curlit.com/curlitsse";

    const curlTasks = {
        0: "Draw",
        1: "Front",
        2: "Guard",
        3: "Raise / Tap-back",
        4: "Wick / Soft Peeling",
        5: "Freeze",
        6: "Take-out",
        7: "Hit and Roll",
        8: "Clearing",
        9: "Double Take-out",
        10: "Promotion Take-out",
        11: "through",
        12: "no statistics"
    };


    const params = new URLSearchParams(window.location.search);
    const pathSegments = window.location.pathname.split("/");
    // Convert all params to a case-insensitive map
    const queryParams = {};
    for (const [key, value] of params.entries()) {
        queryParams[key.toLowerCase()] = value;
    }

    // Helper to get int from case-insensitive key
    function getIntParam(key, fallback = 0) {
        const val = queryParams[key.toLowerCase()];
        const parsed = parseInt(val);
        return Number.isNaN(parsed) ? fallback : parsed;
    }
    var season = params.get("Season", "");
    var competition = params.get("Competition", "");
    var eventId = getIntParam("EventID");
    var sessionId = getIntParam("SessionID");
    var gameId = getIntParam("GameId", 0);
    var sheet = params.get("Sheet", "");
    var isDebug = getIntParam("Debug");
    var isTestMode = getIntParam("TestMode", 0);

    if (document.getElementById('ContentMain_HiddenSeason') != null && document.getElementById('ContentMain_HiddenSeason') != "")
        season = document.getElementById('ContentMain_HiddenSeason').value;
    if (document.getElementById('ContentMain_HiddenCompetition') != null && document.getElementById('ContentMain_HiddenCompetition') != "")
        competition = document.getElementById('ContentMain_HiddenCompetition').value;
    if (document.getElementById('ContentMain_HiddenEventID') != null && document.getElementById('ContentMain_HiddenEventID') != "")
        eventId = document.getElementById('ContentMain_HiddenEventID').value ?? 0;
    if (document.getElementById('ContentMain_HiddenSessionID') != null && document.getElementById('ContentMain_HiddenSessionID') != "")
        sessionId = document.getElementById('ContentMain_HiddenSessionID').value ?? 0;

    const competitionCode = pathSegments[1] ?? competition;
    const signalGroupName = `${competition != null ? competition : "TEST"}-${eventId}-${sessionId}-${sheet != null && sheet != "" ? sheet : gameId}-${(isTestMode ? "True" : "False")}`;


    const $sessionHeader = $('#session-header');
    const $slider = $('#slider');
    const $gameTile = $('#game-tile');
    let current = 0;

    $('table.scoreboard').hide();
    $('#head-to-head').hide();

    // ------------------- //
    // ----- RESULTS ----- //
    // ------------------- //
    var latestGameStatus;

    function startConnectionResults() {
        let resultConnection = new signalR.HubConnectionBuilder()
            .withUrl(`${apiUrl}/notificationHub`, { withCredentials: false })
            .build();

        resultConnection.on("ReceiveMessage", function (resultList) {
            // Refresh the tiles
            renderTileData(resultList);

            // Refresh the tile size
            refreshContainer(resultList);
        });

        resultConnection.onclose(function () {
            // Handle connection closed event
            setOnlineHeader(false);
            console.error("Connection closed. Retrying in 5 seconds");
            setTimeout(startConnectionResults, 5000);

        });

        resultConnection.start().then(function () {
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
            if (gameId != null) {
                urlParams["gameId"] = gameId;
            }
            if (sheet != null) {
                urlParams["sheet"] = sheet;
            }
            // If none specified, default to game 1
            if (sheet == null && (gameId == null || gameId == 0)) {
                gameId = 1;
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
                    $("#game-tile").show();

                    // Build the header
                    renderTileData(data);

                    setOnlineHeader(true);

                    // Subscribe to real time updates
                    resultConnection.invoke("SubscribeToGroup", signalGroupName).catch(err => console.error(err.toString()));
                });
        }).catch(function (err) {
            setOnlineHeader(false);
            // TODO write an error in the DOM
            setTimeout(startConnectionResults, 5000);
        });

    }

    function getLetterFromIndex(index) {
        // Ensure the input is within the valid range (1 to 26)
        if (index < 1 || index > 26) {
            return "Invalid Index";
        }

        const asciiCode = 'A'.charCodeAt(0) + (index - 1);
        return String.fromCharCode(asciiCode);
    }


    function renderTileData(data) {
        var result = (sheet != null && sheet != "") ? data.find(g => g.sheet == sheet) : data.find(g => g.gameID == gameId);

        if (result) {
            latestGameStatus = result.status;
            refreshSheetList($gameTile, result);
            feedTileUI($gameTile, result);
        }
    }


    function refreshSheetList(tile, result) {

        var $sheet = tile.find('select.sheet');
        var values = $sheet.find('option').map(function () { return $(this).val(); }).get();

        // If the values have changed, re-build the select
        if (JSON.stringify(values) != JSON.stringify(result.allSheets)) {
            $sheet.empty();

            $.each(result.allSheets, function (_, value) {
                $sheet.append($("<option>", {
                    value: value,
                    text: value
                }));
            });
        }

        if ($sheet.val() != result.sheet) {
            $sheet.val(result.sheet);
        }
    }

    // TODO this method should be moved to a common JS between result/stones
    function feedTileUI(tile, result) {
        // Header
        tile.find('.matchup-tile').attr('class', `matchup-tile ${result.status}`);

        let $leftText = tile.find('span.left-text');
        var leftText = result.gamesTitle;
        $leftText.removeClass("longText");
        $leftText.removeClass("shortSessionName");
        // Special case - shorten the session title if it contains Women's Round Robin (only on smaller devices)
        var sequencesToStrip = ["Women's Round Robin", "Mixed Doubles Round Robin"];
        var sequenceToStrip2 = " Round Robin";
        if (leftText.length > 28 && sequencesToStrip.some(item => leftText.includes(item))) {
            leftText = leftText.replace(sequenceToStrip2, " <span class='wideScreenText'>Round Robin</span>");
            $leftText.addClass("longText");
        }
        else if (leftText.length > 40 && leftText.indexOf(sequenceToStrip2) != -1) {
            leftText = leftText.replace(sequenceToStrip2, "");
            $leftText.addClass("longText");
        }
        else if (leftText.length > 20) {
            $leftText.addClass("longText");
        }
        $leftText.html(leftText);


        tile.find('span.middle-text').text(result.status);

        let $generalComment = $('#ContentMain_SessionComment');
        if ($generalComment.text() != result.generalComment) {
            $generalComment.text(result.generalComment);
        }

        let $rightComment = tile.find('.right-area .me-1');
        $rightComment.removeClass("longTextRight");
        $rightComment.html(result.gameComment);
        if (result.gameComment != null && result.gameComment != '' && result.gameComment.length > 14) {
            $rightComment.addClass("longTextRight");
        }

        tile.find('.right-area .btnStats').attr("href", `/${competitionCode}/aspnet/currentstats.aspx?EventID=${result.eventID}&Sheet=${result.sheet}`);
        tile.find('.right-area .btnGraphics').attr("href", `/${competitionCode}/aspnet/livegraphics.aspx?EventID=${result.eventID}&Sheet=${result.sheet}`);

        if (result.doStats == true) {
            tile.find('.right-area .btnStats img').attr("src", `../general/proc-button.svg`);
            tile.find('.right-area .btnStats img').attr("alt", `Line-Up`);
        }
        else {
            tile.find('.right-area .btnStats img').attr("src", `../general/lineup-button.svg`);
        }

        if (result.doGraphics == false) {
            tile.find('.right-area .btnGraphics').hide();
        }

        // Home team
        tile.find('.summary .home img.flag').attr('src', `https://livescores.worldcurling.org/flags/${result.homeTeam.noc}.svg`);
        tile.find('.summary .home .team-name').html(`<span class='short'>${result.homeTeam.teamShortName}</span><span class='long'>${result.homeTeam.teamLongName}</span>`);
        tile.find('.summary .home .score').text(result.homeTeam.total);

        if (result.homeTeam.lsce) {
            tile.find('.summary .home .score').addClass("lsce");
        }
        else {
            tile.find('.summary .home .score').removeClass("lsce");
        }

        tile.find('.summary .home .team-history').text(result.homeTeam.history);
        tile.find('.summary .home .team-history').attr('title', `wins - losses`);

        // Away team
        tile.find('.summary .away img.flag').attr('src', `https://livescores.worldcurling.org/flags/${result.awayTeam.noc}.svg`);
        tile.find('.summary .away .team-name').html(`<span class='short'>${result.awayTeam.teamShortName}</span><span class='long'>${result.awayTeam.teamLongName}</span>`);
        tile.find('.summary .away .score').text(result.awayTeam.total);

        if (result.awayTeam.lsce) {
            tile.find('.summary .away .score').addClass("lsce");
        }
        else {
            tile.find('.summary .away .score').removeClass("lsce");
        }

        tile.find('.summary .away .team-history').text(result.awayTeam.history);
        tile.find('.summary .away .team-history').attr('title', `wins - losses`);

        // Scoreboard
        var thead = tile.find('.scoreboard thead');
        var homeRow = tile.find('.scoreboard tbody tr').eq(0);
        var awayRow = tile.find('.scoreboard tbody tr').eq(1);

        // Clear the scoreboard
        thead.empty();
        homeRow.find('td').remove();
        awayRow.find('td').remove();

        // NOC
        thead.append(`<th class="noc"></th>`);
        homeRow.append(`<td class="noc">${result.homeTeam.noc}</td>`)
        awayRow.append(`<td class="noc">${result.awayTeam.noc}</td>`)

        // LSFE
        thead.append(`<th class="lsfe"></th>`);
        homeRow.append(`<td class="lsfe">${result.homeTeam.lsfe == true ? "✱" : ""}</td>`)
        awayRow.append(`<td class="lsfe">${result.awayTeam.lsfe == true ? "✱" : ""}</td>`)

        // LSD (only on desktop)
        if (result.homeTeam.lsd.total != null) {
            thead.append(`<th class="lsd-lsfe" colspan=3>LSD/LSFE</th>`);
            homeRow.append(`<td class="lsd-lsfe" colspan=2><span>${result.homeTeam.lsd.total != null ? Number(result.homeTeam.lsd.total).toFixed(1) + "cm" : ""}</span></td><td class="lsd-lsfe">${result.homeTeam.lsfe == true ? "✱" : ""}</td>`)
            awayRow.append(`<td class="lsd-lsfe" colspan=2><span>${result.awayTeam.lsd.total != null ? Number(result.awayTeam.lsd.total).toFixed(1) + "cm" : ""}</span></td><td class="lsd-lsfe">${result.awayTeam.lsfe == true ? "✱" : ""}</td>`)
        }
        else {
            thead.append(`<th class="lsd-lsfe" colspan=2>LSFE</th><th></th>`);
            homeRow.append(`<td class="lsd-lsfe-center" colspan=2><span>${result.homeTeam.lsfe == true ? "✱" : ""}</td><td></td>`)
            awayRow.append(`<td class="lsd-lsfe-center" colspan=2><span>${result.awayTeam.lsfe == true ? "✱" : ""}</td><td></td>`)
        }

        // ENDS
        var idx = 1;
        Object.entries(result.ends).forEach(([endName, endDetails]) => {
            thead.append(`<th>${endName}</th>`);

            var homeClass = "";
            var awayClass = "";
            var homeSpanClass = "";
            var awaySpanClass = "";

            // Hammer                   
            if (result.cEnd == idx && result.homeTeam.lsce == true) {
                homeClass = homeClass + "hammer";
            }
            if (result.cEnd == idx && result.awayTeam.lsce == true) {
                awayClass = awayClass + "hammer";
            }

            // Powerplay
            if (result.homeTeam.ppE1 == idx || result.homeTeam.ppE2 == idx) {
                homeSpanClass = "powerplay";
            }
            if (result.awayTeam.ppE1 == idx || result.awayTeam.ppE2 == idx) {
                awaySpanClass = "powerplay";
            }

            // Extra end placeholder, no border (for small displays)
            if (endName == "") {
                homeClass = homeClass + " no-border";
                awayClass = awayClass + " no-border";
            }

            homeRow.append(`<td${homeClass != "" ? ` class=\"${homeClass}\"` : ""}><span${homeSpanClass != "" ? ` class=\"${homeSpanClass}\"` : ""}>${endDetails.h}</span></td>`);
            awayRow.append(`<td${awayClass != "" ? ` class=\"${awayClass}\"` : ""}><span${awaySpanClass != "" ? ` class=\"${awaySpanClass}\"` : ""}>${endDetails.a}</span></td>`);

            idx++;
        });

        // Score
        thead.append(`<th class="score"></th>`);
        homeRow.append(`<td class="score">${result.homeTeam.total}</td>`)
        awayRow.append(`<td class="score">${result.awayTeam.total}</td>`)


        // Details
        var homeDetails = tile.find('table.details-content tr').eq(0);
        var awayDetails = tile.find('table.details-content tr').eq(1);

        // Hide the header if the LSFE is already decided
        if ((result.homeTeam.lsd.total == null && result.homeTeam.lsfe == true) || (result.awayTeam.lsd.total == null && result.awayTeam.lsfe == true)) {
            tile.find('.details').hide();
        }

        homeDetails.find('td.noc').text(result.homeTeam.noc);
        homeDetails.find('td.lsfe').text(`${result.homeTeam.lsfe == true ? "✱" : ""}`);
        homeDetails.find('td').eq(2).text(result.homeTeam.lsd.cw != null ? Number(result.homeTeam.lsd.cw).toFixed(1) : null);
        homeDetails.find('td').eq(3).text(result.homeTeam.lsd.ccw != null ? Number(result.homeTeam.lsd.ccw).toFixed(1) : null);
        homeDetails.find('td.lsd').text(result.homeTeam.lsd.total != null ? `${Number(result.homeTeam.lsd.total).toFixed(1)}cm` : null);
        homeDetails.find('td.score span').text(result.homeTeam.total);

        awayDetails.find('td.noc').text(result.awayTeam.noc);
        awayDetails.find('td.lsfe').text(`${result.awayTeam.lsfe == true ? "✱" : ""}`);
        awayDetails.find('td').eq(2).text(result.awayTeam.lsd.cw != null ? Number(result.awayTeam.lsd.cw).toFixed(1) : null);
        awayDetails.find('td').eq(3).text(result.awayTeam.lsd.ccw != null ? Number(result.awayTeam.lsd.ccw).toFixed(1) : null);
        awayDetails.find('td.lsd').text(result.awayTeam.lsd.total != null ? `${Number(result.awayTeam.lsd.total).toFixed(1)}cm` : null);
        awayDetails.find('td.score span').text(result.awayTeam.total);

        // Stats panel
        $("#head-to-head .team-left").css('background-image', `url(https://livescores.worldcurling.org/flags/${result.homeTeam.noc}.svg)`);
        $("#head-to-head .team-right").css('background-image', `url(https://livescores.worldcurling.org/flags/${result.awayTeam.noc}.svg)`);

    }





    // ------------------ //
    // ----- STONES ----- //
    // ------------------ //
    const signalGroupStoneName = `${competition != null ? competition : "TEST"}-${eventId}-${sessionId}-${sheet != null && sheet != "" ? sheet : gameId}-${(isTestMode? "True": "False" )}-STONE`;
    var shotData, latestLiveData, latestStatsData, statsData;

    function startConnectionStones() {
        let stoneConnection = new signalR.HubConnectionBuilder()
            .withUrl(`${apiUrl}/notificationHub`, { withCredentials: false })
            .build();

        stoneConnection.on("StoneUpdated", function (data) {
            if (data == null || data.sheet != sheet) {
                return;
            }

            latestLiveData = data;
            latestStatsData = data.stats;

            // No stones in data: clear the
            if (data.stones.length == 0) {
                resetViewport();
            }

            adjustGameCenterDisplay(data.doStats, data.gameInfo);

            if ($("#is_live").is(":checked")) {
                updateLiveData(data);
            }

            // TODO if we change the status, maybe switch the stat that we're on to the status related one
            if ($("#is_stats").is(":checked")) {
                goToStat(current);
            }
        });

        stoneConnection.onclose(function () {
            // Handle connection closed event
            setOnlineHeader(false);
            console.error("Live connection closed. Retrying in 5 seconds");
            setTimeout(startConnectionStones, 5000);
        });

        stoneConnection.start().then(function () {
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
            if (gameId != null) {
                urlParams["gameId"] = gameId;
            }
            if (sheet != null) {
                urlParams["sheet"] = sheet;
            }
            // If none specified, default to game 1
            if (sheet == null && (gameId == null || gameId == 0)) {
                gameId = 1;
            }
            if (isTestMode != null) {
                urlParams["testMode"] = isTestMode == 1;
            }

            var callUrl = `${apiUrl}/Stone/LiveStones`

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
                    $('#slider').removeClass("notconnected");
                    $('#slider').addClass("connected");

                    // Build the scoreboard
                    latestLiveData = data;
                    latestStatsData = data.stats;

                    updateLiveData(data);

                    adjustGameCenterDisplay(data.doStats, data.gameInfo);

                    setOnlineHeader(true);

                    // Subscribe to real time updates
                    stoneConnection.invoke("SubscribeToGroup", signalGroupStoneName).catch(err => console.error(err.toString()));
                });
        }).catch(function (err) {
            setOnlineHeader(false);
            $('#slider').addClass("notconnected");
            // $('#slider').html("Connection unsuccessful.");
            setTimeout(startConnectionStones, 5000);
        });

    }

    function adjustGameCenterDisplay(doStats, gameInfo) {
        // If doStats is not defined, try to fetch it from the latest live data
        if (gameInfo != null && doStats != null && !doStats) {
            $('#game-content').hide();


            if (!$('table.scoreboard').is(':visible')) {
                $('table.scoreboard').show().css('display', 'table');
            }

            if (!$('#head-to-head').is(':visible')) {
                $('#head-to-head').show().css('display', 'flex');
                goToStat(0);
                animateAllStats(0);
            }

        }
    }

    function resetViewport() {
        $("#slider").empty();
        $("#slider").removeAttr('style');

        $indexButtonsContainer.empty();
        $indexButtonsStatsContainer.empty();

        $(".endstone select.current-stone").empty();
        $(".endstone select.current-end").empty();

        $("#currentShot .competitor td.flag img").attr('src', "");
        $("#currentShot .competitor td.flag img").attr('alt', "");
        $("#currentShot .competitor span.lastname").html("");
        $("#currentShot .competitor span.firstname").html("");
        $("#currentShot .shot-details span").empty();
        $("#currentShot .shot-details span.comment").empty();
        $("#currentShot .shot-details span.handle").html("");
        $("#currentShot .shot-details span.handle").removeClass("through cw ccw")
        $("#currentShot .shot-details span.accuracy").html("");

        $("#game-tile .matchup-tile .summary .home .team-clock").html("");
        $("#game-tile .matchup-tile .summary .away .team-clock").html("");
    }

    async function fetchStonesAsync(endId) {
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
            if (gameId != null) {
                urlParams["gameId"] = gameId;
            }
            if (sheet != null) {
                urlParams["sheet"] = sheet;
            }
            if (isTestMode != null) {
                urlParams["testMode"] = isTestMode == 1;
            }

            urlParams["endId"] = endId;

            var callUrl = `${apiUrl}/Stone/Stones`

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
            console.error('Error fetching data:', error);
        }
    }


    function updateLiveData(data) {
        shotData = data;
        statsData = data.stats;

        if (shotData.gameInfo != null) {
            refreshHeaderShotData();
        }

        if (shotData.stones.length > 0) {
            refreshShotList();
            renderDots();
            goTo(shotData.stones.length - 1);
        }

        if (statsData.length > 0) {
            refreshStatList();

            // TODO if we change the status, maybe switch the stat that we're on to the status related one
            goToStat(current);
        }
    }


    

    let $indexButtonsContainer;
    let $indexButtonsStatsContainer;
    let $arrowPrev, $arrowNext;
    let totalItems, currentIndex = 0;
    var statList = [];
    var currentEnd;

    let startX = 0, currentX = 0, isDragging = false;
    const swipeThreshold = 50;


    function renderBestFit(formattedName) {
        if (typeof formattedName !== "string") return formattedName;

        const match = formattedName.match(/^\{([^|]+)\|([^}]+)\}$/);
        if (!match) return formattedName;

        const [, shortName, longName] = match;
        return `<span class="shortName">${shortName}</span><span class="longName">${longName}</span>`;
    }

    function displayRowTitle(rowTitle) {
        if (typeof rowTitle !== "string") return rowTitle;

        const match = rowTitle.match(/^\{([^|]+)\|([^}]+)\}$/);
        if (!match) return rowTitle;

        const [, leftName, rightName] = match;
        return `<span class="leftName">${leftName}</span><span class="rightName">${rightName}</span>`;
    }

    function goTo(index, isManual = false) {
        var stoneCount = 16;

        // PZ Temp workaround, we want to have the # of stones in SSE
        var lineupNames = statsData.find(stat => stat.statName === "Line-ups");

        if (lineupNames != null) {
            stoneCount = lineupNames.rows.length == 2 ? 10 : 16;
        }

        // If index=-1, navigate to the previous end
        if (index == -1) {
            if (currentEnd > 1) {
                goToHistory(currentEnd - 1, stoneCount);
            }
            return;
        }
        if (index > stoneCount - 1) {
            if (currentEnd < latestLiveData.stones[0].endID) {
                goToHistory(currentEnd + 1);
            }
            return;
        }

        currentIndex = Math.max(0, Math.min(index, totalItems - 1));
        if (shotData.stones.length == currentIndex + 1 && isManual) {
            if (currentEnd == latestLiveData.stones[0].endID) {
                $("#is_live").prop('checked', true);
                updateLiveData(latestLiveData);
                return;
            }
        }

        // On manual navigation, remove the live
        if (isManual && $("#is_live").is(":checked")) {
            $("#is_live").prop('checked', false);
        }

        $slider.css({
            // transition: "transform 0.3s ease",
            transition: "none",
            transform: `translateX(-${currentIndex * 100}%)`
        });

        // Update shot info
        const shotInfo = shotData.stones[currentIndex];
        if (shotInfo === undefined) {
            return;
        }

        // update and resize the svg
        $(".svg-container").eq(index).html(shotInfo.svg + `<div class="svg-touch-overlay"></div>`);
        makeSVGResponsive($(".svg-container").eq(index).find("svg"));

        // add the next svg for a smarted swipe
        if (shotData.stones.length >= currentIndex) {
            // $(".svg-container").eq(index+1).html(shotData[currentIndex].svg + `<div class="svg-touch-overlay"></div>`);
            makeSVGResponsive($(".svg-container").eq(index - 1).find("svg"));
            makeSVGResponsive($(".svg-container").eq(index + 1).find("svg"));
        }

        $("#currentShot .competitor td.flag img").attr('src', `https://livescores.worldcurling.org/flags/${shotInfo.noc}.svg`);
        $("#currentShot .competitor td.flag img").attr('alt', shotInfo.teamName);
        $("#currentShot .competitor span.lastname").html(shotInfo.lastName);
        $("#currentShot .competitor span.firstname").html(shotInfo.firstName);
        $("#currentShot .shot-details span.type").html((shotInfo.stoneID > 5 && shotInfo.task == 4) ? "Wick" : curlTasks[shotInfo.task]);
        $("#currentShot .shot-details span.comment").html(shotInfo.comment);

        $("#currentShot .shot-details span.handle").removeClass("through cw ccw");

        // Through -- not considered
        if (shotInfo.task == "11") {
            $("#currentShot .shot-details span.handle").addClass("through");
            $("#currentShot .shot-details span.accuracy").html(`<span class="throughcomment">Not considered</span>`);
        }
        else if (shotInfo.pointsPrct >= "101") {
            $("#currentShot .shot-details span.handle").addClass(shotInfo.handleName);
            $("#currentShot .shot-details span.accuracy").html(`<span class="throughcomment">Not considered</span>`);
        }
        else {
            $("#currentShot .shot-details span.handle").addClass(shotInfo.handleName);
            $("#currentShot .shot-details span.accuracy").html(`${shotInfo.pointsPrct} %`);
        }



        // Update wrapper shadow (odd/even by slide index)
        $(".slider-wrapper")
            .removeClass("odd even")
            .addClass(shotInfo.homeTeam == 1 ? "odd" : "even");

        // Update stone select
        $(".endstone select.current-end").val(`${shotInfo.endID - 1}`);
        $(".endstone select.current-stone").val(`${index}`);

        renderDots();

        fitCompetitorNames();
    }

    // Fetch a different end
    async function goToHistory(endId, stoneId = 1) {
        // Disable the live if it isn't already
        if ($("#is_live").is(":checked")) {
            $("#is_live").prop('checked', false);
        }

        currentEnd = endId;

        shotData = await fetchStonesAsync(endId);
        // Special case: if we go back to the latest available end, do not show history stats but bind them to the latest live
        if (shotData.stones[0].endID == latestLiveData.stones[0].endID) {
            statsData = latestStatsData;
        }
        else {
            statsData = shotData.stats;
        }

        $("#slider").empty();
        $(".endstone select.current-stone").empty();

        shotData.stones.forEach((shot, idx) => {

            $("#slider").append(`<div class="item">
      <div class="svg-container">${shot.svg}</div>
      </div>`);

            $(".endstone select.current-stone").append(`<option value="${idx}">Stone ${idx + 1}</option>`);
        });

        totalItems = $slider.children().length;


        refreshStatList();
        if ($("#is_stats").is(":checked")) {
            goToStat(current);
        }

        renderDots();
        goTo(stoneId == 99 ? shotData.stones.length - 1 : stoneId - 1, true);
    }

    function fitCompetitorNames() {
        $('.lastname').each(function () {
            var lastNameSize = fitText($(this), 22);
            fitText($(this).closest('.competitor').find(".firstname"), lastNameSize, lastNameSize);
        });

    }

    function renderDots() {
        $indexButtonsContainer.empty();

        const maxVisible = 3;
        const halfWindow = Math.floor(maxVisible / 2);

        let start = Math.max(0, currentIndex - halfWindow);
        let end = Math.min(totalItems - 1, currentIndex + halfWindow);

        // Adjust window if fewer than maxVisible
        if (end - start + 1 < maxVisible) {
            if (start === 0) {
                end = Math.min(totalItems - 1, start + maxVisible - 1);
            } else if (end === totalItems - 1) {
                start = Math.max(0, end - (maxVisible - 1));
            }
        }

        // Left ellipsis
        if (start > 0) {
            $("<button>").addClass("ellipsis").appendTo($indexButtonsContainer);
        }

        // Main dots
        for (let i = start; i <= end; i++) {
            const $btn = $("<button>");
            if (i === currentIndex) $btn.addClass("active");
            $btn.on("click", () => goTo(i));
            $indexButtonsContainer.append($btn);
        }

        // Right ellipsis
        if (end < totalItems - 1) {
            $("<button>").addClass("ellipsis").appendTo($indexButtonsContainer);
        }
    }


    function renderStatsDots() {
        $indexButtonsStatsContainer.empty();

        const maxVisible = 3;
        const halfWindow = Math.floor(maxVisible / 2);

        var totalStats = statList.length;

        let start = Math.max(0, current - halfWindow);
        let stat = Math.min(totalStats - 1, current + halfWindow);

        // Adjust window if fewer than maxVisible
        if (stat - start + 1 < maxVisible) {
            if (start === 0) {
                stat = Math.min(totalStats - 1, start + maxVisible - 1);
            } else if (stat === totalStats - 1) {
                start = Math.max(0, stat - (maxVisible - 1));
            }
        }

        // Left ellipsis
        if (start > 0) {
            $("<button>").addClass("ellipsis").appendTo($indexButtonsStatsContainer);
        }

        // Main dots
        for (let i = start; i <= stat; i++) {
            const $btn = $("<button>");
            if (i === current) $btn.addClass("active");
            $btn.on("click", () => goToStat(i));
            $indexButtonsStatsContainer.append($btn);
        }

        // Right ellipsis
        if (stat < totalStats - 1) {
            $("<button>").addClass("ellipsis").appendTo($indexButtonsStatsContainer);
        }
    }

    function makeSVGResponsive($svg) {
        const w = $svg.attr("width");
        const h = $svg.attr("height");

        if (w && h) {
            $svg.attr("viewBox", `0 0 ${parseFloat(w)} ${parseFloat(h)}`);
        }

        // Remove hardcoded attributes so CSS can take over
        $svg.removeAttr("width").removeAttr("height");

        // Keep proportions
        $svg.attr("preserveAspectRatio", "xMidYMid meet");
    }


    function fitText($el, maxSize = 32, minSize = 12) {
        const maxWidth = $("#currentShot").width() - $("#currentShot .flag").width();
        let fontSize = maxSize;

        $el.css({
            "white-space": "normal",
            "font-size": fontSize + "px",
        });

        if (maxSize == minSize) {
            $el.css("font-size", maxSize + "px");
        }
        else {
            while ($el[0].scrollWidth >= maxWidth + 0.01 && fontSize > minSize) {
                fontSize--;
                $el.css("font-size", fontSize + "px");
            }
            return fontSize;
        }
    }


    function animateAllStats(statIndex = 0) {
        var currentStats = statsData[statIndex];

        // Add/remove rows
        var $template = $(".stat-row-template");
        var rowCount = $(".stat-row").length;

        if (currentStats == null) {
            return;
        }

        // Add the rows if they do not exist
        for (let i = 0; i < currentStats.rows.length; i++) {
            var $existingItem = $(`.stat-row:eq(${i})`)

            if ($existingItem.length == 0) {
                let $newRow = $template.clone();
                $newRow.removeClass('stat-row-template');
                $newRow.addClass('stat-row');

                $('.stats-container').append($newRow);
            }
        }

        // Cleanup the subsequent rows
        for (let j = currentStats.rows.length; j < rowCount; j++) {
            $(`.stat-row:eq(${j - 3})`).remove();
        }

        // Cleanup all the infos
        $(".info-left, .info-right").empty();

        var $rows = $(".stat-row");

        if ($rows.length > 6) {
            $(".team-left, .team-right").addClass("shift");
        }
        else {
            $(".team-left, .team-right").removeClass("shift");
        }

        if (currentStats.isStat) { // Stat slide

            $(".stats-container").find(".text-line").hide();
            $(".stats-container").find(".bar-line").show();

            // Animate each row
            $rows.each(function (idx) {
                const $row = $(this);
                var rowTitle = currentStats.rows[idx].rowTitle;
                $row.find(".label").html(displayRowTitle(rowTitle));

                // Show the players names on stat labels
                var lineupNames = statsData.find(stat => stat.statName === "Line-ups");

                if (lineupNames != null && lineupNames.rows != null && lineupNames.rows.length > 0) {
                    var posLineup = lineupNames.rows.find(lineup => lineup.rowTitle == rowTitle);

                    if (posLineup != null) {
                        $row.find(".label-left").html(posLineup.rowValueRed != "" ? renderBestFit(posLineup.rowValueRed) : "");
                        $row.find(".label-right").html(posLineup.rowValueYellow != "" ? renderBestFit(posLineup.rowValueYellow) : "");
                    }
                }

                $row.data('left', currentStats.rows[idx].rowValueRed);
                $row.data('right', currentStats.rows[idx].rowValueYellow);

                let denominator = 0;
                let fromCenter = currentStats.rows[idx].rowValueMax != null;

                // Find max
                if (fromCenter) {
                    denominator = parseFloat(currentStats.rows[idx].rowValueMax) * 2;
                    $row.find(".mirror-bar").addClass("fromCenter");
                }
                else {
                    $row.find(".mirror-bar").removeClass("fromCenter");
                    const dataLeft = parseFloat($row.data('left'));
                    const dataRight = parseFloat($row.data('right'));

                    // Check if data-left is a valid number and update denominator
                    if (!isNaN(dataLeft)) {
                        denominator += dataLeft;
                    }

                    // Check if data-right is a valid number and update denominator
                    if (!isNaN(dataRight)) {
                        denominator += dataRight;
                    }
                }


                if (currentStats.unit == "cm") {
                    var left = parseFloat($row.data("left")).toFixed(1);
                    var right = parseFloat($row.data("right")).toFixed(1);
                }
                else {
                    var left = parseFloat($row.data("left"), 10);
                    var right = parseFloat($row.data("right"), 10);
                }

                var leftPct;
                var rightPct;

                // If one side filled only, give it 50% and 0% to the other
                if (!fromCenter && !isNaN(left) && isNaN(right)) {
                    leftPct = 50;
                    rightPct = 0;
                }
                else if (!fromCenter && isNaN(left) && !isNaN(right)) {
                    leftPct = 0;
                    rightPct = 50;
                }
                else {
                    leftPct = !isNaN(left) ? parseFloat(((left / denominator) * 100).toFixed(2)) : 0;
                    rightPct = !isNaN(right) ? parseFloat(((right / denominator) * 100).toFixed(2)) : 0;

                    // If the rounds do not add up to exactly 100, give it to the red team
                    let leftRight = leftPct + rightPct;
                    if (fromCenter == false && leftRight > 0 && leftRight < 100) {
                        leftPct = leftPct + 100 - leftRight;
                    }

                    // Special case, LSD
                    if (currentStats.rows[idx].rowValueMax == -1) {
                        $row.find(".count-left").html('');
                        $row.find(".count-right").html('');
                        $row.find(".label-left, .label-right").html("");
                        leftPct = rightPct = 50;
                    }
                    else {
                        $row.find(".bar-left").html('');
                        $row.find(".bar-right").html('');
                    }
                }



                // Normalize
                if (!isNaN(left)) {
                    $row.find(".value-left").html(currentStats.unit != null ? left + `<span class='unit'>${currentStats.unit}</span>` : left);
                }
                else {
                    $row.find(".value-left").html("-");
                }

                if (!isNaN(right)) {
                    $row.find(".value-right").html(currentStats.unit != null ? right + `<span class='unit'>${currentStats.unit}</span>` : right);
                }
                else {
                    $row.find(".value-right").html("-");
                }

                // Reset bar values
                // $row.find(".bar-left, .bar-right").html("");

                var barValueRed = currentStats.rows[idx].rowBarValueRed;
                var barValueYellow = currentStats.rows[idx].rowBarValueYellow;

                // Animate
                setTimeout(() => {
                    if (currentStats.rows[idx].rowValueMax == -1) {
                        $row.find(".bar-left").html(barValueRed != null && barValueRed != "0" ? renderBestFit(barValueRed) : "");
                        $row.find(".bar-right").html(barValueYellow != null && barValueYellow != "0" ? renderBestFit(barValueYellow) : "");
                    }
                    else {
                        $row.find(".count-left").html(barValueRed != null && barValueRed != "0" ? barValueRed : "");
                        $row.find(".count-right").html(barValueYellow != null && barValueYellow != "0" ? barValueYellow : "");
                        $row.find(".bar-left").css("width", leftPct + "%");
                        $row.find(".bar-right").css("width", rightPct + "%");
                    }

                    $row.find(".bar-left").css("width", leftPct + "%");
                    $row.find(".bar-right").css("width", rightPct + "%");
                }, 100);
            });
        }
        else { // Text slide

            $(".stats-container").find(".bar-line").hide();
            $(".stats-container").find(".text-line").show();
            $rows.each(function (idx) {
                const $row = $(this);
                $row.find(".label").html(currentStats.rows[idx].rowTitle);

                // Reset bars
                $row.find(".label-left, .label-right").html("");
                $row.find(".bar-left, .bar-right").css("width", "0");

                $row.find(".info-left").html(currentStats.rows[idx].rowInfoRed);
                $row.find(".info-right").html(currentStats.rows[idx].rowInfoYellow);
                $row.find(".text-left").html(renderBestFit(currentStats.rows[idx].rowValueRed));
                $row.find(".text-right").html(renderBestFit(currentStats.rows[idx].rowValueYellow));

            });
        }
    }

    function refreshStatList() {
        var newStatList = statsData.map(stat => stat.statName);

        if (statList == newStatList) {
            return;
        }
        else {

            var LSD = "Last Stone Draw";

            // Special case : the old Stat List did not contain LSD and the new one does, set it as Current
            if (statList != null && !statList.includes(LSD) && newStatList.includes(LSD)) {
                current = newStatList.indexOf(LSD);
            }

            statList = newStatList;
            $statSlider.empty();

            statsData.forEach(stat => {
                $statSlider.append(`<span class="header-item">${stat.statName}</span>`);
            });
        }

        renderStatsDots();
    }

    function refreshHeaderShotData() {
        var $headerTile = $("#game-tile .matchup-tile .summary");
        var timeOutRemaining = shotData.gameInfo.rows.find(r => r.rowTitle == "TIMEOUT_REMAINING");
        var timeRemaining = shotData.gameInfo.rows.find(r => r.rowTitle == "TIME_REMAINING");
        var timeOut = shotData.gameInfo.rows.find(r => r.rowTitle == "TIMEOUT");

        // reset the timeout indicators (maybe)
        // $headerTile.find(".home .team-clock").removeClass("timeout active");
        // $headerTile.find(".away .team-clock").removeClass("timeout active");
        if (timeRemaining != null) {
            $headerTile.find(".home .team-clock").html(timeRemaining.rowValueRed);
            $headerTile.find(".away .team-clock").html(timeRemaining.rowValueYellow);

            if (timeOutRemaining != null) {
                $headerTile.find(".home .team-clock").toggleClass("timeout", timeOutRemaining.rowValueRed == "1");
                $headerTile.find(".away .team-clock").toggleClass("timeout", timeOutRemaining.rowValueYellow == "1");
            }

            // If timeout active, highlight it
            if (timeOut != null) {
                if (timeOut.rowValueRed == "1") {
                    $headerTile.find(".home .team-clock").toggleClass("timeout active", true);
                }
                else {
                    $headerTile.find(".home .team-clock").removeClass("active");
                }

                if (timeOut.rowValueYellow == "1") {
                    $headerTile.find(".away .team-clock").toggleClass("timeout active", true);
                }
                else {
                    $headerTile.find(".away .team-clock").removeClass("active");
                }
            }

        }



        // $headerTile.find(".home .team-clock").html(shotData.gameInfo);
        // $headerTile.find(".home .team-clock").html("");
    }

    function refreshShotList() {
        $slider.empty();
        $(".endstone select.current-end").empty();
        $(".endstone select.current-stone").empty();

        if (shotData.stones.length > 0) {
            currentEnd = shotData.stones[0].endID;

            for (let i = 0; i < currentEnd; i++) {
                $(".endstone select.current-end").append(`<option value="${i}">End ${i + 1}</option>`);
            }
        }

        shotData.stones.forEach((shot, idx) => {
            $slider.append(`<div class="item">
      <div class="svg-container">${shot.svg}</div>
      </div>`);

            $(".endstone select.current-stone").append(`<option value="${idx}">Stone ${idx + 1}</option>`);
        });

        totalItems = $slider.children().length;
    }

    function scrollToGameCenter() {
        var targetOffset = $('.menu1').offset().top;

        // Animate the scroll to that position
        $('html, body').animate({
            scrollTop: targetOffset
        }, 500); // 1000 is the duration in milliseconds
    }


    function switchTheme(color) {
        $("#csstheme").attr("href", `https://livescores.worldcurling.org/pg/CSS/${color}.css`);
        $("#scoretheme").attr("href", `css/livescores_${color}.css`);

    }



    $(window).on('resize', function () {
        fitCompetitorNames();
    });


    $(document).on("change", '.header-content .sheet', function () {

        var newSheetValue = $(this).val();

        var currentUrl = new URL(window.location.href);
        var searchParams = currentUrl.searchParams;

        searchParams.set('Sheet', newSheetValue);

        currentUrl.search = searchParams.toString();

        window.location.href = currentUrl.href;
    });


    $(document).on('change', "select.current-end", function () {
        goToHistory(parseInt($(this).val()) + 1, 99);
    });

    $(document).on('change', "select.current-stone", function () {
        goTo(parseInt($(this).val()), true);
    });



    $indexButtonsContainer = $("#indexButtons");
    $indexButtonsStatsContainer = $("#indexButtonsStats");
    $arrowPrev = $("#arrowPrev");
    $arrowNext = $("#arrowNext");


    $arrowPrev.on("click", () => goTo(currentIndex - 1, true));
    $arrowNext.on("click", () => goTo(currentIndex + 1, true));

    $("#bfbblue").on("click", () => switchTheme("blue"));
    $("#bfbwhite").on("click", () => switchTheme("white"));


    // ---------- //
    // SVG slider //
    // ---------- //
    const $overlay = $("#slider");
    let pinchActive = false;

    $slider.on("touchstart", function (e) {
        const touches = e.originalEvent.touches;
        if (touches.length > 1) {
            // two-finger pinch → allow browser zoom/pan
            pinchActive = true;
            $overlay.css("pointer-events", "none");
            return;
        }
        pinchActive = false;
        startX = touches[0].clientX;
        isDragging = true;
        $slider.css("transition", "none");
    });

    $slider.on("touchmove", function (e) {
        const touches = e.originalEvent.touches;
        if (pinchActive || !isDragging || touches.length > 1) return; // ignore pinch
        currentX = touches[0].clientX;
        const deltaX = currentX - startX;
        $slider.css(
            "transform",
            `translateX(calc(-${currentIndex * 100}% + ${deltaX}px))`
        );
    });

    $slider.on("touchend", function (e) {
        if (pinchActive) {
            // finished pinch → re-enable overlay
            pinchActive = false;
            $overlay.css("pointer-events", "auto");
            return;
        }
        if (!isDragging) return;
        isDragging = false;
        const deltaX = currentX - startX;
        if (Math.abs(deltaX) > swipeThreshold) {
            if (deltaX < 0 && !(currentIndex == totalItems - 1 && currentEnd == latestLiveData.stones[0].endID)) {
                currentIndex++;
            } else if (deltaX > 0 && !(currentEnd == 1 & currentIndex == 0)) {
                currentIndex--;
            }
        }
        goTo(currentIndex, true);
    });


    $('span.btn-slider').on('click', function () {

        var target = $(this).data("target");

        if (target == "stats") {
            var $h2h = $('#head-to-head');
            $h2h.slideToggle(500);
            if ($h2h.is(':visible')) {
                $h2h.css('display', 'flex');
            }

            var landingStatIndex = latestGameStatus != null ? getStatIndexFromStatus(latestGameStatus) : null;

            goToStat(landingStatIndex != null && landingStatIndex != -1 ? landingStatIndex : 0);
            animateAllStats(landingStatIndex != null && landingStatIndex != -1 ? landingStatIndex : 0);
        }
        else if (target == "scoreboard") {

            var $scb = $('table.scoreboard');
            $scb.slideToggle(500);
            if ($scb.is(':visible')) {
                $scb.css('display', 'table');
            }
        }
        else if (target == "live") {
            if (!$("#is_live").is(":checked")) {
                updateLiveData(latestLiveData);
            }
        }

        scrollToGameCenter();
    });


    function getStatIndexFromStatus(status) {
        let statTitle;

        switch (status.toUpperCase()) {
            case 'PLANNED':
            case 'SCHEDULED':
            case 'PREPARING':
            case 'RESCHEDULED':
            case 'POSTPONED':
            case 'CANCELLED':
            case 'DELAYED':
                statTitle = "Line-ups";
                break;
            case 'GETTING READY':
            case 'READY':
                statTitle = "Last Stone Draw";
                break;
            default:
                statTitle = "Game";
                break;
        }

        return latestStatsData.findIndex(item => item.statName === statTitle);
    }

    // ------------ //
    // Stats Slider //
    // ------------ //
    const $h2h = $("#head-to-head");
    const $headers = $("#head-to-head .headers");
    const $statSlider = $("#head-to-head .headers-slider");
    let expanded = false;
    let swiped = false;


    function goToStat(index) {
        var total = $("#head-to-head .headers-slider").children().length;
        // wrap index around
        if (index < 0) {
            current = total - 1;
        } else if (index >= total) {
            current = 0;
        } else {
            current = index;
        }

        $statSlider.css("transition", "transform 0.3s ease");
        $statSlider.css("transform", `translateX(-${current * 100}%)`);
        $statSlider.children().removeClass("active").eq(current).addClass("active");


        renderStatsDots();

        animateAllStats(current);
    }



    // ------------------ //
    // ----- EVENTS ----- //
    // ------------------ //
    $("#head-to-head").on("click", function (e) {
        if (expanded && !$(e.target).closest(".headers").length) {
            $headers.removeClass("expanded");
            expanded = false;
        }
    });

    // In expanded mode: clicking item jumps and closes menu
    $("#head-to-head .headers-slider").on("click", "> *", function (e) {
        if (expanded) {
            $("#head-to-head .headers").removeClass("expanded");
            expanded = false;
            goToStat($(this).index());
            e.stopPropagation();
        }
    });

    // Toggle expand on click of the headers box
    $headers.on("click", function () {
        expanded = !expanded;
        $(this).toggleClass("expanded", expanded);
    });



    // Arrow clicks
    $("#head-to-head .header-prev").on("click", function (e) {
        if (swiped) {
            e.preventDefault();
            e.stopPropagation();
            return;
        }
        goToStat(current - 1);
    });
    $("#head-to-head .header-next").on("click", function (e) {
        if (swiped) {
            e.preventDefault();
            e.stopPropagation();
            return;
        }
        goToStat(current + 1);
    });

    // Swipe
    const $leftFeedback = $("#head-to-head .swipe-feedback.left");
    const $rightFeedback = $("#head-to-head .swipe-feedback.right");

    // --- Swipe detection ---
    $h2h.on("touchstart", function (e) {
        swiped = false;
        startX = e.originalEvent.touches[0].clientX;
        isDragging = true;
    });

    $h2h.on("touchmove", function (e) {
        if (!isDragging) return;
        currentX = e.originalEvent.touches[0].clientX;
        const deltaX = currentX - startX;

        // Calculate relative intensity (0–1)
        const intensity = Math.min(1, Math.abs(deltaX) / 150);

        if (deltaX < 0) {
            // swiping left → darken right side
            $rightFeedback.css("opacity", intensity);
            $leftFeedback.css("opacity", 0);
        } else {
            // swiping right → darken left side
            $leftFeedback.css("opacity", intensity);
            $rightFeedback.css("opacity", 0);
        }
    });

    $h2h.on("touchend", function (e) {
        if (!isDragging) {
            return;
        }
        isDragging = false;

        $leftFeedback.css("opacity", 0);
        $rightFeedback.css("opacity", 0);

        const dx = currentX - startX;
        if (Math.abs(dx) > swipeThreshold) {
            swiped = true;
            if (dx < 0) {
                e.stopPropagation();
                goToStat(current + 1);
            }
            else {
                e.stopPropagation();
                goToStat(current - 1);
            }
        }
    });



    startConnectionResults();
    startConnectionStones();



    function setOnlineHeader(online) {
        var updateIcon;
        if (document.getElementById('RefreshButton') != null)
            updateIcon = document.getElementById('RefreshButton');
        if (online) {
            $sessionHeader.removeClass("offline");
            $sessionHeader.addClass("online");
            if (updateIcon != null)
                updateIcon.src = "../general/online.png";
        }
        else {
            $sessionHeader.removeClass("online");
            $sessionHeader.addClass("offline");
            if (updateIcon != null)
                updateIcon.src = "../general/offline.png";
        }
    }







    // --------------------- //
    // ----- RECORDING ----- //
    // --------------------- //
    if (isDebug == 1) {

        let signalrRecordings = [];

        // Capture both event streams
        function recordEvent(source, eventName, data) {
            signalrRecordings.push({
                timestamp: new Date().toISOString(),
                source,
                eventName,
                data
            });
        }

        // Hook into both SignalR handlers
        // Wrap ReceiveMessage
        const originalRenderTileData = renderTileData;
        renderTileData = function (resultList) {
            recordEvent("Results", "ReceiveMessage", resultList);
            originalRenderTileData(resultList);
        };

        // Wrap StoneUpdated
        const originalUpdateLiveData = updateLiveData;
        updateLiveData = function (data) {
            recordEvent("Stones", "StoneUpdated", data);
            originalUpdateLiveData(data);
        };

        // Periodically download to JSON file (every 2 minutes)
        setInterval(() => {
            if (signalrRecordings.length > 0) {
                const blob = new Blob(
                    [JSON.stringify(signalrRecordings, null, 2)],
                    { type: "application/json" }
                );
                const url = URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url;
                a.download = `signalr-recording-${new Date().toISOString().replace(/[:.]/g, "-")}.json`;
                a.click();
                URL.revokeObjectURL(url);
                // Clear after saving
                // signalrRecordings = [];
            }
        }, 120000); // every 120 seconds

        // Optional: save once before leaving
        window.addEventListener("beforeunload", () => {
            if (signalrRecordings.length > 0) {
                const blob = new Blob([JSON.stringify(signalrRecordings, null, 2)], { type: "application/json" });
                const a = document.createElement("a");
                a.href = URL.createObjectURL(blob);
                a.download = `signalr-recording-final.json`;
                a.click();
            }
        });

    }


});

