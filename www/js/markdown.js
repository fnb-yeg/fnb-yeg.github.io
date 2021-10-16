// generates a unique id
let genUniqueID = () => Number(((Math.floor(Math.random() * 0x10000) << 16) | (Date.now() & 0xFFFF)) >>> 0).toString(16);

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
		this.parent = null;
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
		child.parent = this;
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

	get root() {
		return this.parent ? this.parent.root : this;
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
 * Context-based card generators. These methods pass extra arguments to the markdown
 * generator to produce cards with context-based styling
 */
class Cards {
	static recipe(markdown, root) {
		let cardBody = new NestableEntity("div", {"class": "card-body"});

		// es6 guarantees that string keys will remain in insertion order
		parseMarkdown(markdown, cardBody, {
			"1": () => new NestableEntity("div", {"class": "row justify-content-center"}),
			"2:": () => new NestableEntity("div", {"class": "content"}),
			"2:4": () => new NestableEntity("div", {"class": "row"}),
			"2,3,4": () => new NestableEntity("div", {"class": "col-sm-12 col-md-4"}, {"p": {"class": "lead"}})
		});

		root.addChild(cardBody);
	}

	static news_basic(markdown, root) {
		parseMarkdown(markdown, root, {
			"1": () => new NestableEntity("div", {"class": "card-header"}),
			"2:": () => new NestableEntity("div", {"class": "card-body"}, {"p": {"class": "mb-1"}})
		});
	}

	static news_img(markdown, root) {
		parseMarkdown(markdown, root, {
			"1": () => new NestableEntity("div", {}, {"img": {"class": "card-img-top"}}),
			"2:": () => new NestableEntity("div", {"class": "card-body"}, {"p": {"class": "mb-1"}}),
			"2:3": () => new NestableEntity("div", {"class": "d-flex w-100 justify-content-between"}, {"h5": {"class": "mb-1"}, "p": {"style": "font-size:0.8em"}})
		});
	}

	static news_img_collapse(markdown, root) {
		let collapseID = genUniqueID();

		parseMarkdown(markdown, root, {
			"1": () => new NestableEntity("div", {}, {"img": {"class": "card-img-top"}}),
			"2:": () => new NestableEntity("div", {"class": "card-body"}),
			",2:": () => new NestableEntity("div", {
				"class": "collapse",
				"id": collapseID
			})
		});  // TODO: find nicer solution to have two schemas with identical targets

		// Add collapse button
		for (let i=0; i < root.children.length; ++i) {
			if ("class" in root.children[i].attributes && root.children[i].attributes["class"].includes("card-body")) {
				root.children[i].children.unshift(new NestableEntity("p").addChild(new NestableEntity("a", {
					"data-toggle": "collapse",
					"href": `#${collapseID}`,
					"role": "button",
					"aria-expanded": "false",
					"aria-controls": collapseID
				}).addChild(new TextEntity("[View Image Transcription]"))));
			}
		}
	}
}

/*
 * Determines whether the schema applies to this line.
 *
 * Returns 0 if the state should be unchanged, 1 if it should be added to the stack,
 * -1 if it should be removed from the stack, and -2 if it should be removed and re-added
 */
function doesSchemaApplyToLine(lineno, schema) {
	const RANGE = -1;  // from the previous item to the next, or the end if this is the last item
	const AFTER = -2;  // insert after the specified line
	const BEFORE = -3;  // insert before the specified line
	let lines = [];
	let currentNo = 0;

	for (let i=0; i < schema.length; ++i) {
		let charCode = schema.charCodeAt(i);

		if (charCode >= 0x30 && charCode <= 0x39) {
			// number
			currentNo *= 10;
			currentNo += charCode - 0x30;
		} else {
			lines.push(currentNo);
			currentNo = 0;

			if (charCode === 0x3A) {
				// colon
				if (i === 0 || lines[lines.length-1] === RANGE) return 0;  // invalid schema

				lines.push(RANGE);
			} else if (charCode === 0x2C) {
				// comma
				continue;
			} else if (charCode === 0x3E) {
				// >
				if (i === 0 || lines[lines.length-1] === AFTER) return 0;  // invalid schema

				lines.push(AFTER);
			} else if (charCode === 0x3C) {
				// <
				if (i === 0 || lines[lines.length-1] === BEFORE) return 0;  // invalid schema

				lines.push(BEFORE);
			} else {
				// Invalid schema
				return 0;
			}
		}
	}

	if (currentNo !== 0) lines.push(currentNo);

	let shouldAdd = false;
	let shouldRemove = false;

	for (let i=0; i < lines.length; ++i) {
		if (lines[i] === RANGE) {
			if (i === 0) return 0;  // invalid schema

			// x:y or x:
			if (lineno >= lines[i-1] && (i+1 === lines.length || lineno <= lines[i+1])) {
				if (shouldAdd) return 1;
				return 0;  // dont change state
			}
		} else if (lines[i] === BEFORE || lines[i] === AFTER) {
			if (i === 0) return 0;  // invalid schema
			if (lines[i-1] === AFTER || lines[i-1] === RANGE || lines[i-1] === BEFORE) return 0;  // invalid schema

			let delta = (lines[i] === BEFORE) ? 1 : -1;

			if (lineno + delta === lines[i-1]) {
				// The next line is the one this should be inserted before
				return 1;
			} else if (lineno === lines[i-1]) {
				// It was inserted before this line
				return -1;
			} else {
				// maintain state (off)
				return 0;
			}
		} else if (lines[i] === lineno) {
			shouldAdd = true;
		} else if (lines[i] === lineno-1 && lines[i+1] !== RANGE) {
			shouldRemove = true;
		}
	}

	if (shouldAdd && shouldRemove) {
		return -2;
	} else if (shouldAdd) {
		return 1;
	} else if (shouldRemove) {
		return -1;
	} else {
		return 0;
	}
}

/*
 * Translates markdown into a MarkupEntity
 *
 * markdown - An array of lines of markdown
 * root - A MarkupEntity that the output will be put into.
 * schema - A Map which gives the parser additional content to add to lines
 */
function parseMarkdown(markdown, root, schema={}) {
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

	let rootStack = [];
	let parent = null;
	let parentType = NONE;
	let listIndent = 0;
	let columnAlignment = [];
	let lineno = 1;  // this should increment on each non-blank line

	let getLowestRoot = () => rootStack.length > 0 ? rootStack[rootStack.length-1]["entity"] : root;

	// Iterate through the source line by line
	for (let i=0; i < markdown.length; ++i, ++lineno) {
		let line = markdown[i];
		let match;

		// skip blank lines
		if (line === '') {
			parentType = NONE;  // reset any formatting
			--lineno;  // lineno shouldn't be increased
			continue;
		}

		// update rootStack
		while (rootStack.length > 0) {
			// pop anything which no longer applies
			let applies = doesSchemaApplyToLine(lineno, rootStack[rootStack.length-1]["target"]);
			if (applies === -1 || applies === -2) {
				let lastItem = rootStack.pop();
				getLowestRoot().addChild(lastItem["entity"]);
			} else {
				break;
			}
		}

		// apply new schemas
		for (let k of Object.keys(schema)) {
			// push new entries
			let applies = doesSchemaApplyToLine(lineno, k);
			if (applies === 1 || applies === -2) {
				rootStack.push({"target": k, "entity": schema[k]()});
			}
		}

		// Handle special cases
		if (line === '---') {
			// Horizontal lines
			getLowestRoot().addChild(new TerminatingEntity("hr"));
			continue;
		} else if (line[0] === '!') {  // Just so we don't always run the regex
			// Images
			if ((match = imageRegex.exec(line)) !== null) {
				let element = new TerminatingEntity("img", {"alt": match[1], "src": match[2]});
				getLowestRoot().addChild(element);
				continue;
			}
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
				getLowestRoot().addChild(parent);
				parentType = UL;
			} else if ((match = olRegex.exec(line)) !== null) {
				// ol
				let classString = getListClasses("ol", match[2]);
				parent = new NestableEntity("ol", {"class": classString});

				let element = new NestableEntity("li");

				applyInlineFormatting(element, match[3]);

				parent.addChild(element);
				getLowestRoot().addChild(parent);
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
					getLowestRoot().addChild(parent);
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
				getLowestRoot().addChild(parent);
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

					getLowestRoot().addChild(parent);
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

	// unravel rootStack
	for (let i=rootStack.length; i > 0; --i) {
		let lastItem = rootStack.pop();
		getLowestRoot().addChild(lastItem["entity"]);
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
	const boldRegex = /(.*?)\*\*(.*?)\*\*(?!\*)(.*)/;  // Bold and italics need to be done as regex because 
	const italicRegex = /(.*?)\*(.*?)\*(.*)/;
	const underlineRegex = /(.*?)__(.*?)__(.*)/;
	const preformattedRegex = /(.*?)`(.*?)`(.*)/;
	const superscriptRegex = /(.*?)\^\((.*?)\)(.*)/;
	const subscriptRegex = /(.*?)\_\((.*?)\)(.*)/;
	const strikethroughRegex = /(.*?)~~(.*?)~~(.*)/;
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

	if ((match = strikethroughRegex.exec(line)) !== null) {
		// match[1] = start of line
		// match[2] = content to strikethrough
		// match[3] = end of line
		applyInlineFormatting(parent, match[1]);

		let element = new NestableEntity("s");
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
	let targetDivs = document.getElementsByClassName("markdown");

	for (const target of targetDivs) {
		if (!target instanceof HTMLElement) continue;  // This is an XML element; not what we want
		if (!"type" in target.dataset) continue;  // Missing required attribute; skip

		let type = target.dataset.type;
		let markdown;

		if ("src" in target.dataset) {
			// Load remote file
			markdown = await fetch(target.dataset.src, {
				"mode": "same-origin"
			}).then(response => response.text().then(text => text.replace('\r', '').split('\n')));
		} else {
			// Render embedded markdown
			markdown = target.textContent.replace('\r', '').split('\n').map(line => line.trim());
		}

		let card = new NestableEntity("div", {"class": "card"});

		if (type === "default") {
			let cardBody = new NestableEntity("div", {"class": "card-body"}, {"p": {"class": "mb-1"}});
			parseMarkdown(markdown, cardBody);
			card.addChild(cardBody);
		} else if (type === "recipe") {
			Cards.recipe(markdown, card);
		} else if (type === "news-basic") {
			Cards.news_basic(markdown, card);
		} else if (type === "news-img") {
			Cards.news_img(markdown, card);
		} else if (type === "news-img-collapse") {
			Cards.news_img_collapse(markdown, card);
		} else {
			continue;
		}

		target.innerHTML = card.generateEntity();
	}
});
