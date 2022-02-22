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

/**
 * Attributes for an HTML element
 */
type Attributes = {
	[index: string]: string[] | null;
}

/*
 * Base class for all elements
 */
abstract class MarkupElement {
	/** The HTML tag of this element */
	public readonly tag: string;

	/**
	 * Any attributes this element may have.
	 * This object should contain string keys with array values.
	 */
	protected attributes: Attributes;

	/**
	 * Creates a new MarkupElement
	 *
	 * @param tag The HTML tag for this element
	 * @param attributes Any attributes this tag has. This is optional.
	 */
	public constructor(tag: string, attributes: Attributes={}) {
		this.tag = tag;
		this.attributes = attributes;
	}

	/**
	 * Form this.attributes into a valid HTML attribute string
	 *
	 * @returns attributes layed out in an HTML-friendly format
	 */
	protected getAttributeString(): string {
		let attributeString = "";

		// Form attributes into a string
		for (const [key, values] of Object.entries(this.attributes)) {
			if (values !== null) {
				// Condense all the values into a single string
				let valString = "";

				for (const value of values) {
					attributeString += ` ${key}="${valString}"`;
				}
			} else {
				// Attribute with no value (like checked property on a
				// checkbox), just put the attribute name
				attributeString += ` ${key}`
			}
		}

		return attributeString;
	}

	/**
	 * Adds an attribute to this element. If the attribute already exists then
	 * the value is appended to existing attribute
	 *
	 * @param attribute The name of the attribute
	 * @param value The value of the attribute. This can be omitted to add a
	 * boolean attribute. Omitting the value will have no effect if the
	 * attribute already has a value.
	 */
	public addAttribute(attribute: string, value: string | null=null): void {
		if (attribute in Object.entries(this.attributes)) {
			// Attribute already exists
			if (value !== null) {
				this.attributes[attribute].push(value);
			}
		} else {
			if (value !== null) {
				this.attributes[attribute] = [value];
			} else {
				this.attributes[attribute] = null;
			}
		}
	}

	/**
	 * Returns the HTML representation of this element.
	 */
	public abstract generateHTML(): string;
}

/**
 * Root element of a markdown document. This can only contain block elements
 */
class RootElement extends MarkupElement {
	protected children: BlockElement[];

	/**
	 * Creates a new RootElement
	 */
	public constructor() {
		super("div", {"class": ["markdown"]});
	}

	public generateHTML(): string {
		let generatedChildren = "";

		for (const child of this.children) {
			generatedChildren += child.generateHTML();
		}

		return `<${this.tag}${this.getAttributeString()}>${generatedChildren}</${this.tag}>`;
	}
}

/**
 * A block element.
 */
class BlockElement extends MarkupElement {
	protected children: InlineEntity[];

	public constructor(tag: string, attributes: Attributes) {
		super(tag, attributes);
	}

	public generateHTML(): string {
		let generatedChildren = "";

		for (const child of this.children) {
			generatedChildren += child.generateHTML();
		}

		return `<${this.tag}${this.getAttributeString()}>${generatedChildren}</${this.tag}>`;
	}
}

/**
 * A block element with no children
 */
class TerminalElement extends BlockElement {
	public generateHTML(): string {
		return `<${this.tag}${this.getAttributeString()} />`;
	}
}

/**
 * An inline element
 */
class InlineEntity extends MarkupElement {
	protected children: InlineEntity[];

	public generateHTML(): string {
		return "";
	}
}

/**
 * An entity representing only plaintext
 */
class TextEntity extends InlineEntity {
	protected content: string;

	public generateHTML(): string {
		return this.content;
	}
}

/*
 * A plaintext entity.
 */
class _TextEntity extends MarkupElement {
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

	generateHTML() {
		return this.content;
	}
}

/*
 * An entity which terminates like img or meta (i.e. no children)
 */
class TerminatingEntity extends MarkupElement {
	generateHTML() {
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
class NestableEntity extends MarkupElement {
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

	generateHTML() {
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
 * Split up markdown into a series of substrings which likely contain complete
 * tokens.
 *
 * markdown - The markdown source
 * Returns an array of strings
 */
function tokenizeMarkdown(markdown) {
	let tokens = [];
	let line = "";
	let index = 0;

	// Tokenize markdown
	for (const ch of markdown) {
		line += ch;

		if (ch === '\n') {
			// Tokenize line
		}
	}

	while (index < markdown.length) {
		let ch = markdown[index];

		if (ch == '\n') {  // newline
			if (token.length > 0 && token[token.length - 1] == '\n') {
				// Two newlines in sequence
				// Strip trailing newline, push token onto stack, and
				// break to reduce step
				token = token.substring(0, token.length - 1);
				tokens.push(token);
				token = "";
			} else {
				// Just a newline on its own, keep it as part of this token
				token += ch;
			}
		} else if (ch == '\\') {
			// Escape next char
			tokens.push(token);  // Push previous token
			token = "";

			// advance to next char
			++index;

			// Create and push HTML entity
			let entity = "&#";
			entity += markdown[index].codePointAt(0);
			entity += ";";

			tokens.push(entity);
		} else if (ch == '#') {
			if (token[token.length - 1] != '#') {
				// End of previous token
				tokens.push(token);
				token = "";
			}

			token += ch;
		} else {
			token += ch;
		}

		++index;
	}

	return tokens;
}

/*
 * Parses tokens into a tree of MarkupEntities.
 *
 * root - The root of this tree. Should be a NestableEntity
 * markdown - A string containing markdown to be parsed
 */
function parseMarkdown(root, markdown) {
	let stack = [];  // Parse stack

	for (let i=0; i < markdown.length; ++i) {
		let ch = markdown[i];
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

		let tokens = tokenizeMarkdown(markdown);
		parseMarkdown(baseCard, tokens);

		target.innerHTML = baseCard.generateHTML();
	}
});
