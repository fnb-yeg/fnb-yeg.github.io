/*
 * Renders markdown in a webpage on the client side.
 * Markdown can be both embedded into the HTML of the page, or loaded from a
 * remote source.
 *
 * All divs with the class markdown will be rendered as markdown.
 * Markdown divs can either load markdown from a remote source using the
 * data-src attribute, or embed markdown directly in the HTML by omitting the
 * attribute.
 *
 * <div class="markdown">
 * This markdown is __directly__ embedded in the `HTML`
 * </div>
 *
 * <div class="markdown" data-src="https://remote.source/file.md"></div>
 */

/*
 * Base class for all entities
 */
class MarkupEntity {
	/*
	 * Creates a new MarkupEntity.
	 *
	 * tag - The HTML tag for this entity
	 * attributes - Any attributes this tag has. This is optional.
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

		this.content = content;
	}

	/*
	 * Add more content to this entity
	 */
	addContent(content) {
		this.content += content;
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

		// Form attributes into a string
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
 * An entity with children
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
			// Apply necessary attributes to children
			for (let attrib of Object.keys(this.childAttributes[child.tag])) {
				// If child already has an attribute with this name add a space and then
				// this attribute name, otherwise (if null or undefined) create new attribute
				child.attributes[attrib] =
					(child.attributes[attrib] ? child.attributes[attrib] + " " : "")
					+ this.childAttributes[child.tag][attrib];
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

	/*
	 * Returns the top-level parent of this entity
	 */
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
 * Parse a string into a tree of MarkupEntity.
 *
 * root - The root of this tree. Should be a NestableEntity
 * markdown - A string containing markdown source
 */
function parseMarkdown(root, markdown) {
	let stack = [];  // Parse stack
	let index = 0;  // Index of next character in markdown
	let line = 1, col = 1;  // Line and column counter for debugging

	while (true) {
		let token = "";

		// Shift next token
		while (index < markdown.length) {
			let ch = markdown[index];

			if (ch == '\n') {  // newline
				if (token.length > 0 && token[token.length - 1] == '\n') {
					// Two newlines in sequence
					// Strip trailing newline, push token onto stack, and
					// break to reduce step
					token = token.substring(0, token.length - 1);
					stack.push(token);
					break;
				} else {
					// Just a newline on its own, keep it as part of this token
					token += ch;
				}
			} else if (ch == '#') {
				
			} else {
				token += ch;
			}

			++index;
		}
	}
}

/*
 * Find every div with the markdown class and render it
 */
document.addEventListener("DOMContentLoaded", async function() {
	let targetDivs = document.querySelectorAll("div.markdown");

	for (const target of targetDivs) {
		if (!(target instanceof HTMLElement)) continue;  // Only process HTML elements

		let markdown;
		if ("src" in target.dataset) {
			// Load remote file
			markdown = await fetch(target.dataset.src).then(response => response.text());
		} else {
			// Use innerHTML
			markdown = target.innerHTML;
		}

		let baseCard = new NestableEntity("div", {"class": "card"});
		target.innerHTML = baseCard.generateEntity();
	}
});
