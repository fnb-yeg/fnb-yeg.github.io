function randomID(prefix="_") {
    return `${prefix}${Math.random().toString(36).substr(2)}`;
}

function titleCase(str) {
    return str.replace(/\w\S*/g, s => s.charAt(0).toUpperCase() + s.substring(1).toLowerCase());
}

/*
 * Makes a bootstrap carousel
 * container    Element to append the carousel to
 * items        A list of Nodes to add into the carousel
 */
function makeBSCarousel(container, items) {
    const carouselID = randomID("carousel");

    /* Create skeleton first */
    // Create carousel container
    const carousel = document.createElement("div");
    carousel.id = carouselID;
    carousel.classList.add("carousel", "slide");
    carousel.dataset.bsInterval = false;
    container.appendChild(carousel);

    // Create indicator container
    const indicators = document.createElement("ol");
    indicators.classList.add("carousel-indicators");
    carousel.appendChild(indicators);

    // Create carousel container
    const inner = document.createElement("div");
    inner.classList.add("carousel-inner");
    carousel.appendChild(inner);

    // Create carousel buttons
    for (const btn of ["prev", "next"]) {
        const elem = document.createElement("a");
        elem.classList.add(`carousel-control-${btn}`);
        elem.href = `#${carouselID}`;
        elem.role = "button";
        elem.dataset.bsSlide = btn;
        carousel.appendChild(elem);

        // Icon
        const icon = document.createElement("span");
        icon.classList.add(`carousel-control-${btn}-icon`);
        icon.ariaHidden = true;
        elem.appendChild(icon);

        // Label
        const label = document.createElement("span");
        label.classList.add("visually-hidden");
        label.innerText = btn;
        elem.appendChild(label);
    }

    // Populate carousel
    for (let i=0; i < items.length; ++i) {
        // Add indicator
        const indicator = document.createElement("li");
        indicator.dataset.bsTarget = carouselID;
        indicator.dataset.bsSlideTo = i;
        indicators.appendChild(indicator);

        // Add item
        const item = document.createElement("div");
        item.classList.add("carousel-item");
        inner.appendChild(item);

        // Add content
        item.appendChild(items[i]);

        if (i === 0) {
            indicator.classList.add("active");
            item.classList.add("active");
        }
    }
}

/*
 * Appends a collapsible image transcription to the given element
 */
function makeImageTranscription(container, transcription) {
    let transID = randomID("transcription");

    // Generate collapse toggle
    let p = document.createElement("p");
    let elem = document.createElement("a");
    elem.dataset.bsToggle = "collapse";
    elem.href = `#${transID}`;
    elem.role = "button";
    elem.ariaExpanded = false;
    elem.ariaControls = transID;
    elem.innerText = "[View Image Transcription]";
    p.appendChild(elem);
    container.appendChild(p);

    // Generate transcription element
    let trans = document.createElement("div");
    trans.classList.add("collapse");
    trans.id = transID;
    trans.innerHTML = transcription;
    container.appendChild(trans);
}

/*
 * Gets image data from JSON; either a string containing the image url or an
 * object with src and alt keys.
 *
 * img      The value to get image data from
 * Returns [src, alt]
 */
function getImageData(img) {
    switch (typeof img) {
        case "string":
            return [img, ""];
        case "object":
            return [img.src, img.alt];
        default:
            return ["", ""];
    }
}

document.addEventListener("DOMContentLoaded", () => {
    // Wait until navbar has been populated
    document.querySelector("nav").addEventListener("sitedata-populate", () => {
        /* Highlight current page on navbar */
        const pageName = window.location.pathname.split('.', 1)[0];
        let navLinkID = null;

        switch (pageName) {
            case "/":
            case "/index":
                navLinkID = "nav-home";
                break;
            case "/news":
                navLinkID = "nav-news";
                break;
            case "/projects":
                navLinkID = "nav-projects";
                break;
            case "/how_to_join":
                navLinkID = "nav-join";
                break;
            case "/library":
                navLinkID = "nav-library";
                break;
            case "/recipes":
                navLinkID = "nav-recipes";
                break;
            case "/local_orgs":
                navLinkID = "nav-local";
                break;
            case "/history":
                navLinkID = "nav-history";
                break;
        }

        if (navLinkID !== null) {
            document.getElementById(navLinkID).classList.add("active");
        }
    });
});
