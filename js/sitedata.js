/*
 * Triggered when site data is loaded
 *
 * origin       The thing that requested the data load. The core sitedata load
 *              has the origin 'SITEDATA'. URL query loads have the origin
 *              'URL'. HTML sources specify their node object.
 * source       The path of the data source that was loaded
 * type         The type of data loaded; either 'data' or 'content'
 */
class SiteDataLoadEvent extends Event {
    #origin;
    #source;
    #type;

    constructor(origin, source, type) {
        super("sitedata-load");

        this.#origin = origin;
        this.#source = source;
        this.#type = type;
    }

    get origin() {
        return this.#origin;
    }

    get source() {
        return this.#source;
    }

    get type() {
        return this.#type;
    }
}

/*
 * Triggered when site data is populated
 *
 * element      The affected element
 * attribute    The attribute that was populated
 * key          The sitedata key that was queried
 * value        The value that was populated
 */
class SiteDataPopulateEvent extends Event {
    #element;
    #attribute;
    #key;
    #value;

    constructor(elem, attr, key, value) {
        super("sitedata-populate", { "bubbles": true });

        this.#element = elem;
        this.#attribute = attr;
        this.#key = key;
        this.#value = value;
    }

    get element() {
        return this.#element;
    }

    get attribute() {
        return this.#attribute;
    }

    get key() {
        return this.#key;
    }

    get value() {
        return this.#value;
    }
}

/*
 * Static class representing the site data
 */
class SiteData {
    static #data = {};
    static #content = {};

    static #promises = [];

