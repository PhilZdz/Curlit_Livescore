
window.addEventListener('click', (event) => {
    // Map mouse click to normalized device coordinates
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects(stones, true);

    if (intersects.length > 0 && !isAnimating) {
        const clickedStone = intersects[0].object.parent;
        const stonePosition = clickedStone.position.clone();

        // Set up animation parameters
        isAnimating = true;
        animationStart = performance.now();

        // Get the current camera position and controls target
        startPosition.copy(camera.position); // Current camera position
        startTarget.copy(controls.target);   // Current target of OrbitControls

        // Define the camera's target position for the top-down view
        targetPosition.set(stonePosition.x, 90, stonePosition.z); // Move camera above the stone
        endTarget.set(stonePosition.x, stonePosition.y, stonePosition.z); // Focus on the stone
    }
});



window.addEventListener('resize', () => {
    // Update camera aspect ratio to match the new window size
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix(); // Recalculate the projection matrix

    // Adjust renderer size to fill the new window dimensions
    renderer.setSize(window.innerWidth, window.innerHeight);

    // Optional: If you're using an orthographic camera, maintain consistent proportions
    if (camera.isOrthographicCamera) {
        const aspect = window.innerWidth / window.innerHeight;
        camera.left = -aspect * viewSize / 2;
        camera.right = aspect * viewSize / 2;
        camera.top = viewSize / 2 + 340 * (viewSize / window.innerHeight), // top shifted upward
            camera.bottom = -viewSize / 2 + 340 * (viewSize / window.innerHeight), // bottom shifted upward
            camera.updateProjectionMatrix();
    }
});


// Animate camera transition
function animateCamera() {
    if (isAnimating) {
        const currentTime = performance.now();
        const elapsedTime = currentTime - animationStart;
        const t = Math.min(elapsedTime / animationDuration, 1); // Normalize time [0, 1]

        // Smoothly interpolate camera position and target
        camera.position.lerpVectors(startPosition, targetPosition, t);
        controls.target.lerpVectors(startTarget, endTarget, t);

        controls.update(); // Update controls to match

        // End animation
        if (t === 1) {
            isAnimating = false;
        }
    }
}

// Call this in your render loop
function animate() {
    requestAnimationFrame(animate);
    animateCamera(); // Handle camera animation
    controls.update();
    renderer.render(scene, camera);
}

// -------- //
// Creators //
// -------- //
// Create a rectangle in the three.js scene
function createSheet(rectData) {
    // Create the geometry and material
    var geometry = new THREE.PlaneGeometry(rectData.width, rectData.height);

    var frostedMaterial = new THREE.MeshStandardMaterial({
        color: 0xf7fdff,
        roughness: 0.7,
        metalness: 0.4,
        transparent: true,
        opacity: 0.5
    });


    // Create the mesh and position it
    var rectangle = new THREE.Mesh(geometry, frostedMaterial);

    // Adjust position: swap axes
    rectangle.position.set(
        rectData.x || 0, // Swap z -> x
        rectData.y,      // Keep y unchanged
        rectData.z || 0  // Swap x -> z
    );

    // Adjust rotation: ensure proper alignment
    rectangle.rotation.set(
        0,       // Rotate on x-axis if needed
        0, // Flip orientation if necessary
        0        // No rotation on z-axis
    );

    rectangle.rotation.set(-Math.PI / 2, 0, 0);
    rectangle.renderOrder = 0; // Higher index = drawn later/on top
    rectangle.name = "sheet";

    // rectangle.position.set(rectData.x + rectData.width / 2, -(rectData.y + rectData.height / 2), 0); // Center the rectangle based on its x, y

    // Add the rectangle to the scene
    return rectangle;
}

function addSVGElementsToPlane(plane, groupData) {
    var { circles, lines } = groupData;

    // Add circles
    circles.forEach((circle, index) => {
        var geometry = new THREE.CircleGeometry(circle.r, 128); // Adjust radius with unit scale
        var material = new THREE.MeshBasicMaterial({ color: circle.fill, side: THREE.DoubleSide, depthWrite: false, transparent: false });
        var mesh = new THREE.Mesh(geometry, material);

        // Position circle (invert Y-axis)
        mesh.position.set(-circle.cx + offsetX, -circle.cy + offsetY, 0.01); // Offset slightly in Z to avoid z-fighting
        mesh.tag = "svgElement";
        mesh.renderOrder = index + 1; // Higher index = drawn later/on top

        plane.add(mesh);
    });



    // Add lines
    lines.forEach((line, index) => {
        var geometry = new THREE.BufferGeometry().setFromPoints([
            new THREE.Vector3(-line.x1 + offsetX, -line.y1 + offsetY, 0.01),
            new THREE.Vector3(-line.x2 + offsetX, -line.y2 + offsetY, 0.01)
        ]);
        var material = new THREE.LineBasicMaterial({ color: "black", linewidth: 1, depthWrite: false });
        var lineMesh = new THREE.Line(geometry, material);
        lineMesh.renderOrder = index + 1 + circles.length; // Higher index = drawn later/on top
        lineMesh.tag = "svgElement";
        plane.add(lineMesh);
    });
}

