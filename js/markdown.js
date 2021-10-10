// Keeps track of all generated unique ids
let generatedIDs = [];
let genUniqueID = () => {
	let id;
	// IDs use low 16 bits of current UNIX time + random integer from 0 to 65535
	do { id = "" + Math.floor(Math.random() * 0x10000) + (Date.now() & 0xFFFF) } while (generatedIDs.includes(id));
	generatedIDs.push(id);
	return id;
}

/*
 * Base class for all entities
 */
class MarkupEntity {
	/*
	 * Creates a new MarkupEntity.
	 *
	 * tag - The HTML tag for this entity
	 * attributes - Any attributes this tag might have. This is optional.
	 */
	constructor(tag, attributes={}) {
		this.tag = tag;
		this.attributes = attributes;
	}

	/*
	 * Returns the HTML representation of this entity.
	 */
	generateEntity() {
		return "";
	}
}

/*
 * A plaintext entity.
 */
class TextEntity extends MarkupEntity {
	/*
	 * Creates a new TextEntity
	 *
	 * content - The content for the entity.
	 */
	constructor(content) {
		super(null);

		this.content = this._escapeString(content);
	}

	_escapeString(str) {
		str = str.replace(/&(?!.*?;)/g, "&amp;");  // Still allow regular html escapes
		str = str.replace(/</g, "&lt;");
		str = str.replace(/>/g, "&gt;");
		return str;
	}

	/*
	 * Add more content to this entity
	 */
	addContent(content) {
		this.content += this._escapeString(content);
	}

	generateEntity() {
		return this.content;
	}
}

/*
 * An entity which terminates like img or meta (i.e. no children)
 */
class TerminatingEntity extends MarkupEntity {
	generateEntity() {
		let attributeString = "";

		for (let [key, value] of Object.entries(this.attributes)) {
			if (value !== null) {
				attributeString += ` ${key}="${value}"`;
			} else {
				attributeString += ` ${key}`;
			}
		}

		return `<${this.tag}${attributeString} />`;
	}
}

/*
 * An HTML entity with children
 */
class NestableEntity extends MarkupEntity {
	/*
	 * Creates a new NestableEntity
	 *
	 * tag - The HTML tag for this entity
	 * attributes - Any attributes this tag might have. This is optional.
	 * childAttributes - Attributes which will be automatically applied to children of this entity
	 */
	constructor(tag, attributes={}, childAttributes={}) {
		super(tag, attributes);

		this.childAttributes = childAttributes;
		this.children = [];
	}

	/*
	 * Adds a child to this entity.
	 *
	 * child - A MarkupEntity
	 */
	addChild(child) {
		if (Object.keys(this.childAttributes).includes(child.tag)) {
			for (let attrib of Object.keys(this.childAttributes[child.tag])) {
				// replace with nullish coalescing operator when all modern browsers support it
				// child.attributes[attrib] = (child.attributes[attrib] ?? "") + this.childAttributes[child.tag];
				child.attributes[attrib] = (child.attributes[attrib] ? child.attributes[attrib] : "") + this.childAttributes[child.tag][attrib];
			}
		}
		this.children.push(child);

		return this;  // allow .addChild calls to be chained together
	}

	/*
	 * Returns the last child of this entity
	 */
	get lastChild() {
		// return this.children.filter((e, i) => i === this.children.length-1)[0];
		return this.children[this.children.length-1];
	}

	/*
	 * Updates the last child of this entity
	 */
	set lastChild(child) {
		this.children[this.children.length-1] = child;
	}

	generateEntity() {
		let attributeString = "";

		for (let [key, value] of Object.entries(this.attributes)) {
			if (value !== null) {
				attributeString += ` ${key}="${value}"`;
			} else {
				attributeString += ` ${key}`;
			}
		}

		let generated = [];
		for (let child of this.children) {
			generated.push(child.generateEntity());
		}
		return `<${this.tag}${attributeString}>${generated.join('')}</${this.tag}>`;
	}
}

/*
 * Defines bootstrap classes as MarkupEntities
 */
