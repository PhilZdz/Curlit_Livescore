$(document).ready(function () {
    // Version 1.3rc8 from 29.11.25
    const apiUrl = "https://livescores.worldcurling.org/curlitsse";
    // const apiUrl = "http://sse.curlit.local:5057";

    const params = new URLSearchParams(window.location.search);
    var season = "2526";
    var competition = "ECCA";
    var eventId = 1;
    var sessionId = 49;
    var gameId = 1;
    var endId = 11;
    var currentEndIndex;
    var currentEndStoneList;
    var currentEndStoneIndex;
    var currentSvgData;
    var sheetInitialized = false;

    
     // The name of the group that sign
     const signalGroupName = `${competition != null ? competition : "TEST"}-${eventId}-${sessionId}-${gameId}-STONE`;

    function startConnection() {
        const connection = new signalR.HubConnectionBuilder()
            .withUrl(`${apiUrl}/notificationHub`, { withCredentials: false })
            .build();

        connection.on("ReceiveMessage", function (gameStoneList) {
            // Get the last end/last stone
            currentEndStoneList = gameStoneList[0].ends.at(-1);
            currentEndStoneIndex = currentEndStoneList.stones.length - 1;

            // Load the SVG of the last one
            var lastStone = currentEndStoneList.stones.at(-1);

            // Parse the SVG
            var svgData = parseSVGData(lastStone.svg);
            currentSvgData = svgData;

            console.log("Maybe switch ends from " + currentEndIndex + " to " + lastStone.endID);
                

            // If we changed sheet, clear and rebuild
            if (sheetInitialized && lastStone.endID != currentEndIndex) {           
                sheetInitialized = false;
            }

            if (!sheetInitialized) {
                renderInitialViewport(svgData);
                sheetInitialized = true;
            }

            refreshStoneInfo(lastStone);

            showEndAtIndex(currentEndStoneIndex);
        });

        connection.onclose(function () {
            // Handle connection closed event
            setOnlineHeader(false);
            console.error("Connection closed. Retrying in 5 seconds");
            setTimeout(startConnection, 5000);

        });

        connection.start().then(function () {
            var callUrl = `${apiUrl}/Stone/LiveStones`

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
            if (endId != null) {
                urlParams["endId"] = endId;
            }

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
                .then(function (gameStoneList) {
                    // Hide the loader and show the session title
                    $("#loader").hide();

                    // Subscribe to real time updates
                    connection.invoke("SubscribeToGroup", signalGroupName).catch(err => console.error(err.toString()));
                    
                    if (gameStoneList.length == 0) {
                        return;
                    }

                    // Get the last end/last stone
                    // currentEndStoneList = gameStoneList[0].ends.at(-1);
                    currentEndStoneList = gameStoneList;
                    currentEndStoneIndex = currentEndStoneList.stones.length - 1;

                    // Load the SVG of the last one
                    var lastStone = currentEndStoneList.stones.at(-1);

                    // Parse the SVG
                    var svgData = parseSVGData(lastStone.svg);
                    currentSvgData = svgData;

                    // Build the viewport
                    renderInitialViewport(svgData);

                    refreshStoneInfo(lastStone);

                    refreshStoneData(svgData);

                    sheetInitialized = true;
                });
        }).catch(function (err) {
            setOnlineHeader(false);
            console.error(err.toString())
            setTimeout(startConnection, 5000);
        });

    }

    function renderInitialViewport(svgData) {
        scene.children.forEach((child) => {
            if ((child.tag != null && child.tag.startsWith("st")) || (child.name != "light" && child.type != "AmbientLight")) {
                scene.remove(child);
                if (child.geometry) child.geometry.dispose();
                if (child.material) child.material.dispose();
            }
        });
             
        offsetX = svgData.sheet.width / 2;
        offsetY = svgData.sheet.height / 2;

        // Call the function
        var sheet = createSheet(svgData.sheet);

        // Add lines and circles from group 1
        addSVGElementsToPlane(sheet, svgData.groups[0]);

        scene.add(sheet);

        animate();
    }

    function refreshStoneInfo(stoneInfo) {
        currentEndIndex = stoneInfo.endID;
        $("#info .end").text(stoneInfo.endID);
        $("#info .stone").text(stoneInfo.stoneID);
        $("#info .team").text(stoneInfo.teamName);
        $("#info .player").text(stoneInfo.playerName);
        $("#info .points").text(stoneInfo.points);
    }

    function refreshStoneData(svgData) {
        stones = [];

        var stoneGroups = svgData.groups.filter(g => g.id != "SheetDefinition" && g.class != "CUR_os");
        
        Object.values(stoneGroups).forEach(stoneGp => {
            placeStones(scene, stones, stoneGp.circles, stoneGroup, spotLight, fbxLoader, stoneGp.fill, stoneGp.stroke, (stoneGp.class == "CUR_osr" || stoneGp.class == "CUR_osy"));
        });
    }

    $("#nextScene").click(function(){
        if (currentEndStoneIndex == currentEndStoneList.stones.length) {
            return;
        }

        showEndAtIndex(currentEndStoneIndex + 1);
    });

    $("#backScene").click(function(){

        if (currentEndStoneIndex == 0) {
            return;
        }
        
        showEndAtIndex(currentEndStoneIndex - 1);
    });

    $("#firstScene").click(function(){
        showEndAtIndex(0);
    });

    $("#lastScene").click(function(){
        showEndAtIndex(currentEndStoneList.stones.length);
    });


    function showEndAtIndex(idx) {
        var newInfo = currentEndStoneList.stones.at(idx);
        refreshStoneInfo(newInfo);

        var newSvg = newInfo.svg;

        var newSvgData = parseSVGData(newSvg);

        // Clear the spotlight
        scene.remove(spotLight);
                
        stones.forEach((stone) => {
            scene.remove(stone); // Remove each stone from the scene
        });

        refreshStoneData(newSvgData);


        // The code below is way too complex for my current brain capacity
        // var unchangedStones = [];
        // var newGroups = [];
        // var stoneGroups = newSvgData.groups.filter(g => g.id != "SheetDefinition");
        // var oldStoneGroups = currentSvgData.groups.filter(g => g.id != "SheetDefinition");
        
        // Object.values(stoneGroups).forEach(newStoneGp => {
        //    var matchingOldGp = oldStoneGroups.find(osg => osg.class == newStoneGp.class && osg.fill == newStoneGp.fill && osg.stroke == newStoneGp.stroke);
           
        //    var deltaStoneGp = 
        //     { 
        //         class: newStoneGp.class, 
        //         fill: newStoneGp.fill , 
        //         stroke: newStoneGp.stroke , 
        //         circles: [] 
        //     };

        //    // If the group was already present
        //    if (matchingOldGp) {
        //         Object.values(newStoneGp.circles).forEach(newStone => {
        //             var stoneTag = `st_${newStoneGp.stroke}_${newStoneGp.fill}_${newStone.cx}_${newStone.cy}_${newStone.r}`
        
        //             var matchingSvgSt = matchingOldGp.circles.find(st => st.cx == newStone.cx && st.cy == newStone.cy && st.r == newStone.r);

        //             if (matchingSvgSt) {
        //                 // The stone was already there, at the same position
        //                 var placedStone = stones.find(st => st.tag == stoneTag);

        //                 if (placedStone) {
        //                     unchangedStones.push(placedStone);
        //                 }
        //                 else {
        //                     console.log("Most likely a stone move, we'll just remove it");
        //                 }      
        //             }
        //             else {
        //                 deltaStoneGp.circles.push(newStone);
        //             }
        //         });

        //         newGroups.push(deltaStoneGp);
        //    } 
        //    else {
        //         // A whole new group to be added
        //         newGroups.push(newStoneGp);
        //    }
        // });


        // // Clear the obsolete stones
        // var changedStones = stones.filter(stone => !unchangedStones.includes(stone));
            
        // changedStones.forEach((changedStone) => {
        //     scene.remove(changedStone); // Remove each stone from the scene
        // });
        
        // // Place the new stones
        // Object.values(stoneGroups).forEach(newStoneGp => {
        //     placeStones(scene, stones, newStoneGp.circles, stoneGroup, spotLight, fbxLoader, newStoneGp.fill, newStoneGp.stroke, newStoneGp.class == "CUR_os");
        // });

        currentEndStoneIndex = idx;
    }

    startConnection();
});



