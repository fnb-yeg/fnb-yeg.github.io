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
                .innerHTML = getMDContent(announcement.description);
        }

        // Add transcription if present
        if ("transcription" in announcement) {
            makeImageTranscription(card.querySelector(".card-body"),
                                   getMDContent(announcement.transcription));
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
 * Returns the number of unarchived announcements
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
    let nUnarchived = SiteData.query("archive_count_threshold");

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

        // Reduce unarchived count to exclude old posts
        for (let i=0; i < announcements.length && i < nUnarchived; ++i) {
            if ("date" in announcements[i] && announcements[i].date < cutoff) {
                nUnarchived = i;
            }
        }
    }

    const perPage = SiteData.query("archive_page_limit");
    let first = 0;
    let last = announcements.length;

    // Paginate old archived posts
    if (old) {
        // Get page number; 1 if unspecified
        const page = new URLSearchParams(window.location.search).get("p") ?? 1;

        last = nUnarchived + perPage * page;
        first = last - perPage;

        if (last > announcements.length) last = announcements.length;
    }

    // Create card for each announcement
    // Loop through [:nUnarchived] if !old; else [nUnarchived:]
    for (let i=(old ? first : 0); i < last && (old || i < nUnarchived); ++i) {
        createAnnouncementCard(container, announcements[i]);
    }

    SiteData.populateDocument(container);
    renderMarkdown(container);

    return nUnarchived;
}
