/*
 * Sort announcements sitedata by descending date.
 */
function orderAnnouncements() {
}

/*
 * Creates a card for the announcement
 */
function createAnnouncementCard(container, announcement) {
        // Create card
        const carouselID = randomID("announcementImages");
        let cardHTML = SiteData.query("@newsCard")
            .replaceAll("carouselID", carouselID);

        container.innerHTML += cardHTML;
        const card = container.lastElementChild;

        // Add images
        const imgContainer = card.querySelector(".imgContainer");

        // Returns [src, alt]
        const getImageData = (img) => {
            switch (typeof img) {
                case "string":
                    return [img, ""];
                case "object":
                    return [img.src, img.alt];
                default:
                    return ["", ""];
            }
        };

        if ("images" in announcement) {
            if (announcement.images.length === 1) {
                // Add one image
                const img = document.createElement("img");
                [img.src, img.alt] = getImageData(announcement.images[0]);
                img.classList.add("card-img-top");
                imgContainer.appendChild(img);
            } else if (announcement.images.length > 1) {
                // Add multiple images in a carousel
                let images = [];
                for (const image of announcement.images) {
                    let elem = document.createElement("img");
                    [elem.src, elem.alt] = getImageData(image);
                    elem.classList.add("d-block", "w-100");
                    images.push(elem);
                }
                makeBSCarousel(imgContainer, images);
            }
        }

        // Populate news data
        if ("title" in announcement) {
            card.querySelector(".announcement-title")
                .innerHTML = announcement.title;
        }
        if ("description" in announcement) {
            card.querySelector(".announcement-desc")
                .innerHTML = announcement.description;
        }

        // Add transcription if present
        if ("transcription" in announcement) {
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
            card.querySelector(".card-body").appendChild(p);

            // Generate transcription element
            let trans = document.createElement("div");
            trans.classList.add("collapse");
            trans.id = transID;
            trans.innerHTML = announcement.transcription;
            card.querySelector(".card-body").appendChild(trans);
        }

        // Populate date if a valid date is provided
        let date = new Date(announcement.date + "T00:00-06:00");
        if (!isNaN(date.valueOf())) {
            card.querySelector(".announcement-date")
                .innerText = date.toDateString();
        }
}

/*
 * Populate a container with an announcements list. Mutates announcements
 * sitedata to be ordered by date.
 *
 * container    The container HTML node to populate.
 * old          If true, load announcements after the N newest announcements.
 */
function populateAnnouncementsList(container, old=false) {
    // Get list of news items, ordered by date
    const announcements = SiteData.query("announcements");
    announcements.sort((a,b) => {
        if (!("date" in a)) return 1;  // No date; move to back

        if (a.date > b.date) {
            return -1;  // a is more recent
        } else if (a.date < b.date) {
            return 1;  // b is more recent
        } else {
            return 0;
        }
    });

    // Determine archive threshold
    const dateThreshold = SiteData.query("archive_date_threshold");
    let limit = SiteData.query("archive_count_threshold");

    // Archive old posts
    if (dateThreshold !== null) {
        // Determine date of oldest unarchived post
        let cutoff = dateThreshold.slice(0, -1);
        switch (dateThreshold.at(-1)) {
            case 'y':
            case 'Y':
                cutoff *= 3.15576e+10;
                break;
            case 'm':
            case 'M':
                cutoff *= 2.6298e+9;
                break;
            case 'd':
            case 'D':
                cutoff *= 8.64e+7;
                break;
        }
        cutoff = new Date(Date.now() - cutoff).toISOString().split('T')[0];

        // Reduce limit to exclude old posts
        for (let i=0; i < announcements.length && i < limit; ++i) {
            if ("date" in announcements[i] && announcements[i].date < cutoff) {
                limit = i;
            }
        }
    }

    // Create card for each announcement
    // Loop through [:limit] if !old; else [limit:]
    for (let i=(old ? limit : 0); i < announcements.length && (old || i < limit); ++i) {
        createAnnouncementCard(container, announcements[i]);
    }

    SiteData.populateDocument(container);
    renderMarkdown(container);
}
