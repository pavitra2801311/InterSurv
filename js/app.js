// ============================================================
// INTERSURV WEBSITE
// FIRESTORE + GOOGLE MAP + TRAVERSE + MONUMENT PHOTO GALLERY
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

                        monumentStatus:
                            data.monumentStatus ||
                            "Good",

                        description:
                            data.description ||
                            "",


                        // =================================================
                        // NEW MONUMENT PHOTO GALLERY
                        // =================================================

                        imageUrls:
                            Array.isArray(
                                data.imageUrls
                            )
                                ? data.imageUrls
                                    .filter(
                                        function (photo) {

                                            return (
                                                photo &&
                                                photo.url
                                            );

                                        }
                                    )
                                    .map(
                                        function (photo) {

                                            return {

                                                url:
                                                    photo.url ||
                                                    "",

                                                fileId:
                                                    photo.fileId ||
                                                    ""

                                            };

                                        }
                                    )
                                : [],


                        // =================================================
                        // OLD SINGLE PHOTO
                        // KEEP FOR COMPATIBILITY
                        // =================================================

                        imageUrl:
                            data.imageUrl ||
                            "",

                        imageFileId:
                            data.imageFileId ||
                            "",


                        // =================================================
                        // OLD LOCAL PHOTO
                        // =================================================

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
    // GET ALL PHOTO URLS
    // ========================================================

    function getPhotoUrls(point) {

        const gallery =
            Array.isArray(
                point.imageUrls
            )
                ? point.imageUrls
                    .filter(
                        function (photo) {

                            return (
                                photo &&
                                photo.url
                            );

                        }
                    )
                    .map(
                        function (photo) {

                            return photo.url;

                        }
                    )
                : [];


        // ====================================================
        // FALLBACK TO OLD SINGLE IMAGE
        // ====================================================

        if (
            gallery.length === 0 &&
            point.imageUrl &&
            point.imageUrl.trim() !== ""
        ) {

            gallery.push(
                point.imageUrl
            );

        }


        // ====================================================
        // FALLBACK TO OLD LOCAL PHOTO
        // ====================================================

        if (
            gallery.length === 0 &&
            point.photo &&
            point.photo.trim() !== ""
        ) {

            gallery.push(
                "images/control_points/" +
                point.photo
            );

        }


        return gallery;

    }


    // ========================================================
    // ESCAPE HTML
    // ========================================================

    function escapeHTML(value) {

        return String(
            value ?? ""
        )
            .replace(
                /&/g,
                "&amp;"
            )
            .replace(
                /</g,
                "&lt;"
            )
            .replace(
                />/g,
                "&gt;"
            )
            .replace(
                /"/g,
                "&quot;"
            )
            .replace(
                /'/g,
                "&#039;"
            );

    }


    // ========================================================
    // CREATE MONUMENT PHOTO GALLERY
    // ========================================================

    function createPhotoGallery(point) {

        const photoUrls =
            getPhotoUrls(point);


        // ====================================================
        // NO PHOTO
        // ====================================================

        if (
            photoUrls.length === 0
        ) {

            return `

                <div class="no-photo">
                    Photo not available yet
                </div>

            `;

        }


        const galleryId =
            "monumentGallery-" +
            String(point.id)
                .replace(
                    /[^a-zA-Z0-9_-]/g,
                    ""
                );


        // ====================================================
        // CREATE SLIDES
        // ====================================================

        const slidesHTML =
            photoUrls.map(
                function (
                    url,
                    index
                ) {

                    return `

                        <div
                            class="monument-gallery-slide"
                            data-gallery-index="${index}"
                            style="
                                display:
                                    ${
                                        index === 0
                                            ? "flex"
                                            : "none"
                                    };
                            "
                        >

                            <img
                                src="${escapeHTML(url)}"
                                alt="${escapeHTML(
                                    point.name
                                )} Photo ${index + 1}"
                                class="control-point-photo"
                                onerror="
                                    this.style.display='none';
                                    this.parentElement.classList.add('photo-error');
                                "
                            >

                        </div>

                    `;

                }
            ).join("");


        // ====================================================
        // CREATE DOTS
        // ====================================================

        const dotsHTML =
            photoUrls.map(
                function (
                    _,
                    index
                ) {

                    return `

                        <button
                            type="button"
                            class="
                                monument-gallery-dot
                                ${
                                    index === 0
                                        ? "active"
                                        : ""
                                }
                            "
                            data-gallery-dot="${index}"
                            aria-label="
                                View photo ${index + 1}
                            "
                        ></button>

                    `;

                }
            ).join("");


        // ====================================================
        // GALLERY HTML
        // ====================================================

        return `

            <div
                class="monument-gallery"
                id="${galleryId}"
                data-current-index="0"
                data-photo-count="${photoUrls.length}"
            >

                <div
                    class="monument-gallery-viewport"
                >

                    ${slidesHTML}


                    ${
                        photoUrls.length > 1
                            ?

                            `

                            <button
                                type="button"
                                class="
                                    monument-gallery-arrow
                                    monument-gallery-prev
                                "
                                onclick="
                                    window.changeMonumentPhoto(
                                        '${galleryId}',
                                        -1
                                    )
                                "
                                aria-label="Previous photo"
                            >
                                ‹
                            </button>


                            <button
                                type="button"
                                class="
                                    monument-gallery-arrow
                                    monument-gallery-next
                                "
                                onclick="
                                    window.changeMonumentPhoto(
                                        '${galleryId}',
                                        1
                                    )
                                "
                                aria-label="Next photo"
                            >
                                ›
                            </button>

                            `

                            :

                            ""

                    }

                </div>


                ${
                    photoUrls.length > 1
                        ?

                        `

                        <div
                            class="monument-gallery-controls"
                        >

                            <div
                                class="monument-gallery-dots"
                            >

                                ${dotsHTML}

                            </div>


                            <div
                                class="monument-gallery-counter"
                            >

                                <span
                                    class="monument-gallery-current"
                                >
                                    1
                                </span>

                                /

                                ${photoUrls.length}

                            </div>

                        </div>

                        `

                        :

                        ""

                }

            </div>

        `;

    }


    // ========================================================
    // CHANGE MONUMENT PHOTO
    // ========================================================

    window.changeMonumentPhoto =
        function (
            galleryId,
            direction
        ) {

            const gallery =
                document.getElementById(
                    galleryId
                );


            if (!gallery) {
                return;
            }


            const slides =
                gallery.querySelectorAll(
                    ".monument-gallery-slide"
                );


            const dots =
                gallery.querySelectorAll(
                    ".monument-gallery-dot"
                );


            const counter =
                gallery.querySelector(
                    ".monument-gallery-current"
                );


            if (
                slides.length <= 1
            ) {

                return;

            }


            let currentIndex =
                Number(
                    gallery.dataset.currentIndex ||
                    0
                );


            currentIndex +=
                Number(direction);


            // =================================================
            // LOOP TO LAST PHOTO
            // =================================================

            if (
                currentIndex < 0
            ) {

                currentIndex =
                    slides.length - 1;

            }


            // =================================================
            // LOOP TO FIRST PHOTO
            // =================================================

            if (
                currentIndex >=
                slides.length
            ) {

                currentIndex =
                    0;

            }


            // =================================================
            // SHOW SELECTED SLIDE
            // =================================================

            slides.forEach(
                function (
                    slide,
                    index
                ) {

                    slide.style.display =
                        index === currentIndex
                            ? "flex"
                            : "none";

                }
            );


            // =================================================
            // UPDATE DOTS
            // =================================================

            dots.forEach(
                function (
                    dot,
                    index
                ) {

                    dot.classList.toggle(
                        "active",
                        index === currentIndex
                    );

                }
            );


            // =================================================
            // UPDATE COUNTER
            // =================================================

            if (counter) {

                counter.textContent =
                    currentIndex + 1;

            }


            gallery.dataset.currentIndex =
                currentIndex;

        };


    // ========================================================
    // SWIPE SUPPORT
    // ========================================================

    function setupGallerySwipe(pointInfo) {

        const gallery =
            pointInfo.querySelector(
                ".monument-gallery"
            );


        if (!gallery) {
            return;
        }


        const viewport =
            gallery.querySelector(
                ".monument-gallery-viewport"
            );


        if (!viewport) {
            return;
        }


        let touchStartX = 0;

        let touchStartY = 0;


        viewport.addEventListener(
            "touchstart",
            function (event) {

                if (
                    !event.changedTouches ||
                    !event.changedTouches.length
                ) {

                    return;

                }


                touchStartX =
                    event.changedTouches[0]
                        .screenX;


                touchStartY =
                    event.changedTouches[0]
                        .screenY;

            },
            {
                passive: true
            }
        );


        viewport.addEventListener(
            "touchend",
            function (event) {

                if (
                    !event.changedTouches ||
                    !event.changedTouches.length
                ) {

                    return;

                }


                const touchEndX =
                    event.changedTouches[0]
                        .screenX;


                const touchEndY =
                    event.changedTouches[0]
                        .screenY;


                const differenceX =
                    touchStartX -
                    touchEndX;


                const differenceY =
                    touchStartY -
                    touchEndY;


                // Only treat it as a swipe
                // when horizontal movement
                // is greater than vertical movement.

                if (
                    Math.abs(differenceX) >
                    40 &&
                    Math.abs(differenceX) >
                    Math.abs(differenceY)
                ) {

                    window.changeMonumentPhoto(

                        gallery.id,

                        differenceX > 0
                            ? 1
                            : -1

                    );

                }

            },
            {
                passive: true
            }
        );

    }


    // ========================================================
    // GALLERY DOT BUTTONS
    // ========================================================

    function setupGalleryDots(pointInfo) {

        pointInfo
            .querySelectorAll(
                ".monument-gallery-dot"
            )
            .forEach(
                function (dot) {

                    dot.addEventListener(
                        "click",
                        function () {

                            const gallery =
                                dot.closest(
                                    ".monument-gallery"
                                );


                            if (!gallery) {
                                return;
                            }


                            const targetIndex =
                                Number(
                                    dot.dataset.galleryDot
                                );


                            const currentIndex =
                                Number(
                                    gallery.dataset.currentIndex ||
                                    0
                                );


                            window.changeMonumentPhoto(

                                gallery.id,

                                targetIndex -
                                currentIndex

                            );

                        }
                    );

                }
            );

    }