function placeStones(scene, stones, circles, stoneGroup, spotLight, fbxLoader, fill, stroke, isTakenout) {

    var yellowHex = "#ffdc00"
    var redHex = "#ff0000";
    const redStoneTexture = textureLoader.load('textures/stoneRedText.png');
    const yellowStoneTexture = textureLoader.load('textures/stoneYellowText.png');
    const cRedStoneTexture = textureLoader.load('textures/stoneRedTextC.png');
    const cYellowStoneTexture = textureLoader.load('textures/stoneYellowTextC.png');

    const normalRed = new THREE.MeshStandardMaterial({ map: redStoneTexture, side: THREE.DoubleSide});
    const normalYellow = new THREE.MeshStandardMaterial({ map: yellowStoneTexture, side: THREE.DoubleSide });
    const brightRed = new THREE.MeshStandardMaterial({ map: cRedStoneTexture, side: THREE.DoubleSide });
    const brightYellow = new THREE.MeshStandardMaterial({ map: cYellowStoneTexture, side: THREE.DoubleSide });

    
    var stoneMat;
    var idx = 1;

    circles.forEach(circle => {
        fbxLoader.load('objects/stone4.fbx', (stone) => {

            if (!Number.isNaN(circle.strokeWidth)) {
                return;
            }

            // Traverse and optimize loaded object
            stone.traverse((child) => {
                if (child.isMesh) {
                    if (circle.class == "CUR_cs") {
                        // Create a spotlight
                        spotLight.position.set(10, 60, 10); // Position the spotlight above the scene
                        spotLight.angle = Math.PI / 164; // Set the spread of the spotlight
                        spotLight.penumbra = 0.2; // Add softness to the light's edges
                        spotLight.castShadow = true; // Enable shadow casting
                        spotLight.name == "light";
                        // spotLight.material = currentStoneMat;

                        // Add the spotlight to the scene
                        scene.add(spotLight);

                        // Create a target for the spotlight
                        const lightTarget = new THREE.Object3D();
                        lightTarget.position.set(circle.cx - offsetX, 0, circle.cy - offsetY); // Define the target's x, y, z position
                        lightTarget.name == "light";
                        scene.add(lightTarget);

                        // Set the spotlight to target the custom coordinates
                        spotLight.target = lightTarget;
                        stoneMat = fill == redHex ? brightRed : brightYellow;                 

                        function animateStone() {
                            requestAnimationFrame(animateStone); // Continuously call the animation loop

                            // Rotate the stone
                            // child.rotation.x += 0.01; // Rotate along X-axis
                            // child.rotation.y += 0.01; // Rotate along X-axis
                            child.rotation.z += 0.01; // Rotate along Y-axis

                        }

                        animateStone(); // Start the animation

                    }
                    else {
                        // debugger;
                        stoneMat = fill == redHex ? normalRed : normalYellow; 
                    }

                    
                    if (isTakenout) {
                        var transparentMaterial = stoneMat.clone(); // Clone the material
                        transparentMaterial.transparent = true;     // Enable transparency
                        transparentMaterial.opacity = 0.2;          // Set the desired opacity
                        
                        child.material = transparentMaterial;
                    }
                    else {
                        child.material = stoneMat;
                    }

                    child.geometry.computeVertexNormals();
                    child.castShadow = true; // Enable shadows if needed
                    child.receiveShadow = true;
                }
            });


            var stoneSc = 0.015 * circle.r / 8.5; // PZ Originally 8.65, but looked inaccurate

            // Scale the stone object to match the scene
            stone.scale.set(stoneSc, stoneSc, stoneSc);
            // Position the stone at the circle's coordinates (invert Y-axis)
            stone.position.set(circle.cx - offsetX, 0, circle.cy - offsetY); // Adjust Z if necessary
            stone.tag = `st_${stroke}_${fill}_${circle.cx}_${circle.cy}_${circle.r}`;

            stones.push(stone); // Add stone to the array for raycasting
            stoneGroup.add(stone);

            // Add the stone to the scene
            scene.add(stone);

            idx++;
        });
    });

    return stoneGroup;
}


// Function to move a stone by name
function moveStoneByName(name, newX, newY) {
    // Find the stone by name
    const stone = stones.find(s => s.name === name);
    if (stone) {
        // Update position
        stone.position.set(newX, stone.position.y, newY); // Keep original Y height
        console.log(`Moved ${name} to X: ${newX}, Y: ${newY}`);
    } else {
        console.error(`Stone with name "${name}" not found.`);
    }
}


function parseSVGData(svgString) {
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