class BootstrapEntities {
	/*
	 * Returns a NestableEntity for a card with a header but no image. The lastChild element
	 * of this NestableEntity can have more entities put in it.
	 *
	 * properties should be an object with the following keys:
	 *   header - The text to go in the header.
	 */
	static card(properties) {
		let card = new NestableEntity("div", {"class": "card"});
		let headerEntity = new NestableEntity("h3", {"class": "card-header"});
		applyInlineFormatting(headerEntity, properties["header"]);
		card.addChild(headerEntity);

		card.addChild(new NestableEntity("div", {"class": "card-body"}, {"p": {"class": "mb-1"}}));
		return card;
	}

	/*
	 * Returns a NestableEntity for a news item card with an image at the top. The lastChild
	 * element of this NestableEntity can have more entities put in it.
	 *
	 * properties should be an object with the following keys
	 *   src - The source of the image
	 *   alt - The alt text of the image
	 *   title - The title of the news item
	 *   date - The date of the news item. This is optional
	 */
	static imgCard(properties) {
		let card = new NestableEntity("div", {"class": "card"});
		card.addChild(new NestableEntity("img", {"src": properties["src"], "alt": properties["alt"], "class": "card-img-top"}));

		let cardBody = new NestableEntity("div", {"class": "card-body"}, {"p": {"class": "mb-1"}});
		let cardTitleDiv = new NestableEntity("div", {"class": "d-flex w-100 justify-content-between"});
		cardBody.addChild(cardTitleDiv);
		
		let cardTitle = new NestableEntity("h5", {"class": "mb-1"});
		applyInlineFormatting(cardTitle, properties["title"]);
		cardTitleDiv.addChild(cardTitle);

		if (properties["date"]) {
			let cardDate = new NestableEntity("small");
			applyInlineFormatting(cardDate, properties["date"]);
			cardTitleDiv.addChild(cardDate);
		}

		card.addChild(cardBody);
		return card;
	}

	static imgCardCollapse(properties) {
		let card = new NestableEntity("div", {"class": "card"});
		card.addChild(new NestableEntity("img", {"src": properties["src"], "alt": properties["alt"], "class": "card-img-top"}));

		let collapseID = genUniqueID();
		let cardBody = new NestableEntity("div", {"class": "card-body"});
		// Add expand button

		cardBody.addChild(new NestableEntity("p").addChild(new NestableEntity("a", {
			"data-toggle": "collapse",
			"href": `#${collapseID}`,
			"role": "button",
			"aria-expanded": "false",
			"aria-controls": collapseID
		}).addChild(new TextEntity("[View Image Transcription]"))));

		cardBody.addChild(new NestableEntity("div", {"class": "collapse", "id": collapseID}));

		card.addChild(cardBody);
		return card
	}
}

/*
 * Translates markdown into a MarkupEntity
 *
 * markdown - An array of lines of markdown
 * root - A MarkupEntity that the output will be put into.
 * tagClasses - An object containing HTML tags and a class string to be added to them.
 */
