// ============================================================
// INTERSURV WEBSITE
// FIRESTORE + GOOGLE MAP + TRAVERSE
// ============================================================


// ============================================================
// HOME PAGE BUTTONS
// ============================================================

const btnStart = document.getElementById("btnStart");
const btnAbout = document.getElementById("btnAbout");
const btnSettings = document.getElementById("btnSettings");
const btnAdmin = document.getElementById("btnAdmin");


if (btnStart) {

    btnStart.addEventListener("click", function () {

        window.location.href = "map.html";

    });

}


if (btnAbout) {

    btnAbout.addEventListener("click", function () {

        window.location.href = "about.html";

    });

}


if (btnSettings) {

    btnSettings.addEventListener("click", function () {

        window.location.href = "settings.html";

    });

}


if (btnAdmin) {

    btnAdmin.addEventListener("click", function () {

        window.location.href = "admin.html";

    });

}


// ============================================================
// BACK TO HOME
// ============================================================

function goHome() {

    window.location.href = "index.html";

}


// ============================================================
// GLOBAL NAVIGATE
// ============================================================

function navigateToPoint(lat, lng) {

    const url =
        `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;

    window.open(url, "_blank");

}


// ============================================================
// CLOSE DETAILS
// ============================================================

function closeDetails() {

    const pointInfo =
        document.getElementById("pointInfo");

    if (pointInfo) {

        pointInfo.style.display = "none";

    }

}


// ============================================================
// GOOGLE MAP
// ============================================================

async function initMap() {

    // ========================================================
    // FIRESTORE
    // ========================================================

    let db;

    try {

        const firebaseModule =
            await import("./firebase-config.js");

        db = firebaseModule.db;

    } catch (error) {

        console.error(
            "Firebase could not be loaded:",
            error
        );

        alert(
            "Unable to connect to Firebase."
        );

        return;

    }


    const firestoreModule =
        await import(
            "https://www.gstatic.com/firebasejs/12.18.0/firebase-firestore.js"
        );


    const {
        collection,
        getDocs
    } = firestoreModule;


    // ========================================================
    // POLITEKNIK MERLIMAU CENTRE
    // ========================================================

    const polytechnicMerlimau = {

        lat: 2.1688,

        lng: 102.4275

    };


    // ========================================================
    // CREATE MAP
    // ========================================================

    const map =
        new google.maps.Map(

            document.getElementById("map"),

            {

                center:
                    polytechnicMerlimau,

                zoom: 17,

                mapTypeControl: true,

                streetViewControl: false,

                fullscreenControl: true,

                zoomControl: true

            }

        );


    // ========================================================
    // LOAD CONTROL POINTS FROM FIRESTORE
    // ========================================================

    let controlPoints = [];


    try {

        const snapshot =
            await getDocs(
                collection(
                    db,
                    "control_points"
                )
            );


        controlPoints =
            snapshot.docs.map(
                function (document) {

                    const data =
                        document.data();


                    return {

                        id:
                            document.id,

                        name:
                            data.pointCode ||
                            document.id,

                        type:
                            data.pointType ||
                            "",

                        lat:
                            Number(
                                data.latitude
                            ),

                        lng:
                            Number(
                                data.longitude
                            ),

                        northing:
                            Number(
                                data.northing
                            ),

                        easting:
                            Number(
                                data.easting
                            ),

                        height:
                            Number(
                                data.elevation
                            ),

                        description:
                            data.description ||
                            "",

                        // Firebase photo

                        imageUrl:
                            data.imageUrl ||
                            "",

                        imageFileId:
                            data.imageFileId ||
                            "",

                        // Keep compatibility
                        // with old local photos

                        photo:
                            data.photo ||
                            ""

                    };

                }
            );


    } catch (error) {

        console.error(
            "Firestore loading error:",
            error
        );


        alert(
            "Unable to load control points from Firebase.\n\n" +
            error.message
        );

        return;

    }


    // ========================================================
    // CHECK DATA
    // ========================================================

    console.log(
        "Firestore control points loaded:",
        controlPoints
    );


    if (
        controlPoints.length === 0
    ) {

        console.warn(
            "No control points found in Firestore."
        );

    }


    // ========================================================
    // VARIABLES
    // ========================================================

    let selectedPoint = null;

    let traverseMode = false;

    let stationPoints = [];

    let traverseLines = [];

    let traverseLabels = [];

    const markers = [];

    const overlays = [];


    // ========================================================
    // CONTROL POINT DROPDOWN
    // ========================================================

    const controlPointSelect =
        document.getElementById(
            "controlPointSelect"
        );


    if (controlPointSelect) {

        // Remove old options
        // except first option

        controlPointSelect.innerHTML = `

            <option value="">
                -- Select a Control Point --
            </option>

        `;


        controlPoints.forEach(
            function (point, index) {

                const option =
                    document.createElement(
                        "option"
                    );


                option.value =
                    index;


                option.textContent =
                    point.name;


                controlPointSelect.appendChild(
                    option
                );

            }
        );

    }


    // ========================================================
    // TRAVERSE UI
    // ========================================================

    const traverseButton =
        document.getElementById(
            "traverseButton"
        );


    const traversePanel =
        document.getElementById(
            "traversePanel"
        );


    const traverseStatus =
        document.getElementById(
            "traverseStatus"
        );


    const traverseResults =
        document.getElementById(
            "traverseResults"
        );


    const clearTraverseButton =
        document.getElementById(
            "clearTraverseButton"
        );


    // ========================================================
    // ADD STATION BUTTON
    // ========================================================

    let addStationButton =
        document.getElementById(
            "addStationButton"
        );


    if (!addStationButton) {

        addStationButton =
            document.createElement(
                "button"
            );


        addStationButton.id =
            "addStationButton";


        addStationButton.className =
            "add-station-button";


        addStationButton.textContent =
            "+ ADD STATION";


        document.body.appendChild(
            addStationButton
        );

    }


    // ========================================================
    // STATION LIST
    // ========================================================

    let stationList =
        document.getElementById(
            "stationList"
        );


    if (!stationList) {

        stationList =
            document.createElement(
                "div"
            );


        stationList.id =
            "stationList";


        stationList.className =
            "station-list";


        stationList.innerHTML = `

            <h3>
                Traverse Stations
            </h3>

            <ol id="stations"></ol>

        `;


        document.body.appendChild(
            stationList
        );

    }


    const stationsListElement =
        document.getElementById(
            "stations"
        );


    // ========================================================
    // INITIAL UI STATE
    // ========================================================

    addStationButton.style.display =
        "none";


    stationList.style.display =
        "none";


    // ========================================================
    // GET PHOTO URL
    // ========================================================

    function getPhotoUrl(point) {

        // Firebase ImageKit URL
        if (
            point.imageUrl &&
            point.imageUrl.trim() !== ""
        ) {

            return point.imageUrl;

        }


        // Old local image system
        if (
            point.photo &&
            point.photo.trim() !== ""
        ) {

            return (
                "images/control_points/" +
                point.photo
            );

        }


        return "";

    }


    // ========================================================
    // TRAVERSE LABEL
    // ========================================================

    class TraverseLabel
        extends google.maps.OverlayView {

        constructor(
            from,
            to,
            bearingText,
            distanceText
        ) {

            super();

            this.from =
                from;

            this.to =
                to;

            this.bearingText =
                bearingText;

            this.distanceText =
                distanceText;

            this.div =
                null;

        }


        onAdd() {

            this.div =
                document.createElement(
                    "div"
                );


            this.div.className =
                "traverse-map-label";


            this.div.innerHTML = `

                <div class="traverse-bearing">
                    ${this.bearingText}
                </div>

                <div class="traverse-distance">
                    ${this.distanceText}
                </div>

            `;


            this.getPanes()
                .floatPane
                .appendChild(
                    this.div
                );

        }


        draw() {

            if (!this.div) {
                return;
            }


            const projection =
                this.getProjection();


            if (!projection) {
                return;
            }


            const fromLatLng =
                new google.maps.LatLng(
                    this.from.lat,
                    this.from.lng
                );


            const toLatLng =
                new google.maps.LatLng(
                    this.to.lat,
                    this.to.lng
                );


            const fromPixel =
                projection.fromLatLngToDivPixel(
                    fromLatLng
                );


            const toPixel =
                projection.fromLatLngToDivPixel(
                    toLatLng
                );


            if (
                !fromPixel ||
                !toPixel
            ) {

                return;

            }


            const middleX =
                (
                    fromPixel.x +
                    toPixel.x
                ) / 2;


            const middleY =
                (
                    fromPixel.y +
                    toPixel.y
                ) / 2;


            let angle =
                Math.atan2(

                    toPixel.y -
                    fromPixel.y,

                    toPixel.x -
                    fromPixel.x

                ) *
                180 /
                Math.PI;


            if (
                angle > 90 ||
                angle < -90
            ) {

                angle += 180;

            }


            this.div.style.left =
                middleX + "px";


            this.div.style.top =
                middleY + "px";


            this.div.style.transform =
                `translate(-50%, -50%) rotate(${angle}deg)`;

        }


        onRemove() {

            if (this.div) {

                this.div.remove();

                this.div =
                    null;

            }

        }

    }


    // ========================================================
    // CALCULATE BEARING
    // ========================================================

    function calculateBearing(
        from,
        to
    ) {

        const deltaE =
            to.easting -
            from.easting;


        const deltaN =
            to.northing -
            from.northing;


        let bearing =
            Math.atan2(
                deltaE,
                deltaN
            ) *
            180 /
            Math.PI;


        if (
            bearing < 0
        ) {

            bearing += 360;

        }


        return bearing;

    }


    // ========================================================
    // FORMAT BEARING
    // ========================================================

    function formatBearing(
        decimalDegrees
    ) {

        const degrees =
            Math.floor(
                decimalDegrees
            );


        const minutesDecimal =
            (
                decimalDegrees -
                degrees
            ) * 60;


        const minutes =
            Math.floor(
                minutesDecimal
            );


        const seconds =
            (
                minutesDecimal -
                minutes
            ) * 60;


        return (

            degrees +
            "° " +
            minutes +
            "' " +
            seconds.toFixed(2) +
            '"'

        );

    }


    // ========================================================
    // CALCULATE DISTANCE
    // ========================================================

    function calculateDistance(
        from,
        to
    ) {

        const deltaE =
            to.easting -
            from.easting;


        const deltaN =
            to.northing -
            from.northing;


        return Math.sqrt(

            Math.pow(
                deltaE,
                2
            ) +

            Math.pow(
                deltaN,
                2
            )

        );

    }


    // ========================================================
    // CLEAR LABELS
    // ========================================================

    function clearTraverseLabels() {

        traverseLabels.forEach(
            function (label) {

                label.setMap(
                    null
                );

            }
        );


        traverseLabels = [];

    }


    // ========================================================
    // UPDATE STATION LIST
    // ========================================================

    function updateStationList() {

        if (
            !stationsListElement
        ) {

            return;

        }


        stationsListElement.innerHTML =
            "";


        stationPoints.forEach(
            function (
                point,
                index
            ) {

                const li =
                    document.createElement(
                        "li"
                    );


                const stationName =
                    document.createElement(
                        "span"
                    );


                stationName.textContent =
                    point.name;


                const removeButton =
                    document.createElement(
                        "button"
                    );


                removeButton.className =
                    "remove-station-button";


                removeButton.textContent =
                    "✕";


                removeButton.title =
                    "Remove " +
                    point.name;


                removeButton.addEventListener(
                    "click",
                    function () {

                        removeStation(
                            index
                        );

                    }
                );


                li.appendChild(
                    stationName
                );


                li.appendChild(
                    removeButton
                );


                stationsListElement.appendChild(
                    li
                );

            }
        );

    }


    // ========================================================
    // REMOVE STATION
    // ========================================================

    function removeStation(
        index
    ) {

        if (
            index < 0 ||
            index >=
            stationPoints.length
        ) {

            return;

        }


        stationPoints.splice(
            index,
            1
        );


        updateStationList();

        updateTraverse();

    }


    // ========================================================
    // CLEAR LINES
    // ========================================================

    function clearTraverseLines() {

        traverseLines.forEach(
            function (line) {

                line.setMap(
                    null
                );

            }
        );


        traverseLines = [];

    }


    // ========================================================
    // UPDATE TRAVERSE
    // ========================================================

    function updateTraverse() {

        clearTraverseLines();

        clearTraverseLabels();


        if (
            traverseResults
        ) {

            traverseResults.innerHTML =
                "";

        }


        if (
            stationPoints.length === 0
        ) {

            if (
                traverseStatus
            ) {

                traverseStatus.textContent =
                    "No stations added.";

            }


            return;

        }


        if (
            stationPoints.length === 1
        ) {

            if (
                traverseStatus
            ) {

                traverseStatus.textContent =
                    "1 station selected. Add another station.";

            }


            return;

        }


        if (
            traverseStatus
        ) {

            traverseStatus.textContent =
                stationPoints.length +
                " stations selected.";

        }


        for (
            let i = 0;

            i <
            stationPoints.length - 1;

            i++
        ) {

            const from =
                stationPoints[i];


            const to =
                stationPoints[i + 1];


            const distance =
                calculateDistance(
                    from,
                    to
                );


            const bearing =
                calculateBearing(
                    from,
                    to
                );


            const distanceText =
                distance.toFixed(3) +
                " m";


            const bearingText =
                formatBearing(
                    bearing
                );


            const line =
                new google.maps.Polyline({

                    path: [

                        {
                            lat:
                                from.lat,

                            lng:
                                from.lng
                        },

                        {
                            lat:
                                to.lat,

                            lng:
                                to.lng
                        }

                    ],

                    geodesic:
                        false,

                    strokeColor:
                        "#111111",

                    strokeWeight:
                        4,

                    strokeOpacity:
                        0.9,

                    map:
                        map

                });


            traverseLines.push(
                line
            );


            const label =
                new TraverseLabel(

                    from,

                    to,

                    bearingText,

                    distanceText

                );


            label.setMap(
                map
            );


            traverseLabels.push(
                label
            );


            if (
                traverseResults
            ) {

                const result =
                    document.createElement(
                        "div"
                    );


                result.className =
                    "traverse-result";


                result.innerHTML = `

                    <div class="traverse-result-header">

                        <strong>
                            ${from.name}
                            →
                            ${to.name}
                        </strong>

                    </div>

                    <br>

                    <strong>
                        Distance:
                    </strong>

                    ${distanceText}

                    <br>

                    <strong>
                        Bearing:
                    </strong>

                    ${bearingText}

                `;


                traverseResults.appendChild(
                    result
                );

            }

        }

    }


    // ========================================================
    // ADD STATION
    // ========================================================

    addStationButton.addEventListener(
        "click",
        function () {

            if (
                !traverseMode
            ) {

                alert(
                    "Please turn TRAVERSE ON first."
                );

                return;

            }


            if (
                !controlPointSelect
            ) {

                alert(
                    "Control point selector not found."
                );

                return;

            }


            const index =
                controlPointSelect.value;


            if (
                index === ""
            ) {

                alert(
                    "Please select a control point first."
                );

                return;

            }


            const point =
                controlPoints[
                    Number(index)
                ];


            if (!point) {
                return;
            }


            selectedPoint =
                point;


            if (
                stationPoints.includes(
                    point
                )
            ) {

                alert(
                    point.name +
                    " is already in the traverse."
                );

                return;

            }


            stationPoints.push(
                point
            );


            updateStationList();

            updateTraverse();


            controlPointSelect.value =
                "";


            map.panTo({

                lat:
                    point.lat,

                lng:
                    point.lng

            });


            map.setZoom(
                19
            );

        }
    );


    // ========================================================
    // TRAVERSE ON / OFF
    // ========================================================

    if (
        traverseButton
    ) {

        traverseButton.addEventListener(
            "click",
            function () {

                traverseMode =
                    !traverseMode;


                if (
                    traverseMode
                ) {

                    traverseButton.textContent =
                        "TRAVERSE ON";


                    addStationButton.style.display =
                        "block";


                    stationList.style.display =
                        "block";


                    if (
                        traversePanel
                    ) {

                        traversePanel.style.display =
                            "block";

                    }


                    if (
                        traverseStatus
                    ) {

                        traverseStatus.textContent =
                            "Select a control point, then press ADD STATION.";

                    }

                } else {

                    traverseButton.textContent =
                        "TRAVERSE";


                    addStationButton.style.display =
                        "none";


                    stationList.style.display =
                        "none";


                    if (
                        traversePanel
                    ) {

                        traversePanel.style.display =
                            "none";

                    }

                }

            }
        );

    }


    // ========================================================
    // CLEAR TRAVERSE
    // ========================================================

    if (
        clearTraverseButton
    ) {

        clearTraverseButton.addEventListener(
            "click",
            function () {

                stationPoints = [];

                selectedPoint =
                    null;


                clearTraverseLines();

                clearTraverseLabels();

                updateStationList();


                if (
                    traverseResults
                ) {

                    traverseResults.innerHTML =
                        "";

                }


                if (
                    traverseStatus
                ) {

                    traverseStatus.textContent =
                        "Select a control point, then press ADD STATION.";

                }


                if (
                    controlPointSelect
                ) {

                    controlPointSelect.value =
                        "";

                }

            }
        );

    }





    // ========================================================
    // CREATE MARKERS
    // ========================================================

    controlPoints.forEach(
        function (
            point,
            index
        ) {

            const marker =
                new google.maps.Marker({

                    position: {

                        lat:
                            point.lat,

                        lng:
                            point.lng

                    },

                    map:
                        map,

                    title:
                        point.name

                });


            markers[index] =
                marker;



            // =================================================
            // MARKER CLICK
            // =================================================

            marker.addListener(
                "click",
                function () {

                    selectedPoint =
                        point;


                    const detailsButton =
                        document.getElementById(
                            "detailsButton"
                        );


                    if (
                        detailsButton
                    ) {

                        detailsButton.style.display =
                            "block";

                    }


                    if (
                        traverseMode
                    ) {

                        map.panTo({

                            lat:
                                point.lat,

                            lng:
                                point.lng

                        });


                        map.setZoom(
                            19
                        );

                    }
                    if (!traverseMode) {

                        if (detailsButton) {

                            detailsButton.click();

                        }

                    }

                }
            );

        }
    );


    // ========================================================
    // DROPDOWN
    // ========================================================

    if (
        controlPointSelect
    ) {

        controlPointSelect.addEventListener(
            "change",
            function () {

                const index =
                    this.value;


                if (
                    index === ""
                ) {

                    return;

                }


                const point =
                    controlPoints[
                        Number(index)
                    ];


                const marker =
                    markers[
                        Number(index)
                    ];


                if (
                    !point ||
                    !marker
                ) {

                    return;

                }


                selectedPoint =
                    point;


                if (
                    traverseMode
                ) {

                    map.panTo({

                        lat:
                            point.lat,

                        lng:
                            point.lng

                    });


                    map.setZoom(
                        19
                    );


                    return;

                }


                map.panTo({

                    lat:
                        point.lat,

                    lng:
                        point.lng

                });


                map.setZoom(
                    19
                );


                google.maps.event.trigger(
                    marker,
                    "click"
                );

            }
        );

    }


    // ========================================================
    // DETAILS BUTTON
    // ========================================================

    const detailsButton =
        document.getElementById(
            "detailsButton"
        );


    if (
        detailsButton
    ) {

        detailsButton.addEventListener(
            "click",
            function () {

                if (
                    !selectedPoint
                ) {

                    alert(
                        "Please select a control point first."
                    );

                    return;

                }


                const pointInfo =
                    document.getElementById(
                        "pointInfo"
                    );


                if (
                    !pointInfo
                ) {

                    return;

                }


                const photoUrl =
                    getPhotoUrl(
                        selectedPoint
                    );


                let photoHTML =
                    "";


                if (
                    photoUrl
                ) {

                    photoHTML = `

                        <img
                            src="${photoUrl}"
                            alt="${selectedPoint.name}"
                            class="control-point-photo"
                            onerror="this.style.display='none';"
                        >

                    `;

                } else {

                    photoHTML = `

                        <div class="no-photo">
                            Photo not available yet
                        </div>

                    `;

                }


                pointInfo.innerHTML = `

                    <button
                        class="close-details"
                        onclick="closeDetails()">

                        ✕

                    </button>


                    <h2>
                        ${selectedPoint.name}
                    </h2>


                    ${photoHTML}


                    <p>

                        <strong>
                            Northing:
                        </strong>

                        <br>

                        ${selectedPoint.northing}

                    </p>


                    <p>

                        <strong>
                            Easting:
                        </strong>

                        <br>

                        ${selectedPoint.easting}

                    </p>


                    <p>

                        <strong>
                            Orthometric Height:
                        </strong>

                        <br>

                        ${selectedPoint.height}
                        m

                    </p>


                    ${
                        selectedPoint.description
                            ?
                            `
                            <p>

                                <strong>
                                    Description:
                                </strong>

                                <br>

                                ${selectedPoint.description}

                            </p>
                            `
                            :
                            ""
                    }


                    <button
                        class="navigate-button"
                        onclick="
                            navigateToPoint(
                                ${selectedPoint.lat},
                                ${selectedPoint.lng}
                            )
                        ">

                        NAVIGATE

                    </button>

                `;


                pointInfo.style.display =
                    "block";

            }
        );

    }


    // ========================================================
    // MY LOCATION
    // ========================================================

    const locationButton =
        document.getElementById(
            "locationButton"
        );


    if (
        locationButton
    ) {

        locationButton.addEventListener(
            "click",
            function () {

                if (
                    !navigator.geolocation
                ) {

                    alert(
                        "Location is not supported by this browser."
                    );

                    return;

                }


                navigator.geolocation.getCurrentPosition(

                    function (
                        position
                    ) {

                        const userLocation = {

                            lat:
                                position.coords.latitude,

                            lng:
                                position.coords.longitude

                        };


                        map.panTo(
                            userLocation
                        );


                        map.setZoom(
                            19
                        );


                        new google.maps.Marker({

                            position:
                                userLocation,

                            map:
                                map,

                            title:
                                "My Location"

                        });

                    },


                    function () {

                        alert(
                            "Unable to get your location. Please allow location permission."
                        );

                    }

                );

            }
        );

    }


    // ========================================================
    // FINISHED
    // ========================================================

    console.log(
        "InterSurv map connected to Firestore."
    );

}