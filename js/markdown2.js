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
	const specialChars = "#*_~`^[]|:>.)\n";

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

	let rfind_token = (token) => {
		for (let j=stack.length-1; j > 0; --j) {
			if (stack[j] == token) {
				return j;
			}
		}
		return -1;
	}

	for (let i=0; i < tokens.length; ++i) {
		let token = tokens[i];

		if (token.startsWith("#")) {

		} else if (token.startsWith("*")) {
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
			} else {
				stack.push(token);
			}
		} else if (token.startsWith("~~")) {
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
			} else {
				stack.push(token);
			}
		} else if (token.startsWith("`")) {
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
			} else {
				stack.push(token);
			}
		} else if (token.startsWith("^")) {
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
			} else {
				stack.push(token);
			}
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
