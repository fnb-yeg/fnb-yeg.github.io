/*
 * Version 2.0 of markdown.js
 */

/*
 * Splits a string into an array of substrings with the given length. If the
 * string does not divide evenly into the specified length, then the last
 * element will contain the remaining characters.
 *
 * str		The string to split
 * len		The length of the substrings to split
 * Returns an array of the substrings.
 */
function splitLength(str, len) {
	let substrings = [];
	let current = "";

	for (const ch of str) {
		if (current.length !== 0 && current.length % len === 0) {
			// current is correct length
			substrings.push(current);
			current = ch;
		} else {
			current += ch;
		}
	}
	substrings.push(current);

	return substrings;
}

/*
 * Split markdown into its constituent tokens
 *
 * markdown		The markdown to tokenize
 * Returns an array containing the separated tokens
 */
function tokenizeMarkdown(markdown) {
	const specialChars = "#*_~`^![]()|:>.)\n";

	let tokens = [];
	let currentToken = "";

	for (const ch of markdown) {
		let last = currentToken[currentToken.length-1] ?? "";
		if (currentToken === "") {
			// No current token
			currentToken = ch;
		} else if (specialChars.includes(ch)) {
			// Current char is a special character
			if (last === ch) {
				// last char is the same as this
				currentToken += ch;
			} else {
				// last char was not a special char
				tokens.push(currentToken);
				currentToken = ch;
			}
		} else {
			// current char is not a special char
			if (specialChars.includes(last)) {
				// last char was a special char
				tokens.push(currentToken);
				currentToken = ch;
			} else {
				// last char also is not a special char
				currentToken += ch;
			}
		}
	}
	tokens.push(currentToken);

	return tokens;
}

/*
 * Parses markdown, returning HTML
 *
 * tokens	The tokens to parse
 * Returns an HTML string
 */