// ========================================================
// FULL SCREEN MONUMENT PHOTO VIEWER
// ========================================================

function setupGalleryLightbox(pointInfo) {

    const gallery =
        pointInfo.querySelector(
            ".monument-gallery"
        );

    if (!gallery) {
        return;
    }


    const slides =
        gallery.querySelectorAll(
            ".monument-gallery-slide"
        );

    if (slides.length === 0) {
        return;
    }


    // ====================================================
    // CREATE FULL SCREEN VIEWER
    // ====================================================

    let lightbox =
        document.getElementById(
            "monumentPhotoLightbox"
        );


    if (!lightbox) {

        lightbox =
            document.createElement(
                "div"
            );


        lightbox.id =
            "monumentPhotoLightbox";


        lightbox.innerHTML = `

            <button
                type="button"
                class="lightbox-close"
                aria-label="Close photo"
            >
                ×
            </button>


            <button
                type="button"
                class="lightbox-arrow lightbox-prev"
                aria-label="Previous photo"
            >
                ‹
            </button>


            <div
                class="lightbox-image-container"
            >

                <img
                    class="lightbox-image"
                    src=""
                    alt="Monument Photo"
                >

            </div>


            <button
                type="button"
                class="lightbox-arrow lightbox-next"
                aria-label="Next photo"
            >
                ›
            </button>


            <div
                class="lightbox-counter"
            >
                1 / 1
            </div>

        `;


        document.body.appendChild(
            lightbox
        );


        // =================================================
        // LIGHTBOX CSS
        // =================================================

        if (
            !document.getElementById(
                "intersurv-lightbox-styles"
            )
        ) {

            const style =
                document.createElement(
                    "style"
                );


            style.id =
                "intersurv-lightbox-styles";


            style.textContent = `

                #monumentPhotoLightbox {

                    position: fixed;

                    inset: 0;

                    width: 100%;

                    height: 100%;

                    background:
                        rgba(
                            0,
                            0,
                            0,
                            0.94
                        );

                    display: none;

                    align-items: center;

                    justify-content: center;

                    z-index: 999999;

                }


                #monumentPhotoLightbox.active {

                    display: flex;

                }


                .lightbox-image-container {

                    width: 100%;

                    height: 100%;

                    display: flex;

                    align-items: center;

                    justify-content: center;

                    padding: 55px 65px 70px;

                }


                .lightbox-image {

                    max-width: 100%;

                    max-height: 100%;

                    width: auto;

                    height: auto;

                    object-fit: contain;

                    border-radius: 5px;

                    user-select: none;

                    -webkit-user-drag: none;

                }


                .lightbox-close {

                    position: absolute;

                    top: 18px;

                    right: 20px;

                    width: 45px;

                    height: 45px;

                    border: none;

                    border-radius: 50%;

                    background:
                        rgba(
                            255,
                            255,
                            255,
                            0.15
                        );

                    color: white;

                    font-size: 32px;

                    line-height: 40px;

                    cursor: pointer;

                    z-index: 5;

                }


                .lightbox-close:hover {

                    background:
                        rgba(
                            255,
                            255,
                            255,
                            0.3
                        );

                }


                .lightbox-arrow {

                    position: absolute;

                    top: 50%;

                    transform:
                        translateY(-50%);

                    width: 48px;

                    height: 48px;

                    border: none;

                    border-radius: 50%;

                    background:
                        rgba(
                            255,
                            255,
                            255,
                            0.15
                        );

                    color: white;

                    font-size: 38px;

                    line-height: 40px;

                    cursor: pointer;

                    z-index: 5;

                }


                .lightbox-arrow:hover {

                    background:
                        rgba(
                            255,
                            255,
                            255,
                            0.3
                        );

                }


                .lightbox-prev {

                    left: 18px;

                }


                .lightbox-next {

                    right: 18px;

                }


                .lightbox-counter {

                    position: absolute;

                    bottom: 20px;

                    left: 50%;

                    transform:
                        translateX(-50%);

                    color: white;

                    font-size: 14px;

                    background:
                        rgba(
                            0,
                            0,
                            0,
                            0.5
                        );

                    padding:
                        6px 12px;

                    border-radius: 20px;

                }


                @media (max-width: 600px) {

                    .lightbox-image-container {

                        padding:
                            55px 15px 65px;

                    }


                    .lightbox-arrow {

                        width: 40px;

                        height: 40px;

                        font-size: 30px;

                    }


                    .lightbox-prev {

                        left: 8px;

                    }


                    .lightbox-next {

                        right: 8px;

                    }


                    .lightbox-close {

                        top: 12px;

                        right: 12px;

                    }

                }

            `;


            document.head.appendChild(
                style
            );

        }

    }


    const image =
        lightbox.querySelector(
            ".lightbox-image"
        );


    const counter =
        lightbox.querySelector(
            ".lightbox-counter"
        );


    const closeButton =
        lightbox.querySelector(
            ".lightbox-close"
        );


    const previousButton =
        lightbox.querySelector(
            ".lightbox-prev"
        );


    const nextButton =
        lightbox.querySelector(
            ".lightbox-next"
        );


    let currentIndex = 0;


    // ====================================================
    // GET IMAGE URL FROM SLIDE
    // ====================================================

    function getSlideImageUrl(index) {

        const slide =
            slides[index];

        if (!slide) {
            return "";
        }


        const slideImage =
            slide.querySelector(
                "img"
            );


        return slideImage
            ? slideImage.src
            : "";

    }


    // ====================================================
    // SHOW PHOTO
    // ====================================================

    function showLightboxPhoto(index) {

        if (
            index < 0
        ) {

            index =
                slides.length - 1;

        }


        if (
            index >= slides.length
        ) {

            index = 0;

        }


        currentIndex =
            index;


        const imageUrl =
            getSlideImageUrl(
                currentIndex
            );


        if (!imageUrl) {
            return;
        }


        image.src =
            imageUrl;


        image.alt =
            `${selectedPoint?.name || "Monument"} Photo ${currentIndex + 1}`;


        counter.textContent =
            `${currentIndex + 1} / ${slides.length}`;

    }


    // ====================================================
    // OPEN PHOTO
    // ====================================================

    slides.forEach(
        function (slide, index) {

            const slideImage =
                slide.querySelector(
                    "img"
                );


            if (!slideImage) {
                return;
            }


            slideImage.style.cursor =
                "zoom-in";


            slideImage.addEventListener(
                "click",
                function () {

                    showLightboxPhoto(
                        index
                    );


                    lightbox.classList.add(
                        "active"
                    );


                    document.body.style.overflow =
                        "hidden";

                }
            );

        }
    );


    // ====================================================
    // CLOSE
    // ====================================================

    function closeLightbox() {

        lightbox.classList.remove(
            "active"
        );


        image.src =
            "";


        document.body.style.overflow =
            "";

    }


    closeButton.onclick =
        closeLightbox;


    // ====================================================
    // PREVIOUS
    // ====================================================

    previousButton.onclick =
        function () {

            showLightboxPhoto(
                currentIndex - 1
            );

        };


    // ====================================================
    // NEXT
    // ====================================================

    nextButton.onclick =
        function () {

            showLightboxPhoto(
                currentIndex + 1
            );

        };


    // ====================================================
    // CLICK OUTSIDE IMAGE
    // ====================================================

    lightbox.addEventListener(
        "click",
        function (event) {

            if (
                event.target ===
                lightbox
            ) {

                closeLightbox();

            }

        }
    );


    // ====================================================
    // KEYBOARD
    // ====================================================

    document.addEventListener(
        "keydown",
        function (event) {

            if (
                !lightbox.classList.contains(
                    "active"
                )
            ) {

                return;

            }


            if (
                event.key === "Escape"
            ) {

                closeLightbox();

            }


            if (
                event.key === "ArrowLeft"
            ) {

                showLightboxPhoto(
                    currentIndex - 1
                );

            }


            if (
                event.key === "ArrowRight"
            ) {

                showLightboxPhoto(
                    currentIndex + 1
                );

            }

        }
    );


    // ====================================================
    // MOBILE SWIPE IN FULL SCREEN
    // ====================================================

    let touchStartX = 0;


    lightbox.addEventListener(
        "touchstart",
        function (event) {

            if (
                event.changedTouches &&
                event.changedTouches.length
            ) {

                touchStartX =
                    event.changedTouches[0]
                        .screenX;

            }

        },
        {
            passive: true
        }
    );


    lightbox.addEventListener(
        "touchend",
        function (event) {

            if (
                !event.changedTouches ||
                !event.changedTouches.length
            ) {

                return;

            }


            const touchEndX =
                event.changedTouches[0]
                    .screenX;


            const difference =
                touchStartX -
                touchEndX;


            if (
                Math.abs(difference) > 50
            ) {

                if (
                    difference > 0
                ) {

                    showLightboxPhoto(
                        currentIndex + 1
                    );

                } else {

                    showLightboxPhoto(
                        currentIndex - 1
                    );

                }

            }

        },
        {
            passive: true
        }
    );

}

    // ========================================================
    // MONUMENT GALLERY STYLES
    // ========================================================

    if (
        !document.getElementById(
            "intersurv-monument-gallery-styles"
        )
    ) {

        const galleryStyle =
            document.createElement(
                "style"
            );


        galleryStyle.id =
            "intersurv-monument-gallery-styles";


        galleryStyle.textContent = `

            .monument-gallery {
                width: 100%;
                margin: 0 auto 18px;
                border-radius: 14px;
                overflow: hidden;
            }


            .monument-gallery-viewport {
                position: relative;
                width: 100%;
                min-height: 210px;
                background: #f1f4f8;
                border-radius: 14px;
                overflow: hidden;
                touch-action: pan-y;
            }


            .monument-gallery-slide {
                width: 100%;
                min-height: 210px;
                align-items: center;
                justify-content: center;
            }


            .monument-gallery-slide
            .control-point-photo {

                display: block;

                width: 100%;

                height: 250px;

                object-fit: cover;

                border-radius: 14px;

            }


            .monument-gallery-slide.photo-error::after {

                content:
                    "Photo unavailable";

                display: flex;

                min-height: 210px;

                align-items: center;

                justify-content: center;

                color: #777;

                font-size: 14px;

            }


            .monument-gallery-arrow {

                position: absolute;

                top: 50%;

                transform:
                    translateY(-50%);

                width: 38px;

                height: 38px;

                border: none;

                border-radius: 50%;

                background:
                    rgba(
                        255,
                        255,
                        255,
                        0.92
                    );

                color: #123b68;

                font-size: 30px;

                line-height: 34px;

                cursor: pointer;

                box-shadow:
                    0 2px 8px
                    rgba(
                        0,
                        0,
                        0,
                        0.18
                    );

                z-index: 2;

            }


            .monument-gallery-arrow:hover {

                background: white;

            }


            .monument-gallery-prev {

                left: 10px;

            }


            .monument-gallery-next {

                right: 10px;

            }


            .monument-gallery-controls {

                display: flex;

                align-items: center;

                justify-content: center;

                gap: 10px;

                margin-top: 8px;

            }


            .monument-gallery-dots {

                display: flex;

                align-items: center;

                justify-content: center;

                gap: 6px;

            }


            .monument-gallery-dot {

                width: 8px;

                height: 8px;

                padding: 0;

                border: none;

                border-radius: 50%;

                background: #b9c2cc;

                cursor: pointer;

            }


            .monument-gallery-dot.active {

                background: #1769d1;

                transform:
                    scale(1.25);

            }


            .monument-gallery-counter {

                font-size: 12px;

                color: #666;

                white-space: nowrap;

            }


            @media (max-width: 600px) {

                .monument-gallery-slide
                .control-point-photo {

                    height: 220px;

                }


                .monument-gallery-viewport {

                    min-height: 220px;

                }


                .monument-gallery-arrow {

                    width: 34px;

                    height: 34px;

                    font-size: 26px;

                }

            }

        `;


        document.head.appendChild(
            galleryStyle
        );

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

            const labelWidth =
                Math.max(
                    70,
                    point.name.length * 8 + 20
                );


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
                        point.name,

                    icon: {

                        url:
                            "data:image/svg+xml;charset=UTF-8," +
                            encodeURIComponent(`

                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    width="${labelWidth}"
                                    height="70"
                                    viewBox="0 0 ${labelWidth} 70"
                                >

                                    <rect
                                        x="2"
                                        y="2"
                                        width="${labelWidth - 4}"
                                        height="30"
                                        rx="8"
                                        fill="white"
                                        stroke="#1769d1"
                                        stroke-width="2"
                                    />

                                    <text
                                        x="${labelWidth / 2}"
                                        y="22"
                                        text-anchor="middle"
                                        font-family="Arial, sans-serif"
                                        font-size="12"
                                        font-weight="bold"
                                        fill="#123b68"
                                    >
                                        ${point.name}
                                    </text>

                                    <path
                                        d="
                                            M ${labelWidth / 2} 67
                                            C ${labelWidth / 2 - 10} 52,
                                              ${labelWidth / 2 - 10} 42,
                                              ${labelWidth / 2} 38
                                            C ${labelWidth / 2 + 10} 42,
                                              ${labelWidth / 2 + 10} 52,
                                              ${labelWidth / 2} 67
                                            Z
                                        "
                                        fill="#ea4335"
                                    />

                                    <circle
                                        cx="${labelWidth / 2}"
                                        cy="48"
                                        r="4"
                                        fill="white"
                                    />

                                </svg>

                            `),

                        scaledSize:
                            new google.maps.Size(
                                labelWidth,
                                70
                            ),

                        anchor:
                            new google.maps.Point(
                                labelWidth / 2,
                                70
                            )

                    }

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


                    if (
                        !traverseMode
                    ) {

                        if (
                            detailsButton
                        ) {

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


                // =================================================
                // CREATE NEW PHOTO GALLERY
                // =================================================

                const photoHTML =
                    createPhotoGallery(
                        selectedPoint
                    );


                // =================================================
                // DETAILS CONTENT
                // =================================================

                pointInfo.innerHTML = `

                    <button
                        class="close-details"
                        onclick="closeDetails()"
                    >

                        ✕

                    </button>


                    <h2>
                        ${escapeHTML(
                            selectedPoint.name
                        )}
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


                    <p>

                        <strong>
                            Monument Status:
                        </strong>

                        <br>

                        ${escapeHTML(
                            selectedPoint.monumentStatus
                        )}

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

                                ${escapeHTML(
                                    selectedPoint.description
                                )}

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
                        "
                    >

                        NAVIGATE

                    </button>

                `;


                pointInfo.style.display =
                    "block";


                // =================================================
                // ACTIVATE GALLERY
                // =================================================

                setupGalleryDots(
                    pointInfo
                );


                setupGallerySwipe(
                    pointInfo
                );

          setupGalleryLightbox(
              pointInfo
          );


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


  let userLocationMarker = null;

  let userLocationAccuracyCircle = null;


  if (locationButton) {

      locationButton.addEventListener(
          "click",
          function () {

              // =================================================
              // CHECK GEOLOCATION SUPPORT
              // =================================================

              if (!navigator.geolocation) {

                  alert(
                      "Your browser does not support location services."
                  );

                  return;

              }


              // =================================================
              // BUTTON STATE
              // =================================================

              locationButton.disabled =
                  true;

              locationButton.textContent =
                  "📍 Locating...";


              // =================================================
              // GET CURRENT LOCATION
              // =================================================

              navigator.geolocation.getCurrentPosition(

                  function (position) {

                      const latitude =
                          position.coords.latitude;

                      const longitude =
                          position.coords.longitude;

                      const accuracy =
                          position.coords.accuracy;


                      const userLocation = {

                          lat:
                              latitude,

                          lng:
                              longitude

                      };


                      console.log(
                          "My Location:",
                          userLocation
                      );


                      console.log(
                          "GPS Accuracy:",
                          accuracy + " metres"
                      );


                      // =============================================
                      // REMOVE OLD LOCATION MARKER
                      // =============================================

                      if (
                          userLocationMarker
                      ) {

                          userLocationMarker.setMap(
                              null
                          );

                      }


                      // =============================================
                      // REMOVE OLD ACCURACY CIRCLE
                      // =============================================

                      if (
                          userLocationAccuracyCircle
                      ) {

                          userLocationAccuracyCircle.setMap(
                              null
                          );

                      }


                      // =============================================
                      // CREATE BLUE LOCATION MARKER
                      // =============================================

                      userLocationMarker =
                          new google.maps.Marker({

                              position:
                                  userLocation,

                              map:
                                  map,

                              title:
                                  "My Location",

                              icon: {

                                  path:
                                      google.maps.SymbolPath.CIRCLE,

                                  scale:
                                      9,

                                  fillColor:
                                      "#1769d1",

                                  fillOpacity:
                                      1,

                                  strokeColor:
                                      "#ffffff",

                                  strokeWeight:
                                      3

                              },

                              zIndex:
                                  9999

                          });


                      // =============================================
                      // CREATE ACCURACY CIRCLE
                      // =============================================

                      userLocationAccuracyCircle =
                          new google.maps.Circle({

                              map:
                                  map,

                              center:
                                  userLocation,

                              radius:
                                  accuracy,

                              fillColor:
                                  "#1769d1",

                              fillOpacity:
                                  0.12,

                              strokeColor:
                                  "#1769d1",

                              strokeOpacity:
                                  0.45,

                              strokeWeight:
                                  1,

                              clickable:
                                  false,

                              zIndex:
                                  9998

                          });


                      // =============================================
                      // MOVE MAP TO USER
                      // =============================================

                      map.panTo(
                          userLocation
                      );


                      map.setZoom(
                          19
                      );


                      // =============================================
                      // BUTTON STATE
                      // =============================================

                      locationButton.disabled =
                          false;

                      locationButton.textContent =
                          "📍 My Location";


                      // =============================================
                      // LOCATION INFO
                      // =============================================

                      console.log(
                          "Latitude:",
                          latitude
                      );

                      console.log(
                          "Longitude:",
                          longitude
                      );

                      console.log(
                          "Accuracy:",
                          accuracy,
                          "metres"
                      );

                  },


                  function (error) {

                      // =============================================
                      // RESET BUTTON
                      // =============================================

                      locationButton.disabled =
                          false;

                      locationButton.textContent =
                          "📍 My Location";


                      // =============================================
                      // LOCATION ERROR
                      // =============================================

                      console.error(
                          "Geolocation error:",
                          error
                      );


                      if (
                          error.code ===
                          error.PERMISSION_DENIED
                      ) {

                          alert(
                              "Location permission was denied.\n\n" +
                              "Please allow location access in your browser settings and try again."
                          );

                      }


                      else if (
                          error.code ===
                          error.POSITION_UNAVAILABLE
                      ) {

                          alert(
                              "Your current location could not be determined.\n\n" +
                              "Please make sure your device location/GPS is turned on."
                          );

                      }


                      else if (
                          error.code ===
                          error.TIMEOUT
                      ) {

                          alert(
                              "Getting your location took too long.\n\n" +
                              "Please try again."
                          );

                      }


                      else {

                          alert(
                              "Unable to get your current location.\n\n" +
                              "Please check your browser location permission."
                          );

                      }

                  },


                  {
                      enableHighAccuracy: true,

                      timeout: 15000,

                      maximumAge: 0

                  }

              );

          }
      );

  }

    // ========================================================
    // FINISHED
    // ========================================================

    console.log(
        "InterSurv map connected to Firestore with monument photo gallery."
    );

}