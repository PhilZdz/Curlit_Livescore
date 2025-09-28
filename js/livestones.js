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
        { name: "Item 1: Circle", stats: "Red: 3, Yellow: 4" },
        { name: "Item 2: Square", stats: "Red: 1, Yellow: 7" },
        { name: "Item 3: Triangle", stats: "Red: 2, Yellow: 6" },
        { name: "Item 4: Star", stats: "Red: 4, Yellow: 5" },
        { name: "Item 5: Hexagon", stats: "Red: 3, Yellow: 3" }
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
        $("#currentShot").html(`
        Current Shot: <strong>${shotInfo.name}</strong><br />
        Stats: <span id="shotStats">${shotInfo.stats}</span>
      `);
  
        updateButtons();
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
        const width = $svg.attr("width") ;
        const height = $svg.attr("height");
        if (width && height) {
          $svg.removeAttr("width height")
            .attr("viewBox", `0 0 ${width} ${height}`)
            .attr("preserveAspectRatio", "xMidYMid meet");
        }

        alert(`Adjusted width is ${width} and height is ${height}`);
        alert($(".svg-container").first().height());
        alert($(".svg-container").first().width())
      }
  
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
  
        // Swipe gestures
        $slider.on("touchstart", function (e) {
          startX = e.originalEvent.touches[0].clientX;
          isDragging = true;
          $slider.css("transition", "none");
        });
  
        $slider.on("touchmove", function (e) {
          if (!isDragging) return;
          currentX = e.originalEvent.touches[0].clientX;
          const deltaX = currentX - startX;
          $slider.css("transform", `translateX(calc(-${currentIndex * 100}% + ${deltaX}px))`);
        });
  
        $slider.on("touchend", function () {
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
  
        // Responsive SVGs
        $("svg").each(function () {
          makeSVGResponsive($(this));
        });
  
        // Add odd/even backgrounds
        $slider.children().each(function (i) {
          $(this).addClass(i % 2 === 0 ? "odd" : "even");
        });
  
        // Initialize
        renderDots();
        goTo(0);
      });


    

    startConnection();
});