var scene = new THREE.Scene();
const fbxLoader = new THREE.FBXLoader();
const unitScale = 1;
var offsetX = 0;
var offsetY = 0;

scene.background = new THREE.Color(0x87CEEB); // Sky blue background

// Load Curling Stone FBX Models and Arrange in Two Rows
const textureLoader = new THREE.TextureLoader();
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

var stones = []; // Array to store stones for interaction
const aspect = window.innerWidth / window.innerHeight;
const viewSize = 75; // Adjust view size based on your scene

const camera = new THREE.OrthographicCamera(
    -aspect * viewSize / 2, // left
    aspect * viewSize / 2,  // right
    viewSize / 2, // top shifted upward
    -viewSize / 2, // bottom shifted upward
    0.1,                    // near
    1000                    // far
);


const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// Add OrbitControls
const controls = new THREE.OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.1;

// Restrict vertical orbit
controls.minDistance = 100; // Minimum zoom distance
controls.maxDistance = 1000; // Maximum zoom distance
controls.maxPolarAngle = Math.PI / 2; // Allow up to 90 degrees

// Calculate bounding box of the scene
const box = new THREE.Box3().setFromObject(scene);
const size = new THREE.Vector3();
const center = new THREE.Vector3();
box.getSize(size);
box.getCenter(center);

// Add lighting
const ambientLight = new THREE.AmbientLight(0xaaaaaa, 2.6); // Soft white ambient light
ambientLight.name == "light"
scene.add(ambientLight);

var spotLight = new THREE.SpotLight(0xffffff, 1); // White light with intensity 1
                        

// Add the stone group
const stoneGroup = new THREE.Group(); // Create a group for stones
stoneGroup.name = "stoneGroup"; // Optionally name the group for reference
scene.add(stoneGroup);


let isAnimating = false; // Prevent multiple animations
let animationStart = null;
const animationDuration = 1000; // 1 second animation
const startPosition = new THREE.Vector3(); // Start position for camera
const targetPosition = new THREE.Vector3(); // Target position for camera
const startTarget = new THREE.Vector3(); // Start position for controls target
const endTarget = new THREE.Vector3(); // Target position for controls target
