$(document).ready(function () {
    // Version 0.1 from 22.8.25
    //const apiUrl = "https://livescores.worldcurling.org/curlitsse";
    const apiUrl = "http://sse.curlit.local:5057";

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

    // TODO PZ Remove that
    eventId = sessionId = 1;
    gameId = 2;

    const competitionCode = pathSegments[1] ?? competition;

    // The name of the group that sign
    const signalGroupName = `${competition != null ? competition : "TEST"}-${eventId}-${sessionId}-${gameId}`;

    const $container = $('#scoreboard');
    const $template = $('#template');
    const $sessionHeader = $('#session-header');


    var nbGames = 0;

    function startConnection() {
        const connection = new signalR.HubConnectionBuilder()
            .withUrl(`${apiUrl}/notificationHub`, { withCredentials: false })
            .build();

        connection.on("ReceiveMessage", function (resultList) {
            console.log(resultList);
            // Refresh the live viewport
            refreshContainer(resultList);
        });

        connection.onclose(function () {
            // Handle connection closed event
            setOnlineHeader(false);
            console.error("Live connection closed. Retrying in 5 seconds");
            setTimeout(startConnection, 5000);
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
        console.log(data);
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




    const shotData = [
        { 
          stoneId: 1, 
          noc: "CAN", 
          team: "Canada", 
          homeTeam: 0,
          lastName:"Cinnamon", 
          firstName: "Max", 
          task: 1,
          task_web: "Front",
          handle: 1,
          handle_web: "cw",
          points: 4,
          points_web:100,
          comment: null,
          svg: '<svg xmlns="http://www.w3.org/2000/svg" width="300" height="600"><rect x="0" y="0" width="300" height="600" fill="#ffffff" stroke="silver" stroke-width="0.5" /><g stroke="#646464" stroke-width="1"><circle cx="150.0" cy="440.0" r="120.0" fill="#c8c8ff" /><circle cx="150.0" cy="440.0" r="80.0" fill="#ffffff" /><circle cx="150.0" cy="440.0" r="40.0" fill="#a0ffc0" /><circle cx="150.0" cy="440.0" r="16.0" fill="#ffffff" /><line x1="0" y1="560.0" x2="300.0" y2="560.0" /><line x1="0" y1="440.0" x2="300.0" y2="440.0" /><line x1="0" y1="20.0" x2="300.0" y2="20.0" /><line x1="150.0" y1="20.0" x2="150.0" y2="560.0" /></g><g fill="#ff0000" stroke="black" stroke-width="1"><circle cx="35.0" cy="14.4" r="4.06" /><circle cx="35.0" cy="5.6" r="4.06" /><circle cx="25.0" cy="14.4" r="4.06" /><circle cx="25.0" cy="5.6" r="4.06" /><circle cx="15.0" cy="14.4" r="4.06" /><circle cx="15.0" cy="5.6" r="4.06" /><circle cx="5.0" cy="14.4" r="4.06" /><circle cx="5.0" cy="5.6" r="4.06" /></g><g fill="#ffe600" stroke="black" stroke-width="1"><circle cx="148.6" cy="283.8" r="8.65" class="CUR_cs" /><circle cx="148.6" cy="283.8" r="1.44" stroke-width="3" /><circle cx="265.0" cy="5.6" r="4.06" /><circle cx="275.0" cy="14.4" r="4.06" /><circle cx="275.0" cy="5.6" r="4.06" /><circle cx="285.0" cy="14.4" r="4.06" /><circle cx="285.0" cy="5.6" r="4.06" /><circle cx="295.0" cy="14.4" r="4.06" /><circle cx="295.0" cy="5.6" r="4.06" /></g></svg>'
        },
        { 
          stoneId: 2, 
          noc: "DEN", 
          team: "Denmark", 
          homeTeam: 1,
          lastName:"Goldbeck", 
          firstName: "Liam", 
          task: 4,
          task_web: "Draw",
          handle: 1,
          handle_web: "cw",
          points: 4,
          points_web:100,
          comment: null,
          svg: '<svg xmlns="http://www.w3.org/2000/svg" width="300" height="600"><rect x="0" y="0" width="300" height="600" fill="#ffffff" stroke="silver" stroke-width="0.5" /><g stroke="#646464" stroke-width="1"><circle cx="150.0" cy="440.0" r="120.0" fill="#c8c8ff" /><circle cx="150.0" cy="440.0" r="80.0" fill="#ffffff" /><circle cx="150.0" cy="440.0" r="40.0" fill="#a0ffc0" /><circle cx="150.0" cy="440.0" r="16.0" fill="#ffffff" /><line x1="0" y1="560.0" x2="300.0" y2="560.0" /><line x1="0" y1="440.0" x2="300.0" y2="440.0" /><line x1="0" y1="20.0" x2="300.0" y2="20.0" /><line x1="150.0" y1="20.0" x2="150.0" y2="560.0" /></g><g fill="#ff0000" stroke="black" stroke-width="1"><circle cx="149.0" cy="379.4" r="8.65" class="CUR_cs" /><circle cx="149.0" cy="379.4" r="1.44" stroke-width="3" /><circle cx="35.0" cy="5.6" r="4.06" /><circle cx="25.0" cy="14.4" r="4.06" /><circle cx="25.0" cy="5.6" r="4.06" /><circle cx="15.0" cy="14.4" r="4.06" /><circle cx="15.0" cy="5.6" r="4.06" /><circle cx="5.0" cy="14.4" r="4.06" /><circle cx="5.0" cy="5.6" r="4.06" /></g><g fill="#ffe600" stroke="black" stroke-width="1"><circle cx="148.6" cy="283.8" r="8.65" /><circle cx="265.0" cy="5.6" r="4.06" /><circle cx="275.0" cy="14.4" r="4.06" /><circle cx="275.0" cy="5.6" r="4.06" /><circle cx="285.0" cy="14.4" r="4.06" /><circle cx="285.0" cy="5.6" r="4.06" /><circle cx="295.0" cy="14.4" r="4.06" /><circle cx="295.0" cy="5.6" r="4.06" /></g></svg>'
        },        
        { 
          stoneId: 3, 
          noc: "CAN", 
          team: "Canada", 
          homeTeam: 0,
          lastName:"Cinnamon", 
          firstName: "Max", 
          task: 1,
          task_web: "Draw",
          handle: 1,
          handle_web: "cw",
          points: 4,
          points_web:100,
          comment: null,
          svg: '<svg xmlns="http://www.w3.org/2000/svg" width="300" height="600"><rect x="0" y="0" width="300" height="600" fill="#ffffff" stroke="silver" stroke-width="0.5" /><g stroke="#646464" stroke-width="1"><circle cx="150.0" cy="440.0" r="120.0" fill="#c8c8ff" /><circle cx="150.0" cy="440.0" r="80.0" fill="#ffffff" /><circle cx="150.0" cy="440.0" r="40.0" fill="#a0ffc0" /><circle cx="150.0" cy="440.0" r="16.0" fill="#ffffff" /><line x1="0" y1="560.0" x2="300.0" y2="560.0" /><line x1="0" y1="440.0" x2="300.0" y2="440.0" /><line x1="0" y1="20.0" x2="300.0" y2="20.0" /><line x1="150.0" y1="20.0" x2="150.0" y2="560.0" /></g><g fill="#ff0000" stroke="black" stroke-width="1"><circle cx="149.0" cy="379.4" r="8.65" /><circle cx="35.0" cy="5.6" r="4.06" /><circle cx="25.0" cy="14.4" r="4.06" /><circle cx="25.0" cy="5.6" r="4.06" /><circle cx="15.0" cy="14.4" r="4.06" /><circle cx="15.0" cy="5.6" r="4.06" /><circle cx="5.0" cy="14.4" r="4.06" /><circle cx="5.0" cy="5.6" r="4.06" /></g><g fill="#ffe600" stroke="black" stroke-width="1"><circle cx="148.6" cy="283.8" r="8.65" /><circle cx="156.2" cy="363.0" r="8.65" class="CUR_cs" /><circle cx="156.2" cy="363.0" r="1.44" stroke-width="3" /><circle cx="275.0" cy="14.4" r="4.06" /><circle cx="275.0" cy="5.6" r="4.06" /><circle cx="285.0" cy="14.4" r="4.06" /><circle cx="285.0" cy="5.6" r="4.06" /><circle cx="295.0" cy="14.4" r="4.06" /><circle cx="295.0" cy="5.6" r="4.06" /></g></svg>'
        },        
        { 
          stoneId: 4, 
          noc: "DEN", 
          team: "Denmark", 
          homeTeam: 1,
          lastName:"Goldbeck", 
          firstName: "Liam", 
          task: 1,
          task_web: "Draw",
          handle: 1,
          handle_web: "cw",
          points: 3,
          points_web:75,
          comment: null,
          svg: '<svg xmlns="http://www.w3.org/2000/svg" width="300" height="600"><rect x="0" y="0" width="300" height="600" fill="#ffffff" stroke="silver" stroke-width="0.5" /><g stroke="#646464" stroke-width="1"><circle cx="150.0" cy="440.0" r="120.0" fill="#c8c8ff" /><circle cx="150.0" cy="440.0" r="80.0" fill="#ffffff" /><circle cx="150.0" cy="440.0" r="40.0" fill="#a0ffc0" /><circle cx="150.0" cy="440.0" r="16.0" fill="#ffffff" /><line x1="0" y1="560.0" x2="300.0" y2="560.0" /><line x1="0" y1="440.0" x2="300.0" y2="440.0" /><line x1="0" y1="20.0" x2="300.0" y2="20.0" /><line x1="150.0" y1="20.0" x2="150.0" y2="560.0" /></g><g fill="#ff0000" stroke="black" stroke-width="1"><circle cx="149.0" cy="379.4" r="8.65" /><circle cx="47.8" cy="489.0" r="8.65" class="CUR_cs" /><circle cx="47.8" cy="489.0" r="1.44" stroke-width="3" /><circle cx="25.0" cy="14.4" r="4.06" /><circle cx="25.0" cy="5.6" r="4.06" /><circle cx="15.0" cy="14.4" r="4.06" /><circle cx="15.0" cy="5.6" r="4.06" /><circle cx="5.0" cy="14.4" r="4.06" /><circle cx="5.0" cy="5.6" r="4.06" /></g><g fill="#ffe600" stroke="black" stroke-width="1"><circle cx="148.6" cy="283.8" r="8.65" /><circle cx="156.2" cy="363.0" r="8.65" /><circle cx="275.0" cy="14.4" r="4.06" /><circle cx="275.0" cy="5.6" r="4.06" /><circle cx="285.0" cy="14.4" r="4.06" /><circle cx="285.0" cy="5.6" r="4.06" /><circle cx="295.0" cy="14.4" r="4.06" /><circle cx="295.0" cy="5.6" r="4.06" /></g></svg>'
        },        
        { 
          stoneId: 5, 
          noc: "CAN", 
          team: "Canada", 
          homeTeam: 0,
          lastName:"Keenan", 
          firstName: "Michael", 
          task: 1,
          task_web: "Promotion Take-out",
          handle: 1,
          handle_web: "cw",
          points: 0,
          points_web:0,
          comment: "No tick zone violation",
          svg: '<svg xmlns="http://www.w3.org/2000/svg" width="300" height="600"><rect x="0" y="0" width="300" height="600" fill="#ffffff" stroke="silver" stroke-width="0.5" /><g stroke="#646464" stroke-width="1"><circle cx="150.0" cy="440.0" r="120.0" fill="#c8c8ff" /><circle cx="150.0" cy="440.0" r="80.0" fill="#ffffff" /><circle cx="150.0" cy="440.0" r="40.0" fill="#a0ffc0" /><circle cx="150.0" cy="440.0" r="16.0" fill="#ffffff" /><line x1="0" y1="560.0" x2="300.0" y2="560.0" /><line x1="0" y1="440.0" x2="300.0" y2="440.0" /><line x1="0" y1="20.0" x2="300.0" y2="20.0" /><line x1="150.0" y1="20.0" x2="150.0" y2="560.0" /></g><g fill="#808080" stroke="#ffe600" stroke-width="0.5" fill-opacity="0" class="CUR_os"><circle cx="148.6" cy="283.8" r="8.65" /></g><g fill="#ff0000" stroke="black" stroke-width="1"><circle cx="149.0" cy="379.4" r="8.65" /><circle cx="47.8" cy="489.0" r="8.65" /><circle cx="25.0" cy="14.4" r="4.06" /><circle cx="25.0" cy="5.6" r="4.06" /><circle cx="15.0" cy="14.4" r="4.06" /><circle cx="15.0" cy="5.6" r="4.06" /><circle cx="5.0" cy="14.4" r="4.06" /><circle cx="5.0" cy="5.6" r="4.06" /></g><g fill="#ffe600" stroke="black" stroke-width="1"><circle cx="73.6" cy="342.4" r="8.65" /><circle cx="156.2" cy="363.0" r="8.65" /><circle cx="150.0" cy="590.0" r="8.65" class="CUR_cs" /><circle cx="150.0" cy="590.0" r="1.44" stroke-width="3" /><circle cx="275.0" cy="5.6" r="4.06" /><circle cx="285.0" cy="14.4" r="4.06" /><circle cx="285.0" cy="5.6" r="4.06" /><circle cx="295.0" cy="14.4" r="4.06" /><circle cx="295.0" cy="5.6" r="4.06" /></g></svg>'

        },
        { 
          stoneId: 6, 
          noc: "DEN", 
          team: "Denmark", 
          homeTeam: 1,
          lastName:"Jurlander Boege", 
          firstName: "Kasper", 
          task: 9,
          task_web: "Draw",
          handle: 1,
          handle_web: "ccw",
          points: 4,
          points_web:100,
          comment: null,
          svg: '<svg xmlns="http://www.w3.org/2000/svg" width="300" height="600"><rect x="0" y="0" width="300" height="600" fill="#ffffff" stroke="silver" stroke-width="0.5" /><g stroke="#646464" stroke-width="1"><circle cx="150.0" cy="440.0" r="120.0" fill="#c8c8ff" /><circle cx="150.0" cy="440.0" r="80.0" fill="#ffffff" /><circle cx="150.0" cy="440.0" r="40.0" fill="#a0ffc0" /><circle cx="150.0" cy="440.0" r="16.0" fill="#ffffff" /><line x1="0" y1="560.0" x2="300.0" y2="560.0" /><line x1="0" y1="440.0" x2="300.0" y2="440.0" /><line x1="0" y1="20.0" x2="300.0" y2="20.0" /><line x1="150.0" y1="20.0" x2="150.0" y2="560.0" /></g><g fill="#ff0000" stroke="black" stroke-width="1"><circle cx="149.0" cy="379.4" r="8.65" /><circle cx="47.8" cy="489.0" r="8.65" /><circle cx="234.0" cy="442.6" r="8.65" class="CUR_cs" /><circle cx="234.0" cy="442.6" r="1.44" stroke-width="3" /><circle cx="25.0" cy="5.6" r="4.06" /><circle cx="15.0" cy="14.4" r="4.06" /><circle cx="15.0" cy="5.6" r="4.06" /><circle cx="5.0" cy="14.4" r="4.06" /><circle cx="5.0" cy="5.6" r="4.06" /></g><g fill="#ffe600" stroke="black" stroke-width="1"><circle cx="73.6" cy="342.4" r="8.65" /><circle cx="156.2" cy="363.0" r="8.65" /><circle cx="288.2" cy="590.0" r="8.65" /><circle cx="275.0" cy="5.6" r="4.06" /><circle cx="285.0" cy="14.4" r="4.06" /><circle cx="285.0" cy="5.6" r="4.06" /><circle cx="295.0" cy="14.4" r="4.06" /><circle cx="295.0" cy="5.6" r="4.06" /></g></svg>'
        },
      ];
  
      let $slider, $firstBtn, $prevBtn, $nextBtn, $lastBtn, $indexButtonsContainer;
      let $arrowPrev, $arrowNext;
      let totalItems, currentIndex = 0;
  
      let startX = 0, currentX = 0, isDragging = false;
      const swipeThreshold = 50;
  
      function goTo(index) {
        currentIndex = Math.max(0, Math.min(index, totalItems - 1));
        $slider.css({
          transition: "transform 0.3s ease",
          transform: `translateX(-${currentIndex * 100}%)`
        });
  
        // Update shot info
        const shotInfo = shotData[currentIndex];

        // update and resize the svg
        $(".svg-container").eq(index).html(shotInfo.svg);
        makeSVGResponsive($(".svg-container svg").eq(index));

        $("#currentShot .current-stone").html(`Stone ${shotInfo.stoneId}`)
        $("#currentShot .competitor td.flag img").attr('src', `https://livescores.worldcurling.org/flags/${shotInfo.noc}.svg`);
        $("#currentShot .competitor td.flag img").attr('alt', shotInfo.team);
        $("#currentShot .competitor span.lastname").html(shotInfo.lastName);
        $("#currentShot .competitor span.firstname").html(shotInfo.firstName);
        $("#currentShot .shot-details span.type").html(shotInfo.task_web);
        $("#currentShot .shot-details span.handle")
          .removeClass("cw ccw")
          .addClass(shotInfo.handle_web);
        $("#currentShot .shot-details span.accuracy").html(`${shotInfo.points_web} %`);
        $("#currentShot .shot-details span.comment").html(shotInfo.comment);



        // Update wrapper shadow (odd/even by slide index)
        $(".slider-wrapper")
        .removeClass("odd even")
        .addClass(shotInfo.homeTeam == 1 ? "odd" : "even");
  
        updateButtons();

        fitCompetitorNames();
      }

      function fitCompetitorNames() {
        $('.lastname').each(function(){
          fitText($(this), 22);
        });

        $('.firstname').each(function(){
          fitText($(this), 20);
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
      
        $el.css('font-size', fontSize + 'px');
      
        // shrink until it fits or hit minSize
        while ($el[0].offsetWidth > maxWidth && fontSize > minSize) {
          fontSize--;
          $el.css('font-size', fontSize + 'px');
        }
      }
      

      function animateAllStats() {
        const rows = $(".stat-row");
        
        // Find global max
        let maxValue = 0;

        rows.each(function() {
          const dataLeft = parseFloat($(this).data('left'));
          const dataRight = parseFloat($(this).data('right'));
      
          // Check if data-left is a valid number and update maxValue
          if (!isNaN(dataLeft)) {
            maxValue = Math.max(maxValue, dataLeft);
          }
      
          // Check if data-right is a valid number and update maxValue
          if (!isNaN(dataRight)) {
            maxValue = Math.max(maxValue, dataRight);
          }
        });

      
        // Animate each row
        rows.each(function() {
          const $row = $(this);
          const left = parseInt($row.data("left"), 10);
          const right = parseInt($row.data("right"), 10);
      
          const leftPct = !isNaN(left) ? (left / maxValue) * 100 / 2 : 0;
          const rightPct = !isNaN(right) ? (right / maxValue) * 100 / 2 : 0;

          // Normalize
          if (!isNaN(left)) {
            $row.find(".value-left").html(left+ "<span class='prct'>%</span>");
          }
          else {
            $row.find(".value-left").html("-");
          }

          if (!isNaN(right)) {
            $row.find(".value-right").html(right + " <span class='prct'>%</span>");
          }
          else {
            $row.find(".value-right").html("-");
          }
          
          // Reset bars
          $row.find(".bar-left, .bar-right").css("width", "0");
      
          // Animate
          setTimeout(() => {
            $row.find(".bar-left").css("width", leftPct + "%");
            $row.find(".bar-right").css("width", rightPct + "%");
          }, 100);
        });
      }


      
      
        $(window).on('resize', function(){
          fitCompetitorNames();
        });


  
      $(document).ready(function () {
        $slider = $("#slider");
        $firstBtn = $("#firstBtn");
        $prevBtn = $("#prevBtn");
        $nextBtn = $("#nextBtn");
        $lastBtn = $("#lastBtn");
        $indexButtonsContainer = $("#indexButtons");
        $arrowPrev = $("#arrowPrev");
        $arrowNext = $("#arrowNext");
  
        totalItems = $slider.children().length;
  
        // Button clicks
        $firstBtn.on("click", () => goTo(0));
        $prevBtn.on("click", () => goTo(currentIndex - 1));
        $nextBtn.on("click", () => goTo(currentIndex + 1));
        $lastBtn.on("click", () => goTo(totalItems - 1));
  
        $arrowPrev.on("click", () => goTo(currentIndex - 1));
        $arrowNext.on("click", () => goTo(currentIndex + 1));
  
       
        
        // -------------- //
        // Swipe gestures //
        // -------------- //
        $slider.on("touchstart", function (e) {
          const touches = e.originalEvent.touches;
          if (touches.length > 1) {
            // 👆 More than one finger → allow browser to handle pinch
            isDragging = false;
            return;
          }
          startX = touches[0].clientX;
          isDragging = true;
          $slider.css("transition", "none");
        });
        
        $slider.on("touchmove", function (e) {
          const touches = e.originalEvent.touches;
          if (!isDragging || touches.length > 1) return; // ignore pinch
          currentX = touches[0].clientX;
          const deltaX = currentX - startX;
          $slider.css(
            "transform",
            `translateX(calc(-${currentIndex * 100}% + ${deltaX}px))`
          );
        });
        
        $slider.on("touchend", function (e) {
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
        
  
  
        // Initialize
        renderDots();
        goTo(0);


        animateAllStats();

      });


    

    startConnection();
});