    static get data() {
        return Object.freeze(SiteData.#data);
    }

    static get content() {
        return Object.freeze(SiteData.#content);
    }

    static toString() {
        return JSON.stringify({ data: SiteData.#data, content: SiteData.#content});
    }

    /*
     * Wrapper around fetch that rejects if the request fails. Enforces a
     * same-origin policy on all fetches.
     */
    static #fetch(src) {
        return fetch(src, { mode: "no-cors", credentials: "include" })
            .then(r => {
                if (!r.ok)
                    throw new Error(`fetch ${src} failed with code ${r.status}`);
                return r;
            });
    }

    /*
     * Returns once all pending promises are settled.
     */
    static async pendingPromises() {
        await Promise.allSettled(SiteData.#promises);
        SiteData.#promises = [];
    }

    /*
     * Load JSON site data
     * src      The source to load the data from
     * opts     Options to pass to fetch. Defaults to a same-origin request.
     * Returns a Promise that resolves to the loaded data
     */
    static loadData(src) {
        let promise = SiteData.#fetch(src)
            .then(r => r.json())
            .then(data => {
                SiteData.#data = Object.assign(SiteData.#data, data);
                return data;
            });
        SiteData.#promises.push(promise);
        return promise;
    }

    /*
     * Processes a Blob loaded from a content source
     * blob     The content Blob object to process
     * mime     The mime type of the content
     * Returns the appropriate String representation of the content
     */
    static #processContentBlob(blob, mime) {
        let [type, subtype] = mime.split('/', 2);

        // Process content based on MIME type
        switch (type) {
            case "text":
                return blob.text().then(text => {
                    // Handle markup content
                    if (subtype === "html"
                        || subtype === "xml"
                        || subtype === "svg"
                    ) {
                        // Parse document
                        let doc = new DOMParser().parseFromString(text, mime);
                        // Populate data
                        SiteData.populateDocument(doc);
                        // Extract original document. This may cause some kind
                        // of problems but it seems to work so far
                        text = doc.body.innerHTML;
                    }

                    return text;
                });
                break;
            default:
                // Binary data; create data URI
                return blob.bytes()
                    .then(b => `data:${mime};base64,${b.toBase64()}`);
        }
    }

    /*
     * Load arbitrary content
     * src      The source to load the content from
     * title    The content title, used to access the content
     * mime     The MIME type of the content. Defaults to text/plain
     * Returns a Promise that resolves to the loaded content
     */
    static loadContent(src, title, mime="text/plain") {
        // We only care about the discrete type
        let [type, subtype] = mime.split('/', 2);

        let promise = SiteData.#fetch(src)
            .then(r => r.blob())
            .then(blob => SiteData.#processContentBlob(blob, mime))
            .then(content => {
                SiteData.#content[title] = content;
                return content;
            });
        SiteData.#promises.push(promise);
        return promise;
    }

    /*
     * Gets a value from the site data
     * path     The path to access.
     * Returns the value, or undefined if the value does not exist
     *
     * Paths may be one or more data keys, separated by '.', or a single
     * content key prefixed with an '@'.
     */
    static query(path) {
        // Could this be a static method?
        if (path[0] === '@') {
            // Get content
            let key = path.substr(1);

            if (!(key in SiteData.#content)) {
                throw ReferenceError(`No such content entitled '${path}'`);
            }

            return SiteData.#content[key];
        } else {
            // Get data
            let keys = path.split('.');

            let selected = SiteData.#data;
            for (const key of keys) {
                if (!(key in selected)) {
                    throw ReferenceError(`No such data '${path}'`);
                }

                selected = selected[key];
            }

            return selected;
        }
    }

    /*
     * Populate a Document with data-driven values
     */
    static populateDocument(doc) {
        // Get all data-driven elements
        const elems = doc.querySelectorAll("[data-driven]");

        for (const elem of elems) {
            // Get all data targets within this element
            let targets = elem.dataset.driven.split(';');

            // Query and apply each data target
            for (const target of targets) {
                let [attr, key] = target.split('=');

                let value;
                try {
                    value = SiteData.query(key);
                } catch (err) {
                    // Ignore invalid keys
                    if (!(err instanceof ReferenceError)) throw err;
                    console.error(`Invalid key ${key}`);
                    continue;
                }

                elem[attr] = value;
                elem.dispatchEvent(new SiteDataPopulateEvent(elem, attr, key, value));
            }
        }
    }
}


const SITEDATA_PATH = "/sitedata.json";

// Debug/testing listeners
const ENABLE_DEBUG_LISTENERS = false;

if (ENABLE_DEBUG_LISTENERS) {
    document.addEventListener("sitedata-load", (e) => {
        console.log(e.origin, `loaded ${e.type} from '${e.source}'`);
    });
    document.addEventListener("sitedata-populate", (e) => {
        console.log(`Populated ${e.attribute} with '${e.value}' from key ${e.key}`, e.element);
    });
    document.addEventListener("sitedata-finish", () => console.log("Finished loading sitedata"));
}

document.addEventListener("DOMContentLoaded", async () => {
    const sitedata = new SiteData();

    /* Load core site data first */
    await SiteData.loadData(SITEDATA_PATH).then(() => {
        document.dispatchEvent(new SiteDataLoadEvent("SITEDATA", SITEDATA_PATH, "data"));
    });

    /* Load additional sources */
    // Get all <link> sources
    const linked = Array.from(document.querySelectorAll("link[data-include]"));

    // TODO: handle invalid include values

    // Sort data sources before content sources
    // Is order between elements of the same type preserved? If not it may
    // affect content queries from within content, which is undefined behaviour
    // currently but if order can be guaranteed it may make it more flexible
    linked.sort((a,b) => {
        if (a.dataset.include === b.dataset.include) return 0;  // No change
        if (a.dataset.include === "data") return -1;  // a comes first
        return 1;  // b comes first
    });

    // Load linked data sources second
    while (linked.length > 0 && linked[0].dataset.include === "data") {
        // Get next source to process
        const link = linked.shift();

        SiteData.loadData(link.href).then(() => {
            document.dispatchEvent(new SiteDataLoadEvent(link, link.href, "data"));
        }).catch(e => console.error(e));
    }
    await SiteData.pendingPromises();

    // Load URL query sources third
    let urlSources = new URLSearchParams(window.location.search).get("ds");
    if (urlSources !== null) {
        urlSources = urlSources.split(',');

        for (const source of urlSources) {
            let href = `/data/${source}.json`;
            SiteData.loadData(href)
                .then(() => document.dispatchEvent(new SiteDataLoadEvent("URL", href, "data")))
                .catch(e => console.error(e));
        }
    }
    await SiteData.pendingPromises();

    // Load linked content sources fourth
    while (linked.length > 0) {
        // Get next source to process
        const link = linked.shift();

        SiteData.loadContent(link.href, link.title,
            link.hasAttribute("type") ? link.type : "text/plain")
            .then(() => document.dispatchEvent(new SiteDataLoadEvent(link, link.href, "content")))
            .catch(e => console.error(e));
    }
    await SiteData.pendingPromises();

    /* Populate data-driven targets */
    SiteData.populateDocument(document);

    document.dispatchEvent(new CustomEvent("sitedata-finish"));
});

