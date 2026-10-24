// Version 2.0rc1 from 12.10.26

window.CurlitLiveScoresRenderer = {
    renderTileData(data, $template, $container, competitionCode) {
        // Cleanup the tiles that are no longer live
        const matchupKeys = data.map(obj => obj.matchupKey);

        $('.row').each(function () {
            const dataId = $(this).data('id');
            if (!matchupKeys.includes(dataId)) {
                $(this).remove();
            }
        });

        data.forEach(result => {
            let $tile = $(`[data-id='${result.matchupKey}']`); // Check if the tile already exists

            if ($tile.length === 0) {
                // If tile doesn't exist, clone the template
                $tile = $template.clone();

                // Visual updates
                this.feedTileUI($tile, result, competitionCode);

                $tile.removeAttr('id'); // Remove id to avoid duplication
                $tile.attr('data-id', result.matchupKey); // Add the unique identifier
                $tile.show(); // Make it visible
                $container.append($tile); // Append it to the container
            }
            else {
                // Visual updates
                this.feedTileUI($tile, result, competitionCode);
            }
        });
    },

    feedTileUI(tile, result, competitionCode) {
        // Header
        tile.find('.matchup-tile').attr('class', `matchup-tile ${result.status}`);

        tile.find('span.sheet').text(result.sheet);

        let $leftText = tile.find('span.left-text');
        var leftText = result.gamesTitle;
        $leftText.removeClass('longText');
        $leftText.removeClass('shortSessionName');
        // Special case - shorten the session title if it contains Women's Round Robin (only on smaller devices)
        var sequencesToStrip = ["Women's Round Robin", 'Mixed Doubles Round Robin', 'Mixed Team Round Robin', "Men's Round Robin"];
        var sequenceToStrip2 = ' Round Robin';
        if (leftText.length > 28 && sequencesToStrip.some(item => leftText.includes(item))) {
            leftText = leftText.replace(sequenceToStrip2, " <span class='wideScreenText'>Round Robin</span>");
            $leftText.addClass('longText');
        }
        else if (leftText.length > 40 && leftText.indexOf(sequenceToStrip2) != -1) {
            leftText = leftText.replace(sequenceToStrip2, '');
            $leftText.addClass('longText');
        }
        else if (leftText.length > 20) {
            $leftText.addClass('longText');
        }
        $leftText.html(leftText);

        tile.find('span.middle-text').text(result.status);

        let $generalComment = $('#ContentMain_SessionComment');
        if ($generalComment.text() != result.generalComment) {
            $generalComment.text(result.generalComment);
        }

        let $rightComment = tile.find('.right-area .me-1');
        $rightComment.removeClass('longTextRight');
        $rightComment.html(result.gameComment);
        if (result.gameComment != null && result.gameComment != '' && result.gameComment.length > 14) {
            $rightComment.addClass('longTextRight');
        }

        if (result.status == 'official') {
            tile.find('.right-area .btnStats').attr('href', `/${competitionCode}/aspnet/sessionstats.aspx?EventID=${result.eventID}&GameID=${result.gameID}&SessionID=${result.sessionID}`);
        }
        else {
            tile.find('.right-area .btnStats').attr('href', `/${competitionCode}/aspnet/currentstats.aspx?EventID=${result.eventID}&Sheet=${result.sheet}&SessionID=${result.sessionID}`);
        }

        tile.find('.right-area .btnGraphics').attr('href', `/${competitionCode}/aspnet/GameCenter.aspx?EventID=${result.eventID}&Sheet=${result.sheet}&SessionID=${result.sessionID}`);

        if (result.doStats == true) {
            tile.find('.right-area .btnStats img').attr('src', '../general/proc-button.svg');
            tile.find('.right-area .btnStats img').attr('alt', 'Line-Up');
        }
        else {
            tile.find('.right-area .btnStats img').attr('src', '../general/lineup-button.svg');
        }

        if (result.doGraphics == false) {
            tile.find('.right-area .btnGraphics').hide();
        }

        // Home team
        tile.find('.summary .home img.flag').attr('src', `https://livescores.worldcurling.org/flags/${result.homeTeam.noc}.svg`);
        tile.find('.summary .home .team-name').html(`<span class='short'>${result.homeTeam.teamShortName}</span><span class='long'>${result.homeTeam.teamLongName}</span>`);
        tile.find('.summary .home .score').text(result.homeTeam.total);
        tile.find('.summary .home .team-history').text(result.homeTeam.history);
        tile.find('.summary .home .team-history').attr('title', 'wins - losses');

        // Away team
        tile.find('.summary .away img.flag').attr('src', `https://livescores.worldcurling.org/flags/${result.awayTeam.noc}.svg`);
        tile.find('.summary .away .team-name').html(`<span class='short'>${result.awayTeam.teamShortName}</span><span class='long'>${result.awayTeam.teamLongName}</span>`);
        tile.find('.summary .away .score').text(result.awayTeam.total);
        tile.find('.summary .away .team-history').text(result.awayTeam.history);
        tile.find('.summary .away .team-history').attr('title', 'wins - losses');

        // Scoreboard
        var thead = tile.find('.scoreboard thead');
        var homeRow = tile.find('.scoreboard tbody tr').eq(0);
        var awayRow = tile.find('.scoreboard tbody tr').eq(1);

        // Clear the scoreboard
        thead.empty();
        homeRow.find('td').remove();
        awayRow.find('td').remove();

        // NOC
        thead.append('<th class="noc"></th>');
        homeRow.append(`<td class="noc">${result.homeTeam.noc}</td>`);
        awayRow.append(`<td class="noc">${result.awayTeam.noc}</td>`);

        // LSFE
        thead.append('<th class="lsfe"></th>');
        homeRow.append(`<td class="lsfe">${result.homeTeam.lsfe == true ? '✱' : ''}</td>`);
        awayRow.append(`<td class="lsfe">${result.awayTeam.lsfe == true ? '✱' : ''}</td>`);

        // LSD (only on desktop)
        if (result.homeTeam.lsd.total != null) {
            thead.append('<th class="lsd-lsfe" colspan=3>LSD/LSFE</th>');
            homeRow.append(`<td class="lsd-lsfe" colspan=2><span>${result.homeTeam.lsd.total != null ? Number(result.homeTeam.lsd.total).toFixed(1) + 'cm' : ''}</span></td><td class="lsd-lsfe">${result.homeTeam.lsfe == true ? '✱' : ''}</td>`);
            awayRow.append(`<td class="lsd-lsfe" colspan=2><span>${result.awayTeam.lsd.total != null ? Number(result.awayTeam.lsd.total).toFixed(1) + 'cm' : ''}</span></td><td class="lsd-lsfe">${result.awayTeam.lsfe == true ? '✱' : ''}</td>`);
        }
        else {
            thead.append('<th class="lsd-lsfe" colspan=2>LSFE</th><th></th>');
            homeRow.append(`<td class="lsd-lsfe-center" colspan=2><span>${result.homeTeam.lsfe == true ? '✱' : ''}</td><td></td>`);
            awayRow.append(`<td class="lsd-lsfe-center" colspan=2><span>${result.awayTeam.lsfe == true ? '✱' : ''}</td><td></td>`);
        }

        // ENDS
        var idx = 1;
        Object.entries(result.ends).forEach(([endName, endDetails]) => {
            thead.append(`<th>${endName}</th>`);

            var homeClass = '';
            var awayClass = '';
            var homeSpanClass = '';
            var awaySpanClass = '';

            // Hammer
            if (result.cEnd == idx && result.homeTeam.lsce == true) {
                homeClass = homeClass + 'hammer';
            }
            if (result.cEnd == idx && result.awayTeam.lsce == true) {
                awayClass = awayClass + 'hammer';
            }

            // Powerplay
            if (result.homeTeam.ppE1 == idx || result.homeTeam.ppE2 == idx) {
                homeSpanClass = 'powerplay';
            }
            if (result.awayTeam.ppE1 == idx || result.awayTeam.ppE2 == idx) {
                awaySpanClass = 'powerplay';
            }

            // Extra end placeholder, no border (for small displays)
            if (endName == '') {
                homeClass = homeClass + ' no-border';
                awayClass = awayClass + ' no-border';
            }

            homeRow.append(`<td${homeClass != '' ? ` class=\"${homeClass}\"` : ''}><span${homeSpanClass != '' ? ` class=\"${homeSpanClass}\"` : ''}>${endDetails.h}</span></td>`);
            awayRow.append(`<td${awayClass != '' ? ` class=\"${awayClass}\"` : ''}><span${awaySpanClass != '' ? ` class=\"${awaySpanClass}\"` : ''}>${endDetails.a}</span></td>`);

            idx++;
        });

        // Score
        thead.append('<th class="score"></th>');
        homeRow.append(`<td class="score">${result.homeTeam.total}</td>`);
        awayRow.append(`<td class="score">${result.awayTeam.total}</td>`);

        // Details
        var homeDetails = tile.find('table.details-content tr').eq(0);
        var awayDetails = tile.find('table.details-content tr').eq(1);

        // Hide the header if the LSFE is already decided
        if ((result.homeTeam.lsd.total == null && result.homeTeam.lsfe == true) || (result.awayTeam.lsd.total == null && result.awayTeam.lsfe == true)) {
            tile.find('.details').hide();
        }

        homeDetails.find('td.noc').text(result.homeTeam.noc);
        homeDetails.find('td.lsfe').text(`${result.homeTeam.lsfe == true ? '✱' : ''}`);
        homeDetails.find('td').eq(2).text(result.homeTeam.lsd.cw != null ? Number(result.homeTeam.lsd.cw).toFixed(1) : null);
        homeDetails.find('td').eq(3).text(result.homeTeam.lsd.ccw != null ? Number(result.homeTeam.lsd.ccw).toFixed(1) : null);
        homeDetails.find('td.lsd').text(result.homeTeam.lsd.total != null ? `${Number(result.homeTeam.lsd.total).toFixed(1)}cm` : null);
        homeDetails.find('td.score span').text(result.homeTeam.total);

        awayDetails.find('td.noc').text(result.awayTeam.noc);
        awayDetails.find('td.lsfe').text(`${result.awayTeam.lsfe == true ? '✱' : ''}`);
        awayDetails.find('td').eq(2).text(result.awayTeam.lsd.cw != null ? Number(result.awayTeam.lsd.cw).toFixed(1) : null);
        awayDetails.find('td').eq(3).text(result.awayTeam.lsd.ccw != null ? Number(result.awayTeam.lsd.ccw).toFixed(1) : null);
        awayDetails.find('td.lsd').text(result.awayTeam.lsd.total != null ? `${Number(result.awayTeam.lsd.total).toFixed(1)}cm` : null);
        awayDetails.find('td.score span').text(result.awayTeam.total);
    }
};