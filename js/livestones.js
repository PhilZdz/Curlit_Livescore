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
      lastName: "Cinnamon",
      firstName: "Max",
      task: 1,
      task_web: "Front",
      handle: 1,
      handle_web: "cw",
      points: 4,
      points_web: 100,
      comment: null,
      svg: '<svg xmlns="http://www.w3.org/2000/svg" width="300" height="600"><rect x="0" y="0" width="300" height="600" fill="#ffffff" stroke="silver" stroke-width="0.5" /><g stroke="#646464" stroke-width="1"><circle cx="150.0" cy="440.0" r="120.0" fill="#c8c8ff" /><circle cx="150.0" cy="440.0" r="80.0" fill="#ffffff" /><circle cx="150.0" cy="440.0" r="40.0" fill="#a0ffc0" /><circle cx="150.0" cy="440.0" r="16.0" fill="#ffffff" /><line x1="0" y1="560.0" x2="300.0" y2="560.0" /><line x1="0" y1="440.0" x2="300.0" y2="440.0" /><line x1="0" y1="20.0" x2="300.0" y2="20.0" /><line x1="150.0" y1="20.0" x2="150.0" y2="560.0" /></g><g fill="#ff0000" stroke="black" stroke-width="1"><circle cx="35.0" cy="14.4" r="4.06" /><circle cx="35.0" cy="5.6" r="4.06" /><circle cx="25.0" cy="14.4" r="4.06" /><circle cx="25.0" cy="5.6" r="4.06" /><circle cx="15.0" cy="14.4" r="4.06" /><circle cx="15.0" cy="5.6" r="4.06" /><circle cx="5.0" cy="14.4" r="4.06" /><circle cx="5.0" cy="5.6" r="4.06" /></g><g fill="#ffe600" stroke="black" stroke-width="1"><circle cx="148.6" cy="283.8" r="8.65" class="CUR_cs" /><circle cx="148.6" cy="283.8" r="1.44" stroke-width="3" /><circle cx="265.0" cy="5.6" r="4.06" /><circle cx="275.0" cy="14.4" r="4.06" /><circle cx="275.0" cy="5.6" r="4.06" /><circle cx="285.0" cy="14.4" r="4.06" /><circle cx="285.0" cy="5.6" r="4.06" /><circle cx="295.0" cy="14.4" r="4.06" /><circle cx="295.0" cy="5.6" r="4.06" /></g></svg>'
    },
    {
      stoneId: 2,
      noc: "DEN",
      team: "Denmark",
      homeTeam: 1,
      lastName: "Goldbeck",
      firstName: "Liam",
      task: 4,
      task_web: "Draw",
      handle: 1,
      handle_web: "cw",
      points: 4,
      points_web: 100,
      comment: null,
      svg: '<svg xmlns="http://www.w3.org/2000/svg" width="300" height="600"><rect x="0" y="0" width="300" height="600" fill="#ffffff" stroke="silver" stroke-width="0.5" /><g stroke="#646464" stroke-width="1"><circle cx="150.0" cy="440.0" r="120.0" fill="#c8c8ff" /><circle cx="150.0" cy="440.0" r="80.0" fill="#ffffff" /><circle cx="150.0" cy="440.0" r="40.0" fill="#a0ffc0" /><circle cx="150.0" cy="440.0" r="16.0" fill="#ffffff" /><line x1="0" y1="560.0" x2="300.0" y2="560.0" /><line x1="0" y1="440.0" x2="300.0" y2="440.0" /><line x1="0" y1="20.0" x2="300.0" y2="20.0" /><line x1="150.0" y1="20.0" x2="150.0" y2="560.0" /></g><g fill="#ff0000" stroke="black" stroke-width="1"><circle cx="149.0" cy="379.4" r="8.65" class="CUR_cs" /><circle cx="149.0" cy="379.4" r="1.44" stroke-width="3" /><circle cx="35.0" cy="5.6" r="4.06" /><circle cx="25.0" cy="14.4" r="4.06" /><circle cx="25.0" cy="5.6" r="4.06" /><circle cx="15.0" cy="14.4" r="4.06" /><circle cx="15.0" cy="5.6" r="4.06" /><circle cx="5.0" cy="14.4" r="4.06" /><circle cx="5.0" cy="5.6" r="4.06" /></g><g fill="#ffe600" stroke="black" stroke-width="1"><circle cx="148.6" cy="283.8" r="8.65" /><circle cx="265.0" cy="5.6" r="4.06" /><circle cx="275.0" cy="14.4" r="4.06" /><circle cx="275.0" cy="5.6" r="4.06" /><circle cx="285.0" cy="14.4" r="4.06" /><circle cx="285.0" cy="5.6" r="4.06" /><circle cx="295.0" cy="14.4" r="4.06" /><circle cx="295.0" cy="5.6" r="4.06" /></g></svg>'
    },
    {
      stoneId: 3,
      noc: "CAN",
      team: "Canada",
      homeTeam: 0,
      lastName: "Cinnamon",
      firstName: "Max",
      task: 1,
      task_web: "Draw",
      handle: 1,
      handle_web: "cw",
      points: 4,
      points_web: 100,
      comment: null,
      svg: '<svg xmlns="http://www.w3.org/2000/svg" width="300" height="600"><rect x="0" y="0" width="300" height="600" fill="#ffffff" stroke="silver" stroke-width="0.5" /><g stroke="#646464" stroke-width="1"><circle cx="150.0" cy="440.0" r="120.0" fill="#c8c8ff" /><circle cx="150.0" cy="440.0" r="80.0" fill="#ffffff" /><circle cx="150.0" cy="440.0" r="40.0" fill="#a0ffc0" /><circle cx="150.0" cy="440.0" r="16.0" fill="#ffffff" /><line x1="0" y1="560.0" x2="300.0" y2="560.0" /><line x1="0" y1="440.0" x2="300.0" y2="440.0" /><line x1="0" y1="20.0" x2="300.0" y2="20.0" /><line x1="150.0" y1="20.0" x2="150.0" y2="560.0" /></g><g fill="#ff0000" stroke="black" stroke-width="1"><circle cx="149.0" cy="379.4" r="8.65" /><circle cx="35.0" cy="5.6" r="4.06" /><circle cx="25.0" cy="14.4" r="4.06" /><circle cx="25.0" cy="5.6" r="4.06" /><circle cx="15.0" cy="14.4" r="4.06" /><circle cx="15.0" cy="5.6" r="4.06" /><circle cx="5.0" cy="14.4" r="4.06" /><circle cx="5.0" cy="5.6" r="4.06" /></g><g fill="#ffe600" stroke="black" stroke-width="1"><circle cx="148.6" cy="283.8" r="8.65" /><circle cx="156.2" cy="363.0" r="8.65" class="CUR_cs" /><circle cx="156.2" cy="363.0" r="1.44" stroke-width="3" /><circle cx="275.0" cy="14.4" r="4.06" /><circle cx="275.0" cy="5.6" r="4.06" /><circle cx="285.0" cy="14.4" r="4.06" /><circle cx="285.0" cy="5.6" r="4.06" /><circle cx="295.0" cy="14.4" r="4.06" /><circle cx="295.0" cy="5.6" r="4.06" /></g></svg>'
    },
    {
      stoneId: 4,
      noc: "DEN",
      team: "Denmark",
      homeTeam: 1,
      lastName: "Goldbeck",
      firstName: "Liam",
      task: 1,
      task_web: "Draw",
      handle: 1,
      handle_web: "cw",
      points: 3,
      points_web: 75,
      comment: null,
      svg: '<svg xmlns="http://www.w3.org/2000/svg" width="300" height="600"><rect x="0" y="0" width="300" height="600" fill="#ffffff" stroke="silver" stroke-width="0.5" /><g stroke="#646464" stroke-width="1"><circle cx="150.0" cy="440.0" r="120.0" fill="#c8c8ff" /><circle cx="150.0" cy="440.0" r="80.0" fill="#ffffff" /><circle cx="150.0" cy="440.0" r="40.0" fill="#a0ffc0" /><circle cx="150.0" cy="440.0" r="16.0" fill="#ffffff" /><line x1="0" y1="560.0" x2="300.0" y2="560.0" /><line x1="0" y1="440.0" x2="300.0" y2="440.0" /><line x1="0" y1="20.0" x2="300.0" y2="20.0" /><line x1="150.0" y1="20.0" x2="150.0" y2="560.0" /></g><g fill="#ff0000" stroke="black" stroke-width="1"><circle cx="149.0" cy="379.4" r="8.65" /><circle cx="47.8" cy="489.0" r="8.65" class="CUR_cs" /><circle cx="47.8" cy="489.0" r="1.44" stroke-width="3" /><circle cx="25.0" cy="14.4" r="4.06" /><circle cx="25.0" cy="5.6" r="4.06" /><circle cx="15.0" cy="14.4" r="4.06" /><circle cx="15.0" cy="5.6" r="4.06" /><circle cx="5.0" cy="14.4" r="4.06" /><circle cx="5.0" cy="5.6" r="4.06" /></g><g fill="#ffe600" stroke="black" stroke-width="1"><circle cx="148.6" cy="283.8" r="8.65" /><circle cx="156.2" cy="363.0" r="8.65" /><circle cx="275.0" cy="14.4" r="4.06" /><circle cx="275.0" cy="5.6" r="4.06" /><circle cx="285.0" cy="14.4" r="4.06" /><circle cx="285.0" cy="5.6" r="4.06" /><circle cx="295.0" cy="14.4" r="4.06" /><circle cx="295.0" cy="5.6" r="4.06" /></g></svg>'
    },
    {
      stoneId: 5,
      noc: "CAN",
      team: "Canada",
      homeTeam: 0,
      lastName: "Keenan",
      firstName: "Michael",
      task: 1,
      task_web: "Promotion Take-out",
      handle: 1,
      handle_web: "cw",
      points: 0,
      points_web: 0,
      comment: "No tick zone violation",
      svg: '<svg xmlns="http://www.w3.org/2000/svg" width="300" height="600"><rect x="0" y="0" width="300" height="600" fill="#ffffff" stroke="silver" stroke-width="0.5" /><g stroke="#646464" stroke-width="1"><circle cx="150.0" cy="440.0" r="120.0" fill="#c8c8ff" /><circle cx="150.0" cy="440.0" r="80.0" fill="#ffffff" /><circle cx="150.0" cy="440.0" r="40.0" fill="#a0ffc0" /><circle cx="150.0" cy="440.0" r="16.0" fill="#ffffff" /><line x1="0" y1="560.0" x2="300.0" y2="560.0" /><line x1="0" y1="440.0" x2="300.0" y2="440.0" /><line x1="0" y1="20.0" x2="300.0" y2="20.0" /><line x1="150.0" y1="20.0" x2="150.0" y2="560.0" /></g><g fill="#808080" stroke="#ffe600" stroke-width="0.5" fill-opacity="0" class="CUR_os"><circle cx="148.6" cy="283.8" r="8.65" /></g><g fill="#ff0000" stroke="black" stroke-width="1"><circle cx="149.0" cy="379.4" r="8.65" /><circle cx="47.8" cy="489.0" r="8.65" /><circle cx="25.0" cy="14.4" r="4.06" /><circle cx="25.0" cy="5.6" r="4.06" /><circle cx="15.0" cy="14.4" r="4.06" /><circle cx="15.0" cy="5.6" r="4.06" /><circle cx="5.0" cy="14.4" r="4.06" /><circle cx="5.0" cy="5.6" r="4.06" /></g><g fill="#ffe600" stroke="black" stroke-width="1"><circle cx="73.6" cy="342.4" r="8.65" /><circle cx="156.2" cy="363.0" r="8.65" /><circle cx="150.0" cy="590.0" r="8.65" class="CUR_cs" /><circle cx="150.0" cy="590.0" r="1.44" stroke-width="3" /><circle cx="275.0" cy="5.6" r="4.06" /><circle cx="285.0" cy="14.4" r="4.06" /><circle cx="285.0" cy="5.6" r="4.06" /><circle cx="295.0" cy="14.4" r="4.06" /><circle cx="295.0" cy="5.6" r="4.06" /></g></svg>'

    },
    {
      stoneId: 6,
      noc: "DEN",
      team: "Denmark",
      homeTeam: 1,
      lastName: "Jurlander Boege",
      firstName: "Kasper",
      task: 9,
      task_web: "Draw",
      handle: 1,
      handle_web: "ccw",
      points: 4,
      points_web: 100,
      comment: null,
      svg: '<svg xmlns="http://www.w3.org/2000/svg" width="300" height="600"><rect x="0" y="0" width="300" height="600" fill="#ffffff" stroke="silver" stroke-width="0.5" /><g stroke="#646464" stroke-width="1"><circle cx="150.0" cy="440.0" r="120.0" fill="#c8c8ff" /><circle cx="150.0" cy="440.0" r="80.0" fill="#ffffff" /><circle cx="150.0" cy="440.0" r="40.0" fill="#a0ffc0" /><circle cx="150.0" cy="440.0" r="16.0" fill="#ffffff" /><line x1="0" y1="560.0" x2="300.0" y2="560.0" /><line x1="0" y1="440.0" x2="300.0" y2="440.0" /><line x1="0" y1="20.0" x2="300.0" y2="20.0" /><line x1="150.0" y1="20.0" x2="150.0" y2="560.0" /></g><g fill="#ff0000" stroke="black" stroke-width="1"><circle cx="149.0" cy="379.4" r="8.65" /><circle cx="47.8" cy="489.0" r="8.65" /><circle cx="234.0" cy="442.6" r="8.65" class="CUR_cs" /><circle cx="234.0" cy="442.6" r="1.44" stroke-width="3" /><circle cx="25.0" cy="5.6" r="4.06" /><circle cx="15.0" cy="14.4" r="4.06" /><circle cx="15.0" cy="5.6" r="4.06" /><circle cx="5.0" cy="14.4" r="4.06" /><circle cx="5.0" cy="5.6" r="4.06" /></g><g fill="#ffe600" stroke="black" stroke-width="1"><circle cx="73.6" cy="342.4" r="8.65" /><circle cx="156.2" cy="363.0" r="8.65" /><circle cx="288.2" cy="590.0" r="8.65" /><circle cx="275.0" cy="5.6" r="4.06" /><circle cx="285.0" cy="14.4" r="4.06" /><circle cx="285.0" cy="5.6" r="4.06" /><circle cx="295.0" cy="14.4" r="4.06" /><circle cx="295.0" cy="5.6" r="4.06" /></g></svg>'
    },
    {
      stoneId: 7,
      noc: "CAN",
      team: "Canada",
      homeTeam: 0,
      lastName: "Keenan",
      firstName: "Michael",
      task: 1,
      task_web: "Promotion Take-out",
      handle: 1,
      handle_web: "cw",
      points: 0,
      points_web: 0,
      comment: "No tick zone violation",
      svg: '<svg xmlns="http://www.w3.org/2000/svg" width="300" height="600"><rect x="0" y="0" width="300" height="600" fill="#ffffff" stroke="silver" stroke-width="0.5" /><g stroke="#646464" stroke-width="1"><circle cx="150.0" cy="440.0" r="120.0" fill="#c8c8ff" /><circle cx="150.0" cy="440.0" r="80.0" fill="#ffffff" /><circle cx="150.0" cy="440.0" r="40.0" fill="#a0ffc0" /><circle cx="150.0" cy="440.0" r="16.0" fill="#ffffff" /><line x1="0" y1="560.0" x2="300.0" y2="560.0" /><line x1="0" y1="440.0" x2="300.0" y2="440.0" /><line x1="0" y1="20.0" x2="300.0" y2="20.0" /><line x1="150.0" y1="20.0" x2="150.0" y2="560.0" /></g><g fill="#808080" stroke="#ffe600" stroke-width="0.5" fill-opacity="0" class="CUR_os"><circle cx="148.6" cy="283.8" r="8.65" /></g><g fill="#ff0000" stroke="black" stroke-width="1"><circle cx="149.0" cy="379.4" r="8.65" /><circle cx="47.8" cy="489.0" r="8.65" /><circle cx="25.0" cy="14.4" r="4.06" /><circle cx="25.0" cy="5.6" r="4.06" /><circle cx="15.0" cy="14.4" r="4.06" /><circle cx="15.0" cy="5.6" r="4.06" /><circle cx="5.0" cy="14.4" r="4.06" /><circle cx="5.0" cy="5.6" r="4.06" /></g><g fill="#ffe600" stroke="black" stroke-width="1"><circle cx="73.6" cy="342.4" r="8.65" /><circle cx="156.2" cy="363.0" r="8.65" /><circle cx="150.0" cy="590.0" r="8.65" class="CUR_cs" /><circle cx="150.0" cy="590.0" r="1.44" stroke-width="3" /><circle cx="275.0" cy="5.6" r="4.06" /><circle cx="285.0" cy="14.4" r="4.06" /><circle cx="285.0" cy="5.6" r="4.06" /><circle cx="295.0" cy="14.4" r="4.06" /><circle cx="295.0" cy="5.6" r="4.06" /></g></svg>'

    },
    {
      stoneId: 8,
      noc: "DEN",
      team: "Denmark",
      homeTeam: 1,
      lastName: "Jurlander Boege",
      firstName: "Kasper",
      task: 9,
      task_web: "Draw",
      handle: 1,
      handle_web: "ccw",
      points: 4,
      points_web: 100,
      comment: null,
      svg: '<svg xmlns="http://www.w3.org/2000/svg" width="300" height="600"><rect x="0" y="0" width="300" height="600" fill="#ffffff" stroke="silver" stroke-width="0.5" /><g stroke="#646464" stroke-width="1"><circle cx="150.0" cy="440.0" r="120.0" fill="#c8c8ff" /><circle cx="150.0" cy="440.0" r="80.0" fill="#ffffff" /><circle cx="150.0" cy="440.0" r="40.0" fill="#a0ffc0" /><circle cx="150.0" cy="440.0" r="16.0" fill="#ffffff" /><line x1="0" y1="560.0" x2="300.0" y2="560.0" /><line x1="0" y1="440.0" x2="300.0" y2="440.0" /><line x1="0" y1="20.0" x2="300.0" y2="20.0" /><line x1="150.0" y1="20.0" x2="150.0" y2="560.0" /></g><g fill="#ff0000" stroke="black" stroke-width="1"><circle cx="149.0" cy="379.4" r="8.65" /><circle cx="47.8" cy="489.0" r="8.65" /><circle cx="234.0" cy="442.6" r="8.65" class="CUR_cs" /><circle cx="234.0" cy="442.6" r="1.44" stroke-width="3" /><circle cx="25.0" cy="5.6" r="4.06" /><circle cx="15.0" cy="14.4" r="4.06" /><circle cx="15.0" cy="5.6" r="4.06" /><circle cx="5.0" cy="14.4" r="4.06" /><circle cx="5.0" cy="5.6" r="4.06" /></g><g fill="#ffe600" stroke="black" stroke-width="1"><circle cx="73.6" cy="342.4" r="8.65" /><circle cx="156.2" cy="363.0" r="8.65" /><circle cx="288.2" cy="590.0" r="8.65" /><circle cx="275.0" cy="5.6" r="4.06" /><circle cx="285.0" cy="14.4" r="4.06" /><circle cx="285.0" cy="5.6" r="4.06" /><circle cx="295.0" cy="14.4" r="4.06" /><circle cx="295.0" cy="5.6" r="4.06" /></g></svg>'
    },
    {
      stoneId: 9,
      noc: "CAN",
      team: "Canada",
      homeTeam: 0,
      lastName: "Keenan",
      firstName: "Michael",
      task: 1,
      task_web: "Promotion Take-out",
      handle: 1,
      handle_web: "cw",
      points: 0,
      points_web: 0,
      comment: "No tick zone violation",
      svg: '<svg xmlns="http://www.w3.org/2000/svg" width="300" height="600"><rect x="0" y="0" width="300" height="600" fill="#ffffff" stroke="silver" stroke-width="0.5" /><g stroke="#646464" stroke-width="1"><circle cx="150.0" cy="440.0" r="120.0" fill="#c8c8ff" /><circle cx="150.0" cy="440.0" r="80.0" fill="#ffffff" /><circle cx="150.0" cy="440.0" r="40.0" fill="#a0ffc0" /><circle cx="150.0" cy="440.0" r="16.0" fill="#ffffff" /><line x1="0" y1="560.0" x2="300.0" y2="560.0" /><line x1="0" y1="440.0" x2="300.0" y2="440.0" /><line x1="0" y1="20.0" x2="300.0" y2="20.0" /><line x1="150.0" y1="20.0" x2="150.0" y2="560.0" /></g><g fill="#808080" stroke="#ffe600" stroke-width="0.5" fill-opacity="0" class="CUR_os"><circle cx="148.6" cy="283.8" r="8.65" /></g><g fill="#ff0000" stroke="black" stroke-width="1"><circle cx="149.0" cy="379.4" r="8.65" /><circle cx="47.8" cy="489.0" r="8.65" /><circle cx="25.0" cy="14.4" r="4.06" /><circle cx="25.0" cy="5.6" r="4.06" /><circle cx="15.0" cy="14.4" r="4.06" /><circle cx="15.0" cy="5.6" r="4.06" /><circle cx="5.0" cy="14.4" r="4.06" /><circle cx="5.0" cy="5.6" r="4.06" /></g><g fill="#ffe600" stroke="black" stroke-width="1"><circle cx="73.6" cy="342.4" r="8.65" /><circle cx="156.2" cy="363.0" r="8.65" /><circle cx="150.0" cy="590.0" r="8.65" class="CUR_cs" /><circle cx="150.0" cy="590.0" r="1.44" stroke-width="3" /><circle cx="275.0" cy="5.6" r="4.06" /><circle cx="285.0" cy="14.4" r="4.06" /><circle cx="285.0" cy="5.6" r="4.06" /><circle cx="295.0" cy="14.4" r="4.06" /><circle cx="295.0" cy="5.6" r="4.06" /></g></svg>'

    },
    {
      stoneId: 10,
      noc: "DEN",
      team: "Denmark",
      homeTeam: 1,
      lastName: "Jurlander Boege",
      firstName: "Kasper",
      task: 9,
      task_web: "Draw",
      handle: 1,
      handle_web: "ccw",
      points: 4,
      points_web: 100,
      comment: null,
      svg: '<svg xmlns="http://www.w3.org/2000/svg" width="300" height="600"><rect x="0" y="0" width="300" height="600" fill="#ffffff" stroke="silver" stroke-width="0.5" /><g stroke="#646464" stroke-width="1"><circle cx="150.0" cy="440.0" r="120.0" fill="#c8c8ff" /><circle cx="150.0" cy="440.0" r="80.0" fill="#ffffff" /><circle cx="150.0" cy="440.0" r="40.0" fill="#a0ffc0" /><circle cx="150.0" cy="440.0" r="16.0" fill="#ffffff" /><line x1="0" y1="560.0" x2="300.0" y2="560.0" /><line x1="0" y1="440.0" x2="300.0" y2="440.0" /><line x1="0" y1="20.0" x2="300.0" y2="20.0" /><line x1="150.0" y1="20.0" x2="150.0" y2="560.0" /></g><g fill="#ff0000" stroke="black" stroke-width="1"><circle cx="149.0" cy="379.4" r="8.65" /><circle cx="47.8" cy="489.0" r="8.65" /><circle cx="234.0" cy="442.6" r="8.65" class="CUR_cs" /><circle cx="234.0" cy="442.6" r="1.44" stroke-width="3" /><circle cx="25.0" cy="5.6" r="4.06" /><circle cx="15.0" cy="14.4" r="4.06" /><circle cx="15.0" cy="5.6" r="4.06" /><circle cx="5.0" cy="14.4" r="4.06" /><circle cx="5.0" cy="5.6" r="4.06" /></g><g fill="#ffe600" stroke="black" stroke-width="1"><circle cx="73.6" cy="342.4" r="8.65" /><circle cx="156.2" cy="363.0" r="8.65" /><circle cx="288.2" cy="590.0" r="8.65" /><circle cx="275.0" cy="5.6" r="4.06" /><circle cx="285.0" cy="14.4" r="4.06" /><circle cx="285.0" cy="5.6" r="4.06" /><circle cx="295.0" cy="14.4" r="4.06" /><circle cx="295.0" cy="5.6" r="4.06" /></g></svg>'
    },
    {
      stoneId: 11,
      noc: "CAN",
      team: "Canada",
      homeTeam: 0,
      lastName: "Keenan",
      firstName: "Michael",
      task: 1,
      task_web: "Promotion Take-out",
      handle: 1,
      handle_web: "cw",
      points: 0,
      points_web: 0,
      comment: "No tick zone violation",
      svg: '<svg xmlns="http://www.w3.org/2000/svg" width="300" height="600"><rect x="0" y="0" width="300" height="600" fill="#ffffff" stroke="silver" stroke-width="0.5" /><g stroke="#646464" stroke-width="1"><circle cx="150.0" cy="440.0" r="120.0" fill="#c8c8ff" /><circle cx="150.0" cy="440.0" r="80.0" fill="#ffffff" /><circle cx="150.0" cy="440.0" r="40.0" fill="#a0ffc0" /><circle cx="150.0" cy="440.0" r="16.0" fill="#ffffff" /><line x1="0" y1="560.0" x2="300.0" y2="560.0" /><line x1="0" y1="440.0" x2="300.0" y2="440.0" /><line x1="0" y1="20.0" x2="300.0" y2="20.0" /><line x1="150.0" y1="20.0" x2="150.0" y2="560.0" /></g><g fill="#808080" stroke="#ffe600" stroke-width="0.5" fill-opacity="0" class="CUR_os"><circle cx="148.6" cy="283.8" r="8.65" /></g><g fill="#ff0000" stroke="black" stroke-width="1"><circle cx="149.0" cy="379.4" r="8.65" /><circle cx="47.8" cy="489.0" r="8.65" /><circle cx="25.0" cy="14.4" r="4.06" /><circle cx="25.0" cy="5.6" r="4.06" /><circle cx="15.0" cy="14.4" r="4.06" /><circle cx="15.0" cy="5.6" r="4.06" /><circle cx="5.0" cy="14.4" r="4.06" /><circle cx="5.0" cy="5.6" r="4.06" /></g><g fill="#ffe600" stroke="black" stroke-width="1"><circle cx="73.6" cy="342.4" r="8.65" /><circle cx="156.2" cy="363.0" r="8.65" /><circle cx="150.0" cy="590.0" r="8.65" class="CUR_cs" /><circle cx="150.0" cy="590.0" r="1.44" stroke-width="3" /><circle cx="275.0" cy="5.6" r="4.06" /><circle cx="285.0" cy="14.4" r="4.06" /><circle cx="285.0" cy="5.6" r="4.06" /><circle cx="295.0" cy="14.4" r="4.06" /><circle cx="295.0" cy="5.6" r="4.06" /></g></svg>'

    },
    {
      stoneId: 12,
      noc: "DEN",
      team: "Denmark",
      homeTeam: 1,
      lastName: "Jurlander Boege",
      firstName: "Kasper",
      task: 9,
      task_web: "Draw",
      handle: 1,
      handle_web: "ccw",
      points: 4,
      points_web: 100,
      comment: null,
      svg: '<svg xmlns="http://www.w3.org/2000/svg" width="300" height="600"><rect x="0" y="0" width="300" height="600" fill="#ffffff" stroke="silver" stroke-width="0.5" /><g stroke="#646464" stroke-width="1"><circle cx="150.0" cy="440.0" r="120.0" fill="#c8c8ff" /><circle cx="150.0" cy="440.0" r="80.0" fill="#ffffff" /><circle cx="150.0" cy="440.0" r="40.0" fill="#a0ffc0" /><circle cx="150.0" cy="440.0" r="16.0" fill="#ffffff" /><line x1="0" y1="560.0" x2="300.0" y2="560.0" /><line x1="0" y1="440.0" x2="300.0" y2="440.0" /><line x1="0" y1="20.0" x2="300.0" y2="20.0" /><line x1="150.0" y1="20.0" x2="150.0" y2="560.0" /></g><g fill="#ff0000" stroke="black" stroke-width="1"><circle cx="149.0" cy="379.4" r="8.65" /><circle cx="47.8" cy="489.0" r="8.65" /><circle cx="234.0" cy="442.6" r="8.65" class="CUR_cs" /><circle cx="234.0" cy="442.6" r="1.44" stroke-width="3" /><circle cx="25.0" cy="5.6" r="4.06" /><circle cx="15.0" cy="14.4" r="4.06" /><circle cx="15.0" cy="5.6" r="4.06" /><circle cx="5.0" cy="14.4" r="4.06" /><circle cx="5.0" cy="5.6" r="4.06" /></g><g fill="#ffe600" stroke="black" stroke-width="1"><circle cx="73.6" cy="342.4" r="8.65" /><circle cx="156.2" cy="363.0" r="8.65" /><circle cx="288.2" cy="590.0" r="8.65" /><circle cx="275.0" cy="5.6" r="4.06" /><circle cx="285.0" cy="14.4" r="4.06" /><circle cx="285.0" cy="5.6" r="4.06" /><circle cx="295.0" cy="14.4" r="4.06" /><circle cx="295.0" cy="5.6" r="4.06" /></g></svg>'
    },
    {
      stoneId: 13,
      noc: "CAN",
      team: "Canada",
      homeTeam: 0,
      lastName: "Keenan",
      firstName: "Michael",
      task: 1,
      task_web: "Promotion Take-out",
      handle: 1,
      handle_web: "cw",
      points: 0,
      points_web: 0,
      comment: "No tick zone violation",
      svg: '<svg xmlns="http://www.w3.org/2000/svg" width="300" height="600"><rect x="0" y="0" width="300" height="600" fill="#ffffff" stroke="silver" stroke-width="0.5" /><g stroke="#646464" stroke-width="1"><circle cx="150.0" cy="440.0" r="120.0" fill="#c8c8ff" /><circle cx="150.0" cy="440.0" r="80.0" fill="#ffffff" /><circle cx="150.0" cy="440.0" r="40.0" fill="#a0ffc0" /><circle cx="150.0" cy="440.0" r="16.0" fill="#ffffff" /><line x1="0" y1="560.0" x2="300.0" y2="560.0" /><line x1="0" y1="440.0" x2="300.0" y2="440.0" /><line x1="0" y1="20.0" x2="300.0" y2="20.0" /><line x1="150.0" y1="20.0" x2="150.0" y2="560.0" /></g><g fill="#808080" stroke="#ffe600" stroke-width="0.5" fill-opacity="0" class="CUR_os"><circle cx="148.6" cy="283.8" r="8.65" /></g><g fill="#ff0000" stroke="black" stroke-width="1"><circle cx="149.0" cy="379.4" r="8.65" /><circle cx="47.8" cy="489.0" r="8.65" /><circle cx="25.0" cy="14.4" r="4.06" /><circle cx="25.0" cy="5.6" r="4.06" /><circle cx="15.0" cy="14.4" r="4.06" /><circle cx="15.0" cy="5.6" r="4.06" /><circle cx="5.0" cy="14.4" r="4.06" /><circle cx="5.0" cy="5.6" r="4.06" /></g><g fill="#ffe600" stroke="black" stroke-width="1"><circle cx="73.6" cy="342.4" r="8.65" /><circle cx="156.2" cy="363.0" r="8.65" /><circle cx="150.0" cy="590.0" r="8.65" class="CUR_cs" /><circle cx="150.0" cy="590.0" r="1.44" stroke-width="3" /><circle cx="275.0" cy="5.6" r="4.06" /><circle cx="285.0" cy="14.4" r="4.06" /><circle cx="285.0" cy="5.6" r="4.06" /><circle cx="295.0" cy="14.4" r="4.06" /><circle cx="295.0" cy="5.6" r="4.06" /></g></svg>'

    },
    {
      stoneId: 14,
      noc: "DEN",
      team: "Denmark",
      homeTeam: 1,
      lastName: "Jurlander Boege",
      firstName: "Kasper",
      task: 9,
      task_web: "Draw",
      handle: 1,
      handle_web: "ccw",
      points: 4,
      points_web: 100,
      comment: null,
      svg: '<svg xmlns="http://www.w3.org/2000/svg" width="300" height="600"><rect x="0" y="0" width="300" height="600" fill="#ffffff" stroke="silver" stroke-width="0.5" /><g stroke="#646464" stroke-width="1"><circle cx="150.0" cy="440.0" r="120.0" fill="#c8c8ff" /><circle cx="150.0" cy="440.0" r="80.0" fill="#ffffff" /><circle cx="150.0" cy="440.0" r="40.0" fill="#a0ffc0" /><circle cx="150.0" cy="440.0" r="16.0" fill="#ffffff" /><line x1="0" y1="560.0" x2="300.0" y2="560.0" /><line x1="0" y1="440.0" x2="300.0" y2="440.0" /><line x1="0" y1="20.0" x2="300.0" y2="20.0" /><line x1="150.0" y1="20.0" x2="150.0" y2="560.0" /></g><g fill="#ff0000" stroke="black" stroke-width="1"><circle cx="149.0" cy="379.4" r="8.65" /><circle cx="47.8" cy="489.0" r="8.65" /><circle cx="234.0" cy="442.6" r="8.65" class="CUR_cs" /><circle cx="234.0" cy="442.6" r="1.44" stroke-width="3" /><circle cx="25.0" cy="5.6" r="4.06" /><circle cx="15.0" cy="14.4" r="4.06" /><circle cx="15.0" cy="5.6" r="4.06" /><circle cx="5.0" cy="14.4" r="4.06" /><circle cx="5.0" cy="5.6" r="4.06" /></g><g fill="#ffe600" stroke="black" stroke-width="1"><circle cx="73.6" cy="342.4" r="8.65" /><circle cx="156.2" cy="363.0" r="8.65" /><circle cx="288.2" cy="590.0" r="8.65" /><circle cx="275.0" cy="5.6" r="4.06" /><circle cx="285.0" cy="14.4" r="4.06" /><circle cx="285.0" cy="5.6" r="4.06" /><circle cx="295.0" cy="14.4" r="4.06" /><circle cx="295.0" cy="5.6" r="4.06" /></g></svg>'
    },
    {
      stoneId: 15,
      noc: "CAN",
      team: "Canada",
      homeTeam: 0,
      lastName: "Keenan",
      firstName: "Michael",
      task: 1,
      task_web: "Promotion Take-out",
      handle: 1,
      handle_web: "cw",
      points: 0,
      points_web: 0,
      comment: "No tick zone violation",
      svg: '<svg xmlns="http://www.w3.org/2000/svg" width="300" height="600"><rect x="0" y="0" width="300" height="600" fill="#ffffff" stroke="silver" stroke-width="0.5" /><g stroke="#646464" stroke-width="1"><circle cx="150.0" cy="440.0" r="120.0" fill="#c8c8ff" /><circle cx="150.0" cy="440.0" r="80.0" fill="#ffffff" /><circle cx="150.0" cy="440.0" r="40.0" fill="#a0ffc0" /><circle cx="150.0" cy="440.0" r="16.0" fill="#ffffff" /><line x1="0" y1="560.0" x2="300.0" y2="560.0" /><line x1="0" y1="440.0" x2="300.0" y2="440.0" /><line x1="0" y1="20.0" x2="300.0" y2="20.0" /><line x1="150.0" y1="20.0" x2="150.0" y2="560.0" /></g><g fill="#808080" stroke="#ffe600" stroke-width="0.5" fill-opacity="0" class="CUR_os"><circle cx="148.6" cy="283.8" r="8.65" /></g><g fill="#ff0000" stroke="black" stroke-width="1"><circle cx="149.0" cy="379.4" r="8.65" /><circle cx="47.8" cy="489.0" r="8.65" /><circle cx="25.0" cy="14.4" r="4.06" /><circle cx="25.0" cy="5.6" r="4.06" /><circle cx="15.0" cy="14.4" r="4.06" /><circle cx="15.0" cy="5.6" r="4.06" /><circle cx="5.0" cy="14.4" r="4.06" /><circle cx="5.0" cy="5.6" r="4.06" /></g><g fill="#ffe600" stroke="black" stroke-width="1"><circle cx="73.6" cy="342.4" r="8.65" /><circle cx="156.2" cy="363.0" r="8.65" /><circle cx="150.0" cy="590.0" r="8.65" class="CUR_cs" /><circle cx="150.0" cy="590.0" r="1.44" stroke-width="3" /><circle cx="275.0" cy="5.6" r="4.06" /><circle cx="285.0" cy="14.4" r="4.06" /><circle cx="285.0" cy="5.6" r="4.06" /><circle cx="295.0" cy="14.4" r="4.06" /><circle cx="295.0" cy="5.6" r="4.06" /></g></svg>'

    },
    {
      stoneId: 16,
      noc: "DEN",
      team: "Denmark",
      homeTeam: 1,
      lastName: "Jurlander Boege",
      firstName: "Kasper",
      task: 9,
      task_web: "Draw",
      handle: 1,
      handle_web: "ccw",
      points: 4,
      points_web: 100,
      comment: null,
      svg: '<svg xmlns="http://www.w3.org/2000/svg" width="300" height="600"><rect x="0" y="0" width="300" height="600" fill="#ffffff" stroke="silver" stroke-width="0.5" /><g stroke="#646464" stroke-width="1"><circle cx="150.0" cy="440.0" r="120.0" fill="#c8c8ff" /><circle cx="150.0" cy="440.0" r="80.0" fill="#ffffff" /><circle cx="150.0" cy="440.0" r="40.0" fill="#a0ffc0" /><circle cx="150.0" cy="440.0" r="16.0" fill="#ffffff" /><line x1="0" y1="560.0" x2="300.0" y2="560.0" /><line x1="0" y1="440.0" x2="300.0" y2="440.0" /><line x1="0" y1="20.0" x2="300.0" y2="20.0" /><line x1="150.0" y1="20.0" x2="150.0" y2="560.0" /></g><g fill="#ff0000" stroke="black" stroke-width="1"><circle cx="149.0" cy="379.4" r="8.65" /><circle cx="47.8" cy="489.0" r="8.65" /><circle cx="234.0" cy="442.6" r="8.65" class="CUR_cs" /><circle cx="234.0" cy="442.6" r="1.44" stroke-width="3" /><circle cx="25.0" cy="5.6" r="4.06" /><circle cx="15.0" cy="14.4" r="4.06" /><circle cx="15.0" cy="5.6" r="4.06" /><circle cx="5.0" cy="14.4" r="4.06" /><circle cx="5.0" cy="5.6" r="4.06" /></g><g fill="#ffe600" stroke="black" stroke-width="1"><circle cx="73.6" cy="342.4" r="8.65" /><circle cx="156.2" cy="363.0" r="8.65" /><circle cx="288.2" cy="590.0" r="8.65" /><circle cx="275.0" cy="5.6" r="4.06" /><circle cx="285.0" cy="14.4" r="4.06" /><circle cx="285.0" cy="5.6" r="4.06" /><circle cx="295.0" cy="14.4" r="4.06" /><circle cx="295.0" cy="5.6" r="4.06" /></g></svg>'
    },
  ];


  const statsData = [
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
          row_value_red: 116.7,
          row_value_yellow: 10.9, 
        },
        {
          row_index: 2,
          row_title: "counter-clockwise ↺",
          row_value_red: 122.2,
          row_value_yellow: 85.4,
        },
        {
          row_index: 3,
          row_title: "Total",
          row_value_red: 238.9,
          row_value_yellow: 96.3,
        }
      ]
    },
    {
      statName: "Last Stone Draw - Option 2",
      is_stat: true,
      unit: "cm",
      rows: [
        {
          row_index: 1,
          row_title: "clockwise ↻",
          row_value_red: 116.7,
          row_value_yellow: 10.9,
          row_value_max: 199.6 
        },
        {
          row_index: 2,
          row_title: "counter-clockwise ↺",
          row_value_red: "122.2",
          row_value_yellow: 85.4,
          row_value_max: 199.6 
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
      statName: "Last Stone Draw - Option 3",
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
    makeSVGResponsive($(".svg-container").eq(index).find("svg"));

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

    // Update stone select
    $(".endstone select.current-stone").val(`${index}`);

    updateButtons();

    fitCompetitorNames();
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
        // debugger;
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

  function refreshShotList() {
    $("#slider").empty();
    $(".endstone select.current-end").empty();
    $(".endstone select.current-stone").empty();
    $(".endstone select.current-end").append(`<option value="End 1">End 1</option>`);

    shotData.forEach((shot, idx) => {

      $("#slider").append(`<div class="item">
      <div class="svg-container"> </div>
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


  $(".endstone select.current-stone").on('change', function() {
    goTo(parseInt($(this).val()));
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


    refreshShotList();

    // Button clicks
    $firstBtn.on("click", () => goTo(0));
    $prevBtn.on("click", () => goTo(currentIndex - 1));
    $nextBtn.on("click", () => goTo(currentIndex + 1));
    $lastBtn.on("click", () => goTo(totalItems - 1));

    $arrowPrev.on("click", () => goTo(currentIndex - 1));
    $arrowNext.on("click", () => goTo(currentIndex + 1));

    $("#bfbblue").on("click", () => switchTheme("blue"));
    $("#bfbwhite").on("click", () => switchTheme("white"));


    // ---------- //
    // SVG slider //
    // ---------- //
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
        e.stopPropagation();
        goToStat(current - 1);
      });
      $("#head-to-head .header-next").on("click", function (e) {
        e.stopPropagation();
        goToStat(current + 1);
      });
    
      // Swipe
      let startX = 0, currentX = 0, isDragging = false;
      const swipeThreshold = 50;

      // --- Swipe detection ---
      $h2h.on("touchstart", function(e) {
        const touch = e.originalEvent.touches[0];
        const dx = Math.abs(touch.clientX - startX);
        const dy = Math.abs(touch.clientY - startY);
        if (dx > dy) e.preventDefault();

        startX = e.originalEvent.touches[0].clientX;
        isDragging = true;
      });

      $h2h.on("touchmove", function(e)  {
        if (!isDragging) return;
        currentX = e.originalEvent.touches[0].clientX;
      });

      $h2h.on("touchend", function(e) {
        if (!isDragging) return;
        isDragging = false;
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
    renderDots();
    refreshStatList();
    goTo(0);

  });




  startConnection();
});