function parseMarkdown(tokens) {
	let stack = [];
	let tagStack = [];
	let blockStack = [];

	function MarkdownBlock(tag, index) {
		this.tag = tag;
		this.index = index;
	}

	let rfind_token = (token) => {
		for (let j=stack.length-1; j > 0; --j) {
			if (stack[j] === token) {
				return j;
			}
		}
		return -1;
	};

	let rfind_lf = () => {
		for (let j=stack.length-1; j > 0; --j) {
			if (stack[j].includes('\n')) {
				return j;
			}
		}
		return -1;
	};

	let rfind_lastopen = (tag) => {
		let closed = false;
		for (let j=stack.length-1; j > 0; --j) {
			if (stack[j] === `</${tag}>`) {
				closed = true;
			} else if (stack[j] === `<${tag}>`) {
				if (!closed) {
					return j;
				} else {
					closed = false;
				}
			}
		}
		return -1;
	}

	let reduce_stack = (index) => {
		let reduced = stack.slice(index).join('');
		stack.splice(index, stack.length, reduced);
	};

	for (let i=0; i < tokens.length; ++i) {
		let token = tokens[i];

		if (token.startsWith("*")) {
			if (token.length > 2) {
				// Lexer made the token too long
				// Split up the token into valid subtokens and replace them
				tokens.splice(i, 1, ...splitLength(token, 2));
				token = tokens[i];  // get new shortened token
			}

			// Search backwards through parse stack for matching token
			// TODO: this will cause overlapping tags (ex ***test***)
			let match = rfind_token(token);

			if (match !== -1) {
				// A match was found!
				if (token.length === 2) {
					/* Bold */
					stack[match] = "<b>";
					stack.push("</b>");
				} else {
					/* Italic */
					stack[match] = "<i>";
					stack.push("</i>");
				}
				reduce_stack(match);
			} else {
				stack.push(token);
			}
		} else if (token.startsWith("_")) {
			if (token.length > 2) {
				tokens.splice(i, 1, ...splitLength(token, 2));
				token = tokens[i];  // get new shortened token
			}

			// Search backwards through parse stack for matching token
			// TODO: overlapping tags
			let match = rfind_token(token);

			if (match !== -1) {
				// A match was found!
				if (token.length === 2) {
					/* Underline */
					stack[match] = "<u>";
					stack.push("</u>");
				} else {
					/* Subscript */
					stack[match] = "<sub>";
					stack.push("</sub>");
				}
				reduce_stack(match);
			} else {
				stack.push(token);
			}
		} else if (token.startsWith("~~")) {
			/* Strikethrough */
			if (token.length > 2) {
				tokens.splice(i, 1, ...splitLength(token, 2));
				token = tokens[i];  // get new shortened token
			}

			// Search backwards through parse stack for matching token
			let match = rfind_token(token);

			if (match !== -1) {
				// A match was found!
				stack[match] = "<s>";
				stack.push("</s>");
				reduce_stack(match);
			} else {
				stack.push(token);
			}
		} else if (token.startsWith("`")) {
			/* Code */
			if (token.length > 1) {
				tokens.splice(i, 1, ...splitLength(token, 1));
				token = tokens[i];  // get new shortened token
			}

			// Search backwards through parse stack for matching token
			let match = rfind_token(token);

			if (match !== -1) {
				// A match was found!
				stack[match] = "<code>";
				stack.push("</code>");
				reduce_stack(match);
			} else {
				stack.push(token);
			}
		} else if (token.startsWith("^")) {
			/* Superscript */
			if (token.length > 1) {
				tokens.splice(i, 1, ...splitLength(token, 1));
				token = tokens[i];  // get new shortened token
			}

			// Search backwards through parse stack for matching token
			let match = rfind_token(token);

			if (match !== -1) {
				// A match was found!
				stack[match] = "<sup>";
				stack.push("</sup>");
				reduce_stack(match);
			} else {
				stack.push(token);
			}
		} else if (token.startsWith('\n')) {
			// Handle block elements

			if (stack.length === 0) continue;  // Ignore this token

			let lineEnd = rfind_lf();  // Find index of last line ending
			let firstToken = stack[lineEnd + 1].trimStart();  // lineEnd can never be last element, so +1 is always valid


			if (firstToken.startsWith("#")) {
				/* Headings */
				let level = (firstToken.length <= 6) ? firstToken.length : 6;
				stack[lineEnd+1] = `<h${level}>`;
				stack.push(`</h${level}>`);
				reduce_stack(lineEnd+1);
			} else if (firstToken === '!') {
				/* Images */
				// '!', '[', ..., ']', '(', ..., ')'
				if (stack.length - lineEnd < 5) continue;  // Not a valid image

				let img = {
					src: null,
					alt: null,
					title: null
				};
				let index = lineEnd + 2;

				// look for alt text
				if (stack[index] === '[') {
					// Found beginning of alt text
					let altText = "";
					++index;

					for (; index < stack.length; ++index) {
						if (stack[index] === ']') {
							// Found end of alt text
							img.alt = altText;
							break;
						} else {
							altText += stack[index];
						}
					}

					if (img.alt === null) continue;  // Not a valid image
				}

				++index;
				if (index > stack.length) continue;

				// Look for src
				if (stack[index] === '(') {
					// Found beginning of src
					let src = "";
					++index;

					for (; index < stack.length; ++index) {
						if (stack[index] === ')') {
							// found end of src
							img.src = src;
							break;
						} else {
							src += stack[index];
						}
					}

					if (img.src === null) continue;  // Not a valid immage
				}

				let imgHtml = `<img src="${img.src}" alt="${img.alt}" title="${img.title ?? img.alt}" />`;
				stack.splice(lineEnd+1, index - lineEnd, imgHtml);
			} else if (lineEnd !== -1 && token.length === 1 && i+1 !== tokens.length) {
				// Single newline inside a paragraph; ignore
				continue;
			} else {
				/* Paragraphs */
				stack.splice(lineEnd+1, 0, "<p>");
				stack.push("</p>");
				reduce_stack(lineEnd+1);
			}

			stack.push('\n');
		} else {
			stack.push(token);
		}
	}

	return stack.join('');
}

document.addEventListener("DOMContentLoaded", async () => {
	// Render markdown after DOM finished parsing
	let targetDivs = document.getElementsByClassName("markdown");

	for (const target of targetDivs) {
		if (!target instanceof HTMLElement) continue;  // Not an HTML element; ignore it

		let markdown;

		if (src in target.dataset) {
			// Source specified; load remote file
			markdown = await fetch(target.dataset.src).then(response => response.text());
		} else {
			// No source; use innerHTML
			markdown = target.innerHTML;
		}
	}
});
