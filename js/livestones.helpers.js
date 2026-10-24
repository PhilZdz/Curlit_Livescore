// Version 2.0rc1 from 12.10.26

window.CurlitLiveStonesHelpers = {
    getLetterFromIndex(index) {
        // Ensure the input is within the valid range (1 to 26)
        if (index < 1 || index > 26) {
            return "Invalid Index";
        }

        const asciiCode = 'A'.charCodeAt(0) + (index - 1);
        return String.fromCharCode(asciiCode);
    },

    renderBestFit(formattedName) {
        if (typeof formattedName !== "string") return formattedName;

        const match = formattedName.match(/^\{([^|]+)\|([^}]+)\}$/);
        if (!match) return formattedName;

        const [, shortName, longName] = match;
        return `<span class="shortName">${shortName}</span><span class="longName">${longName}</span>`;
    },

    displayRowTitle(rowTitle) {
        if (typeof rowTitle !== "string") return rowTitle;

        const match = rowTitle.match(/^\{([^|]+)\|([^}]+)\}$/);
        if (!match) return rowTitle;

        const [, leftName, rightName] = match;
        return `<span class="leftName">${leftName}</span><span class="rightName">${rightName}</span>`;
    },

    makeSVGResponsive($svg) {
        const w = $svg.attr("width");
        const h = $svg.attr("height");

        if (w && h) {
            $svg.attr("viewBox", `0 0 ${parseFloat(w)} ${parseFloat(h)}`);
        }

        // Remove hardcoded attributes so CSS can take over
        $svg.removeAttr("width").removeAttr("height");

        // Keep proportions
        $svg.attr("preserveAspectRatio", "xMidYMid meet");
    },

    fitText($el, maxSize = 32, minSize = 12) {
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
    },

    parseSVGData(svgString) {
        // Create a DOM parser
        const parser = new DOMParser();
        const scale = 0.1;
        const svgDoc = parser.parseFromString(svgString, "image/svg+xml");

        const rects = Array.from(svgDoc.querySelectorAll("rect"));

        // Parse <rect> elements
        const parsedRects = rects.map(rect => ({
            x: parseFloat(rect.getAttribute("x")) * scale,
            y: parseFloat(rect.getAttribute("y")) * scale,
            width: parseFloat(rect.getAttribute("width")) * scale,
            height: parseFloat(rect.getAttribute("height")) * scale,
            fill: rect.getAttribute("fill"),
            stroke: rect.getAttribute("stroke"),
            strokeWidth: parseFloat(rect.getAttribute("stroke-width"))
        }));

        // Get all <g> groups
        const groups = Array.from(svgDoc.querySelectorAll("g"));

        // Extract data from each group
        const parsedGroups = groups.map((group, index) => {
            const circles = Array.from(group.querySelectorAll("circle"))
                .filter(circle => circle.getAttribute("stroke-width") == null)
                .map(circle => ({
                    cx: parseFloat(circle.getAttribute("cx")) * scale,
                    cy: parseFloat(circle.getAttribute("cy")) * scale,
                    r: parseFloat(circle.getAttribute("r")) * scale,
                    fill: circle.getAttribute("fill"),
                    stroke: circle.getAttribute("stroke"),
                    strokeWidth: parseFloat(circle.getAttribute("stroke-width")) * scale,
                    class: circle.getAttribute("class") || null
                }));

            // First one is the sheet
            if (index == 0) {
                // Extract lines in this group
                const lines = Array.from(group.querySelectorAll("line")).map(line => ({
                    x1: parseFloat(line.getAttribute("x1")) * scale,
                    y1: parseFloat(line.getAttribute("y1")) * scale,
                    x2: parseFloat(line.getAttribute("x2")) * scale,
                    y2: parseFloat(line.getAttribute("y2")) * scale,
                    stroke: line.getAttribute("stroke"),
                    strokeWidth: parseFloat(line.getAttribute("stroke-width")) * scale
                }));

                return {
                    id: "SheetDefinition",
                    circles,
                    lines
                };
            }
            else {
                return {
                    fill: group.getAttribute("fill"),
                    stroke: group.getAttribute("stroke"),
                    class: group.getAttribute("class"),
                    circles
                };
            }
        });

        return {
            sheet: parsedRects[0],
            groups: parsedGroups
        };
    }
};