$(document).ready(function () {
  // Version 0.1 from 22.8.25
  //const apiUrl = "https://livescores.worldcurling.org/curlitsse";
  const apiUrl = "http://sse.curlit.local:5057";

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
  var season = params.get("Season");
  var competition = params.get("Competition");
  var eventId = params.get("EventID") ?? 0;
  var sessionId = params.get("SessionID") ?? 0;
  // TODO PZ see later how to pass the Game ID (iFrame?)

  if (document.getElementById('ContentMain_HiddenSeason') != null)
    season = document.getElementById('ContentMain_HiddenSeason').value;
  if (document.getElementById('ContentMain_HiddenCompetition') != null)
    competition = document.getElementById('ContentMain_HiddenCompetition').value;
  if (document.getElementById('ContentMain_HiddenEventID') != null)
    eventId = document.getElementById('ContentMain_HiddenEventID').value ?? 0;
  if (document.getElementById('ContentMain_HiddenSessionID') != null)
    sessionId = document.getElementById('ContentMain_HiddenSessionID').value ?? 0;

  const competitionCode = pathSegments[1] ?? competition;

  // TODO PZ Remove that
  season = 2526;
  competition = "PREOQE";
  eventId = 1;
  sessionId = 3;
  gameId = 1;
  // ENDTODO PZ
  
  const signalGroupName = `${competition != null ? competition : "TEST"}-${eventId}-${sessionId}`;


  
  const $sessionHeader = $('#session-header');
  const $slider = $('#slider');
  const $gameTile = $('#game-tile');

  // ------------------- //
  // ----- RESULTS ----- //
  // ------------------- //
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
                $('#slider').empty();
                $("#loader").hide();

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


  function renderTileData(data) {
    var result = data.find(g => g.gameID === gameId);

    if (result) {
      feedTileUI($gameTile, result);
    }
    else {
      debugger;
      // TODO Place an error in the DOM. But this should never happen.
    };
}


  // TODO this method should be moved to a common JS between result/stones
  function feedTileUI(tile, result) {
    // Header
    tile.find('.matchup-tile').attr('class', `matchup-tile ${result.status}`);

    tile.find('span.sheet').text(result.sheet);

    let $leftText = tile.find('span.left-text');
    var leftText = result.gamesTitle;
    $leftText.removeClass("longText");
    $leftText.removeClass("shortSessionName");
    // Special case - shorten the session title if it contains Women's Round Robin (only on smaller devices)
    var sequenceToStrip = "Women's Round Robin";
    if (leftText.length > 28 && leftText.indexOf(sequenceToStrip) != -1) {
        leftText = leftText.replace(sequenceToStrip, "Women's <span class='wideScreenText'>Round Robin</span>");
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
    $rightComment.removeClass("longText");
    $rightComment.html(result.gameComment);
    if (result.gameComment != null && result.gameComment != '' && result.gameComment.length > 14) {
        $rightComment.addClass("longText");
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
    tile.find('.summary .home .team-history').text(result.homeTeam.history);
    tile.find('.summary .home .team-history').attr('title', `wins - losses`);

    // Away team
    tile.find('.summary .away img.flag').attr('src', `https://livescores.worldcurling.org/flags/${result.awayTeam.noc}.svg`);
    tile.find('.summary .away .team-name').html(`<span class='short'>${result.awayTeam.teamShortName}</span><span class='long'>${result.awayTeam.teamLongName}</span>`);
    tile.find('.summary .away .score').text(result.awayTeam.total);
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
    homeRow.append(`<td class="lsfe">${result.homeTeam.lsfe == true ? "*" : ""}</td>`)
    awayRow.append(`<td class="lsfe">${result.awayTeam.lsfe == true ? "*" : ""}</td>`)

    // LSD (only on desktop)
    if (result.homeTeam.lsd.total != null) {
        thead.append(`<th class="lsd-lsfe" colspan=3>LSD/LSFE</th>`);
        homeRow.append(`<td class="lsd-lsfe" colspan=2><span>${result.homeTeam.lsd.total != null ? Number(result.homeTeam.lsd.total).toFixed(1) + "cm" : ""}</span></td><td class="lsd-lsfe">${result.homeTeam.lsfe == true ? "*" : ""}</td>`)
        awayRow.append(`<td class="lsd-lsfe" colspan=2><span>${result.awayTeam.lsd.total != null ? Number(result.awayTeam.lsd.total).toFixed(1) + "cm" : ""}</span></td><td class="lsd-lsfe">${result.awayTeam.lsfe == true ? "*" : ""}</td>`)
    }
    else {
        thead.append(`<th class="lsd-lsfe" colspan=2>LSFE</th><th></th>`);
        homeRow.append(`<td class="lsd-lsfe-center" colspan=2><span>${result.homeTeam.lsfe == true ? "*" : ""}</td><td></td>`)
        awayRow.append(`<td class="lsd-lsfe-center" colspan=2><span>${result.awayTeam.lsfe == true ? "*" : ""}</td><td></td>`)
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
    homeDetails.find('td.lsfe').text(`${result.homeTeam.lsfe == true ? "*" : ""}`);
    homeDetails.find('td').eq(2).text(result.homeTeam.lsd.cw != null ? Number(result.homeTeam.lsd.cw).toFixed(1) : null);
    homeDetails.find('td').eq(3).text(result.homeTeam.lsd.ccw != null ? Number(result.homeTeam.lsd.ccw).toFixed(1) : null);
    homeDetails.find('td.lsd').text(result.homeTeam.lsd.total != null ? `${Number(result.homeTeam.lsd.total).toFixed(1)}cm` : null);
    homeDetails.find('td.score span').text(result.homeTeam.total);

    awayDetails.find('td.noc').text(result.awayTeam.noc);
    awayDetails.find('td.lsfe').text(`${result.awayTeam.lsfe == true ? "*" : ""}`);
    awayDetails.find('td').eq(2).text(result.awayTeam.lsd.cw != null ? Number(result.awayTeam.lsd.cw).toFixed(1) : null);
    awayDetails.find('td').eq(3).text(result.awayTeam.lsd.ccw != null ? Number(result.awayTeam.lsd.ccw).toFixed(1) : null);
    awayDetails.find('td.lsd').text(result.awayTeam.lsd.total != null ? `${Number(result.awayTeam.lsd.total).toFixed(1)}cm` : null);
    awayDetails.find('td.score span').text(result.awayTeam.total);
  }





  // ------------------ //
  // ----- STONES ----- //
  // ------------------ //
  const signalGroupStoneName = `${competition != null ? competition : "TEST"}-${eventId}-${sessionId}-${gameId}-STONE`;

  var shotData, statsData, latestLiveData;

  function startConnectionStones() {
    let stoneConnection = new signalR.HubConnectionBuilder()
      .withUrl(`${apiUrl}/notificationHub`, { withCredentials: false })
      .build();

      stoneConnection.on("StoneUpdated", function (data) {
      latestLiveData = data;

      if ($("#is_live").is(":checked")) {
        updateLiveData(data);
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

          updateLiveData(data);

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
    
    if (data.length > 0) {
      refreshShotList();
      renderDots();
      
      goTo(shotData.length - 1);
      
    }
  }


  statsData = [
    {
      statName: "Line-ups",
      is_stat: false,
      unit: null,
      rows: [
        {
          row_index: 1,
          row_title: "Fourth",
          row_info_red: "Skip",
          row_value_red: "SCHMIDT J.",
          row_value_yellow: "WIPF K.", 
          row_info_yellow: "Skip"
        },
        {
          row_index: 2,
          row_title: "Third",
          row_info_red: "Vice-Skip",
          row_value_red: "QVIST A.",
          row_value_yellow: "MACAULAY Ky",
          row_info_yellow: "Vice-Skip"
        },
        {
          row_index: 3,
          row_title: "Second",
          row_value_red: "JURLANDER BOEGE",
          row_value_yellow: "KEENAN M.",
          row_info_yellow: null
        },
        {
          row_index: 4,
          row_title: "Lead",
          row_value_red: "GOLDBECK L.",
          row_value_yellow: "CINNAMON M.",
          row_info_yellow: null
        },
        {
          row_index: 5,
          row_title: "Alternate",
          row_value_red: "JENSEN N.",
          row_value_yellow: "NAUGLER A.",
          row_info_yellow: null
        }
      ]
    },
    {
      statName: "Last Stone Draw",
      is_stat: true,
      unit: "cm",
      rows: [
        {
          row_index: 1,
          row_title: "clockwise ↻",
          row_bar_value_red: "QVIST A.",
          row_value_red: 116.7,
          row_value_yellow: 10.9,
          row_value_max: -1,
          row_bar_value_yellow: "CINNAMON M."
        },
        {
          row_index: 2,
          row_title: "counter-clockwise ↺",
          row_bar_value_red: "JENSEN N.",
          row_value_red: 122.2,
          row_value_yellow: 85.4,
          row_value_max: -1,
          row_bar_value_yellow: "MACAULAY Ky"
        },
        {
          row_index: 3,
          row_title: "Total",
          row_value_red: 238.9,
          row_value_yellow: 96.3,
          row_value_max: 399.2
        }
      ]
    },
    {
      statName: "Draws",
      is_stat: true,
      unit: "%",
      rows: [
        {
          row_index: 1,
          row_title: "Fourth",
          row_bar_value_red: 11,
          row_value_red: 68,
          row_value_yellow: 77,
          row_bar_value_yellow: 14
        },
        {
          row_index: 2,
          row_title: "Third",
          row_bar_value_red: 11,
          row_value_red: 86,
          row_value_yellow: 75,
          row_bar_value_yellow: 8
        },
        {
          row_index: 3,
          row_title: "Second",
          row_bar_value_red: 10,
          row_value_red: 75,
          row_value_yellow: 89,
          row_bar_value_yellow: 9
        },
        {
          row_index: 4,
          row_title: "Lead",
          row_bar_value_red: 20,
          row_value_red: 83,
          row_value_yellow: 69,
          row_bar_value_yellow: 20
        },
        {
          row_index: 5,
          row_title: "Alternate",
          row_bar_value_red: null,
          row_value_red: null,
          row_value_yellow: null,
          row_bar_value_yellow: null
        },
        {
          row_index: 6,
          row_title: "Team",
          row_bar_value_red: 11,
          row_value_red: 79,
          row_value_yellow: 52,
          row_bar_value_yellow: 51
        }
      ]
    }
  ]

  let $firstBtn, $prevBtn, $nextBtn, $lastBtn, $indexButtonsContainer;
  let $arrowPrev, $arrowNext;
  let totalItems, currentIndex = 0;

  let startX = 0, currentX = 0, isDragging = false;
  const swipeThreshold = 50;

  function goTo(index, isManual = false) {
    // On manual navigation, remove the live
    if (isManual && $("#is_live").is(":checked")) {
      $("#is_live").prop('checked', false);
    }
    
    currentIndex = Math.max(0, Math.min(index, totalItems - 1));
    $slider.css({
      // transition: "transform 0.3s ease",
      transition: "none",
      transform: `translateX(-${currentIndex * 100}%)`
    });

    // Update shot info
    const shotInfo = shotData[currentIndex];
    if (shotInfo === undefined) {
      return;
    }

    // update and resize the svg
    $(".svg-container").eq(index).html(shotInfo.svg + `<div class="svg-touch-overlay"></div>`);
    makeSVGResponsive($(".svg-container").eq(index).find("svg"));

    // add the next svg for a smarted swipe
    if (shotData.length >= currentIndex) {
      // $(".svg-container").eq(index+1).html(shotData[currentIndex].svg + `<div class="svg-touch-overlay"></div>`);
      makeSVGResponsive($(".svg-container").eq(index+1).find("svg"));
    }
    
    $("#currentShot .competitor td.flag img").attr('src', `https://livescores.worldcurling.org/flags/${shotInfo.noc}.svg`);
    $("#currentShot .competitor td.flag img").attr('alt', shotInfo.teamName);
    $("#currentShot .competitor span.lastname").html(shotInfo.lastName);
    $("#currentShot .competitor span.firstname").html(shotInfo.firstName);
    $("#currentShot .shot-details span.type").html(curlTasks[shotInfo.task]);
    $("#currentShot .shot-details span.handle")
      .removeClass("cw ccw")
      .addClass(shotInfo.handleName);
    $("#currentShot .shot-details span.accuracy").html(`${shotInfo.pointsPrct} %`);
    $("#currentShot .shot-details span.comment").html(shotInfo.comment);



    // Update wrapper shadow (odd/even by slide index)
    $(".slider-wrapper")
      .removeClass("odd even")
      .addClass(shotInfo.homeTeam == 1 ? "odd" : "even");

    // Update stone select
    $(".endstone select.current-end").val(`${shotInfo.endID-1}`);
    $(".endstone select.current-stone").val(`${index}`);

    updateButtons();

    fitCompetitorNames();
  }

  // Fetch a different end
  async function goToHistory(endId) {
    // Disable the live if it isn't already
    if ($("#is_live").is(":checked")) {
      $("#is_live").prop('checked', false);
    }

    shotData = await fetchStonesAsync(endId);

    $("#slider").empty();
    $(".endstone select.current-stone").empty();

    shotData.forEach((shot, idx) => {

      $("#slider").append(`<div class="item">
      <div class="svg-container">${shot.svg}</div>
      </div>`); 

      $(".endstone select.current-stone").append(`<option value="${idx}">Stone ${idx+1}</option>`);
    });

    totalItems = $slider.children().length;
    
    renderDots();
    goTo(0);
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

  function updateButtons() {
    $firstBtn.prop("disabled", currentIndex === 0);
    $prevBtn.prop("disabled", currentIndex === 0);
    $nextBtn.prop("disabled", currentIndex === totalItems - 1);
    $lastBtn.prop("disabled", currentIndex === totalItems - 1);

    $arrowPrev.prop("disabled", currentIndex === 0);
    $arrowNext.prop("disabled", currentIndex === totalItems - 1);

    renderDots();
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
      while ($el[0].scrollWidth >= maxWidth+0.01  && fontSize > minSize) {
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
      $(`.stat-row:eq(${j-3})`).remove();
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

    if (currentStats.is_stat) { // Stat slide
    
      $(".stats-container").find(".text-line").hide();
      $(".stats-container").find(".bar-line").show();

      // Animate each row
      $rows.each(function (idx) {
        const $row = $(this);
        $row.find(".label").html(currentStats.rows[idx].row_title);

        $row.data('left', currentStats.rows[idx].row_value_red);
        $row.data('right', currentStats.rows[idx].row_value_yellow);

        let denominator = 0;
        let fromCenter = currentStats.rows[idx].row_value_max != null;

        // Find max
        if (fromCenter) {
          denominator = parseFloat(currentStats.rows[idx].row_value_max) * 2;
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
        
        const left = parseFloat($row.data("left"), 10);
        const right = parseFloat($row.data("right"), 10);
  
        var leftPct = !isNaN(left) ? parseFloat(((left / denominator) * 100).toFixed(2)) : 0;
        var rightPct = !isNaN(right) ? parseFloat(((right / denominator) * 100).toFixed(2)) : 0;

        // If the rounds do not add up to exactly 100, give it to the red team
        let leftRight = leftPct+rightPct;
        if (fromCenter == false && leftRight > 0 && leftRight < 100) {
          leftPct = leftPct + 100 - leftRight;
        }

        // Special case, bar width set to 100%
        if (currentStats.rows[idx].row_value_max == -1) {
            leftPct = rightPct = 50;
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
        $row.find(".bar-left, .bar-right").html("");
  
        // Animate
        setTimeout(() => {
          $row.find(".bar-left").html(currentStats.rows[idx].row_bar_value_red);
          $row.find(".bar-right").html(currentStats.rows[idx].row_bar_value_yellow);
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
        $row.find(".label").html(currentStats.rows[idx].row_title);

        // Reset bars
        $row.find(".bar-left, .bar-right").css("width", "0");

        $row.find(".info-left").html(currentStats.rows[idx].row_info_red);
        $row.find(".info-right").html(currentStats.rows[idx].row_info_yellow);
        $row.find(".text-left").html(currentStats.rows[idx].row_value_red ?? "-");
        $row.find(".text-right").html(currentStats.rows[idx].row_value_yellow ?? "-");

      });
    }
  }

  function refreshStatList() {
    statsData.forEach(stat => {
      $(".headers-slider").append(`<span class="header-item">${stat.statName}</span>`);
    });
  }

  // TODO skip the empty #slider if !isLive
  function refreshShotList() {
    $("#slider").empty();
    $(".endstone select.current-end").empty();
    $(".endstone select.current-stone").empty();
    
    if (shotData.length > 0) {
      let currentEnd = shotData[0].endID;

      for (let i = 0; i < currentEnd; i++) {
        $(".endstone select.current-end").append(`<option value="${i}">End ${i+1}</option>`);
      }
    }

    shotData.forEach((shot, idx) => {

      $("#slider").append(`<div class="item">
      <div class="svg-container">${shot.svg}</div>
      </div>`); 

      $(".endstone select.current-stone").append(`<option value="${idx}">Stone ${idx+1}</option>`);
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


  $(document).on('change', "select.current-end", function() {
    goToHistory(parseInt($(this).val())+1);
  });

  $(document).on('change', "select.current-stone", function() {
    goTo(parseInt($(this).val()), true);
  });



    $firstBtn = $("#firstBtn");
    $prevBtn = $("#prevBtn");
    $nextBtn = $("#nextBtn");
    $lastBtn = $("#lastBtn");
    $indexButtonsContainer = $("#indexButtons");
    $arrowPrev = $("#arrowPrev");
    $arrowNext = $("#arrowNext");


    // refreshShotList();

    // Button clicks
    $firstBtn.on("click", () => goTo(0, true));
    $prevBtn.on("click", () => goTo(currentIndex - 1, true));
    $nextBtn.on("click", () => goTo(currentIndex + 1, true));
    $lastBtn.on("click", () => goTo(totalItems - 1, true));

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
        if (deltaX < 0 && currentIndex < totalItems - 1) {
          currentIndex++;
        } else if (deltaX > 0 && currentIndex > 0) {
          currentIndex--;
        }
      }
      goTo(currentIndex);
    });


    $('span.btn-slider').on('click', function () {

      var target = $(this).data("target");

      if (target == "stats") {
        var $h2h = $('#head-to-head')
        $h2h.slideToggle(500);
        if ($h2h.is(':visible')) {
          $h2h.css('display', 'flex');
        }
        initStats();
        animateAllStats(0);
      }
      else if (target == "scoreboard") {

        var $scb = $('table.scoreboard')
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



    // ------------ //
    // Stats Slider //
    // ------------ //
    function initStats() {
      const $h2h = $("#head-to-head");
      const $headers = $("#head-to-head .headers");
      const $statSlider = $("#head-to-head .headers-slider");
      const $items = $statSlider.children();
      const total = $items.length;
      let current = 0;
      let expanded = false;
    
      
      // TODO PZ move that out
      function goToStat(index) {
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
    
        $items.removeClass("active").eq(current).addClass("active");

        animateAllStats(current);
      }

      $("#head-to-head").on("click", function (e) {
        if (expanded && !$(e.target).closest(".headers").length) {
          $headers.removeClass("expanded");
          expanded = false;
        }
      });

      // In expanded mode: clicking item jumps and closes menu
      $items.on("click", function (e) {
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
        alert("OK");
        e.stopPropagation();
        goToStat(current - 1);
      });
      $("#head-to-head .header-next").on("click", function (e) {
        e.stopPropagation();
        goToStat(current + 1);
      });
    
      // Swipe
      const $leftFeedback = $("#head-to-head .swipe-feedback.left");
      const $rightFeedback = $("#head-to-head .swipe-feedback.right");
      let startX = 0, currentX = 0, isDragging = false;
      const swipeThreshold = 50;

      // --- Swipe detection ---
      $h2h.on("touchstart", function(e) {
        startX = e.originalEvent.touches[0].clientX;
        isDragging = true;
      });

      $h2h.on("touchmove", function(e)  {
        if (!isDragging) return;
        currentX = e.originalEvent.touches[0].clientX;
        const deltaX = currentX - startX;

        // Calculate relative intensity (0–1)
        const intensity = Math.min(1, Math.abs(deltaX) / 150);

        if (deltaX < 0) {
          console.log(intensity);
          // swiping left → darken right side
          $rightFeedback.css("opacity", intensity);
          $leftFeedback.css("opacity", 0);
        } else {
          // swiping right → darken left side
          $leftFeedback.css("opacity", intensity);
          $rightFeedback.css("opacity", 0);
        }
      });

      $h2h.on("touchend", function(e) {
        if (!isDragging) return;
        isDragging = false;

        $leftFeedback.css("opacity", 0);
        $rightFeedback.css("opacity", 0);

        const dx = currentX - startX;
        if (Math.abs(dx) > swipeThreshold) {
          if (dx < 0) {
            goToStat(current + 1);
          }
          else {
            goToStat(current - 1);
          }
        }
      });

      goToStat(0);
    };
    



    // Init
    // renderDots();
    // refreshStatList();
    // goTo(0);





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
});