function parseMarkdown(markdown, root, tagClasses) {
	// Block element types
	const NONE = 0;
	const PARAGRAPH = 1;
	const UL = 2;
	const OL = 3;
	const TABLE = 4;
	const QUOTE = 5;

	// Block element regexs
	const imageRegex = /^!\[([^\]]+)\]\(([^"]+?)\)$/;
	const ulRegex = /^([ \t]*?)([-*])[ \t](.*)$/;
	const olRegex = /^([ \t]*?)(\d+|[a-zA-Z])\.[ \t](.*)$/;  // TODO: update to support roman numerals and right parentheses
	const tableRegex = /\|(.+?)(?=\|)/g;  // technically don't need a capture group here except my code breaks when i remove it and its 470 lines long and i cannot handle the emotional strain of debugging it
									  // this previous comment is now out of date, because i had to change the regex because edge is a fucking shite browser and nobody should use it they should burn the fucking soujrce code aaaaaa fujk
	const tableFmtRegex = /\|([:-]{3,})(?=\|)/g;  // same goes here i literally could not be assed to save two characters and 243μs
											  // continuing with the previous update, edge's piece of shit regex engine made me rewrite this one too
	const blockquoteRegex = /^>[\s]*(.*)/;
	const blockquoteAttributionRegex = /^\s*-{1,2}(.*)$/;

	// Table column alignments
	const LEFT = 0;
	const CENTER = 1;
	const RIGHT = 2;

	let parent = null;
	let parentType = NONE;
	let listIndent = 0;
	let columnAlignment = [];

	// Iterate through the source line by line
	for (let i=0; i < markdown.length; ++i) {
		let line = markdown[i];
		let match;

		// Handle special cases
		if (line === '') {
			// Blank lines
			parentType = NONE;  // reset any formatting
			continue;
		} else if (line === '---') {
			// Horizontal lines
			root.addChild(new TerminatingEntity("hr"));
			continue;
		} else if (line[0] === '!') {  // Just so we don't always run the regex
			// Images
			if ((match = imageRegex.exec(line)) !== null) {
				let element = new TerminatingEntity("img", {"alt": match[1], "src": match[2]});
				root.addChild(element);
				continue;
			}
		} else if (line[0] === '$') {  // insert div

		}

		if (parentType === NONE || parentType === PARAGRAPH) {  // figure out what kind of parent should be on this line
			if ((match = ulRegex.exec(line)) !== null) {
				// ul
				let classString = getListClasses("ul", match[2]);
				parent = new NestableEntity("ul", {"class": classString});

				let element = new NestableEntity("li");

				listIndent = match[1].length;

				applyInlineFormatting(element, match[3]);

				parent.addChild(element);
				root.addChild(parent);
				parentType = UL;
			} else if ((match = olRegex.exec(line)) !== null) {
				// ol
				let classString = getListClasses("ol", match[2]);
				parent = new NestableEntity("ol", {"class": classString});

				let element = new NestableEntity("li");

				applyInlineFormatting(element, match[3]);

				parent.addChild(element);
				root.addChild(parent);
				parentType = OL;
			} else if (line.match(tableRegex) !== null) {
				// table
				if (markdown[i+1].match(tableFmtRegex) !== null) {
					// definitely a table
					// also why tf are tables so complicated like wtf the thead and tbody tags are totally unnecessary when you also have a special tag for table header cells
					// i guarantee that if anyone put more than 8 seconds of thought into it they could come up with an infinitely better system for table formatting in html
					// no i wont do it
					parent = new NestableEntity("table", {"class": "table table-bordered"});

					let head = new NestableEntity("thead");  // This is a useless fucking element
					let row = new NestableEntity("tr");

					// figure out alignment
					while ((match = tableFmtRegex.exec(markdown[i+1])) !== null) {
						let lastIndex = match[1].length - 1;
						if (match[1][0] === ':' && match[1][lastIndex] === ':') {
							columnAlignment.push(CENTER);
						} else if (match[1][lastIndex] === ':') {
							columnAlignment.push(RIGHT);
						} else {
							columnAlignment.push(LEFT);
						}
					}

					let column = 0;
					while ((match = tableRegex.exec(line)) !== null) {
						let style;

						switch (columnAlignment[column]) {
							case LEFT:
								style = "text-align: left;";
								break;
							case CENTER:
								style = "text-align: center;";
								break;
							case RIGHT:
								style = "text-align: right;";
								break;
						}

						let cell = new NestableEntity("th", {"style": style});  // this is the element that makes the aforementioned fucking element useless

						applyInlineFormatting(cell, match[1].trim());

						row.addChild(cell);
						++column;
					}

					head.addChild(row);
					parent.addChild(head);
					root.addChild(parent);
					++i;  // Skip table alignment/formatting thingy bcuz i dont actually use it
					parentType = TABLE;
				}
			} else if (line[0] === '>') {
				// Blockquote
				parent = new NestableEntity("blockquote");
				let body = new NestableEntity("div", {"class": "quote-body"});

				let paragraph = new NestableEntity("p");

				let match = blockquoteRegex.exec(line);

				applyInlineFormatting(paragraph, match[1]);

				body.addChild(paragraph);
				parent.addChild(body);
				root.addChild(parent);
				parentType = QUOTE;
			} else {
				let level = 0;
				for (; line[level] === '#'; ++level);  // Count '#'s at start of line
				line = line.slice(level);

				if (parentType === PARAGRAPH) {
					if (level === 0) {
						// Append to the previous paragraph
						applyInlineFormatting(parent, ' ' + line);
					} else {
						// This is actually a heading
						parentType = NONE;
						--i;
						continue;
					}
				} else {
					// Create new text element
					if (level === 0) {
						parent = new NestableEntity("p");
						parentType = PARAGRAPH;
					} else {
						parent = new NestableEntity(`h${level}`);
					}

					applyInlineFormatting(parent, line);

					root.addChild(parent);
					parent = (level === 0) ? parent : null;
				}
			}
		} else if (parentType === UL) {
			// this is either a list item or the end of a list
			if ((match = ulRegex.exec(line)) !== null) {  // list item
				let lineIndent = listItem("ul", parent, match, listIndent);

				if (lineIndent > listIndent) {  // this line is more indented than the last list item
					listIndent = lineIndent;
					parent = parent.lastChild;
				}
			} else {  // end of a list
				parentType = NONE;
				listIndent = 0;
				--i;
				continue;
			}
		} else if (parentType === OL) {
			if ((match = olRegex.exec(line)) !== null) {
				let newIndent = listItem("ol", parent, match, listIndent);

				if (newIndent > listIndent) {
					listIndent = newIndent;
					parent = parent.lastChild;
				}
			} else {
				parentType = NONE;
				listIndent = 0;
				--i;
				continue;
			}
		} else if (parentType === TABLE) {
			if (line.match(tableRegex) !== null) {
				// add another row to the table
				let body = new NestableEntity("tbody");
				let row = new NestableEntity("tr");
				let column = 0;

				while ((match = tableRegex.exec(line)) !== null) {
					let style;

					switch (columnAlignment[column]) {
						case LEFT:
							style = "text-align: left;";
							break;
						case CENTER:
							style = "text-align: center;";
							break;
						case RIGHT:
							style = "text-align: right;";
							break;
					}

					let cell = new NestableEntity("td", {"style": style});

					applyInlineFormatting(cell, match[1].trim());

					row.addChild(cell);
					++column;
				}

				body.addChild(row);
				parent.addChild(body);
			} else {
				parentType = NONE;
				--i;
				continue;
			}
		} else if (parentType === QUOTE) {
			if ((match = blockquoteRegex.exec(line)) !== null) {
				// Still a blockquote
				let paragraph = new NestableEntity("p");

				applyInlineFormatting(paragraph, match[1]);

				parent.lastChild.addChild(paragraph);
			} else if ((match = blockquoteAttributionRegex.exec(line)) !== null) {
				// no longer a blockquote, but has an attribution
				let attribution = new NestableEntity("div", {"class": "quote-attrib"});

				applyInlineFormatting(attribution, match[1]);

				parent.addChild(attribution);
				parentType = NONE;
			} else {
				// No longer a blockquote
				parentType = NONE;
				--i;
				continue;
			}
		}
	}

	return root;
}

/*
 * Applies inline formatting to a string, and appends it to the parent.
 *
 * This function does formatting for bold, italics, underlines, preformatted text (code),
 * superscript, subscript, hyperlinks, and email addresses.
 *
 * parent - The parent to append the resulting entities to
 * line - The line to format
 */
function applyInlineFormatting(parent, line) {
	// also had to rewrite these regexs to remove lookbehinds. did i mention fuck edge? actually fuck browser compatibility. why cant everyone just use the same browser and browser settings i do?
	const boldRegex = /(.*?)\*{2}(.*?)\*{2}(?!\*)(.*)/;  // Bold and italics need to be done as regex because 
	const italicRegex = /(.*?)\*(.*?)\*(.*)/;
	const underlineRegex = /(.*?)_{2}(.*?)_{2}(.*)/;
	const preformattedRegex = /(.*?)`(.*?)`(.*)/;
	const superscriptRegex = /(.*?)\^\((.*?)\)(.*)/;
	const subscriptRegex = /(.*?)\_\((.*?)\)(.*)/;
	const linkForm1 = /(.*?(?:^|[^!^]))\[([^\]]+)\]\(([^"]+?)\)(.*)/;  // [text](url)
	const linkForm2 = /(.*?(?:^|[^!^]))\[([^\]]+)\]\(([^")]+?) "(.+?)"\)(.*)/;  // [text](url "title")
	const linkForm3 = /(.*?)<([a-zA-Z0-9]+:\/\/[\w-.]+?.[\w-]+)>(.*)/;  // <url>
	const emailLink = /(.*?)<([a-zA-Z0-9!#$%&'*+-\/=?^_`{|}~.]+@[\w-.]+?.[\w-]+)>(.*)/g; // <email>

	let match;

	if ((match = boldRegex.exec(line)) !== null) {
		// match[1] = start of line
		// match[2] = content to make bold
		// match[3] = end of line
		applyInlineFormatting(parent, match[1]);  // format the start of the line

		let element = new NestableEntity("b");
		applyInlineFormatting(element, match[2]);  // format anything inside the bold tag

		parent.addChild(element);

		applyInlineFormatting(parent, match[3]);  // format the end of the line

		return;  // nothing left to do; the entire line has been formatted
	}

	if ((match = italicRegex.exec(line)) !== null) {
		// match[1] = start of line
		// match[2] = content to italicize
		// match[3] = end of line
		applyInlineFormatting(parent, match[1]);

		let element = new NestableEntity("i");
		applyInlineFormatting(element, match[2]);

		parent.addChild(element);

		applyInlineFormatting(parent, match[3]);

		return;
	}

	if ((match = underlineRegex.exec(line)) !== null) {
		// match[1] = start of line
		// match[2] = content to underline
		// match[3] = end of line
		applyInlineFormatting(parent, match[1]);

		let element = new NestableEntity("u");
		applyInlineFormatting(element, match[2]);

		parent.addChild(element);

		applyInlineFormatting(parent, match[3]);

		return;
	}

	if ((match = preformattedRegex.exec(line)) !== null) {
		// match[1] = start of line
		// match[2] = content to format
		// match[3] = end of line
		applyInlineFormatting(parent, match[1]);

		let element = new NestableEntity("code");
		element.addChild(new TextEntity(match[2]));  // dont format code

		parent.addChild(element);

		applyInlineFormatting(parent, match[3]);

		return;
	}

	if ((match = superscriptRegex.exec(line)) !== null) {
		// match[1] = start of line
		// match[2] = content to make superscript
		// match[3] = end of line
		applyInlineFormatting(parent, match[1]);

		let element = new NestableEntity("sup");
		applyInlineFormatting(element, match[2]);

		parent.addChild(element);

		applyInlineFormatting(parent, match[3]);

		return;
	}

	if ((match = subscriptRegex.exec(line)) !== null) {
		// match[1] = start of line
		// match[2] = content to make subscript
		// match[3] = end of line
		applyInlineFormatting(parent, match[1]);

		let element = new NestableEntity("sub");
		applyInlineFormatting(element, match[2]);

		parent.addChild(element);

		applyInlineFormatting(parent, match[3]);

		return;
	}

	if ((match = linkForm1.exec(line)) !== null) {
		// match[1] = start of line
		// match[2] = link text
		// match[3] = link url
		// match[4] = end of line
		applyInlineFormatting(parent, match[1]);

		let element = new NestableEntity("a", {"href": match[3]});
		applyInlineFormatting(element, match[2]);

		parent.addChild(element);

		applyInlineFormatting(parent, match[4]);

		return;
	}

	if ((match = linkForm2.exec(line)) !== null) {
		// match[1] = start of line
		// match[2] = link text
		// match[3] = link url
		// match[4] = link title
		// match[5] = end of line
		applyInlineFormatting(parent, match[1]);

		let element = new NestableEntity("a", {"href": match[3], "title": match[4]});
		applyInlineFormatting(element, match[2]);

		parent.addChild(element);

		applyInlineFormatting(parent, match[5]);

		return;
	}

	if ((match = linkForm3.exec(line)) !== null) {
		// match[1] = start of line
		// match[2] = link url
		// match[3] = end of line
		applyInlineFormatting(parent, match[1]);

		let element = new NestableEntity("a", {"href": match[2]});
		element.addChild(new TextEntity(match[2]));  // Add url literally

		parent.addChild(element);

		applyInlineFormatting(parent, match[3]);

		return;
	}

	if ((match = emailLink.exec(line)) !== null) {
		// match[1] = start of line
		// match[2] = email address
		// match[3] = end of line
		applyInlineFormatting(parent, match[1]);

		let element = new NestableEntity("a", {"href": `mailto:${match[2]}`});  // TODO: HTML encode emails
		element.addChild(new TextEntity(encodeEmail(match[2])));

		parent.addChild(element);

		applyInlineFormatting(parent, match[3]);

		return;
	}

	// No changes were made, add line exactly as it was passed
	parent.addChild(new TextEntity(line));
}

/*
 * Generates an <li> entity for a list item regex match.
 *
 * tag - The string tag of the parent of this list
 * parent - The parent NestableEntity
 * match - The regex match object
 * indent - How far indented the previous li was. If this one is more indented,
 *          then it will create a nested list.
 * Returns the indentation level of this li.
 */
function listItem(tag, parent, match, indent) {
	if (match[1].length > indent) {
		indent = match[1].length;
		let sublist = new NestableEntity(tag);

		let element = new NestableEntity("li");

		applyInlineFormatting(element, match[3]);

		sublist.addChild(element);
		parent.addChild(sublist);
	} else {
		let element = new NestableEntity("li");

		applyInlineFormatting(element, match[3]);
		parent.addChild(element);
	}

	return indent;
}

/*
 * Determines which CSS classes to apply to a list element.
 *
 * tag - The string tag of the parent of this list
 * marker - The marker string.
 * Returns a string which should be added to the classes for this element.
 */
function getListClasses(tag, marker) {
	let chars = marker.split().map((e) => e.codePointAt(0));

	if (tag === "ol") {
		if (chars[0] >= 0x61 && chars[0] <= 0x7A) {
			return "list-latin-lower";
		} else if (chars[0] >= 0x41 && chars[0] <= 0x5A) {
			return "list-latin-upper";
		} else if (chars.every((v) => (v >= 0x30 && v <= 0x39))) {
			return "list-arabic";
		}
	} else if (tag === "ul") {
		if (chars[0] === 0x2D) {
			return "list-dashed";
		}
	}

	return "";
}

/*
 * HTML-encodes an email address
 *
 * email - The email address to encode.
 * Returns an HTML-encoded string
 */
function encodeEmail(email) {
	let encoded = "";

	for (let i=0; i < email.length; ++i) {
		encoded += `&#${email.charCodeAt(i)};`;
	}

	return encoded;
}

document.addEventListener("DOMContentLoaded", async function() {
	let root = window.location.href;
	root = root.slice(0, root.lastIndexOf('/'));

	// Load manifest.json
	let manifestReq = await fetch(root + "/manifest.json", {
		"mode": "same-origin"
	});//.then(response => response.text().then(text => text.split('\n')));

	if (manifestReq.ok) {
		let manifest = await manifestReq.json();

		let getMarkdown = async (src) => {
			return await fetch(src, {
				"mode": "same-origin"
			}).then(response => response.text().then(text => text.replace('\r', '').split('\n')));
		};

		for (let target in manifest["targets"]) {
			let targetDiv = document.querySelector(`div.markdown-target#${target}`);

			for (let entry of manifest["targets"][target]) {
				if (!"type" in entry) {
					continue;  // type is required; skip this
				}

				let root;

				if (entry["type"] === "card") {
					root = BootstrapEntities.card(entry["properties"]);

					let markdown = await getMarkdown(entry["src"]);
					root.lastChild = parseMarkdown(markdown, root.lastChild);
					targetDiv.innerHTML += root.generateEntity();
				} else if (entry["type"] === "img-card") {
					root = BootstrapEntities.imgCard(entry["properties"]);

					let markdown = await getMarkdown(entry["src"]);
					root.lastChild = parseMarkdown(markdown, root.lastChild);
					targetDiv.innerHTML += root.generateEntity();
				} else if (entry["type"] === "img-card-collapse") {
					root = BootstrapEntities.imgCardCollapse(entry["properties"]);

					let markdown = await getMarkdown(entry["src"]);
					root.lastChild.lastChild = parseMarkdown(markdown, root.lastChild.lastChild);
					targetDiv.innerHTML += root.generateEntity();
				}
			}
		}
	}
});
