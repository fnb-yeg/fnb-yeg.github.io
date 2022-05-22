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
	const specialChars = "#*_~`^-\u2014![]()\"|:>.)\n";

	let tokens = [];
	let currentToken = "";
	let escapeNext = false;

	for (const ch of markdown) {
		const last = currentToken[currentToken.length-1] ?? "";

		if (escapeNext) {
			// Escape chars after backslashes
			if (currentToken !== "") {
				tokens.push(currentToken);
				currentToken = "";
			}

			tokens.push(`&#${ch.charCodeAt(0)};`);
			escapeNext = false;
		} else if (ch === '\\') {
			escapeNext = true;
		} else if (currentToken === "") {
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
 * Parses a resource like an image or a link into an object containing a
 * source, alt text, and a title. Also returns the "offset"; how much of the
 * stack was consumed.
 */
function parseResource(stack) {
	if (stack.length < 3) return null;  // Not a valid image

	let resource = {
		src: null,
		alt: null,
		title: null,
		offset: 0
	};
	let index = 0;

	// look for alt text
	if (stack[resource.offset] === '[') {
		// Found beginning of alt text
		let altText = "";
		++resource.offset;

		for (; resource.offset < stack.length; ++resource.offset) {
			if (stack[resource.offset] === ']') {
				// Found end of alt text
				resource.alt = altText;
				break;
			} else {
				altText += stack[resource.offset];
			}
		}

		if (resource.alt === null) return null;  // Not a valid resource
	}

	++resource.offset;
	if (resource.offset > stack.length) return resource;

	// Look for src and title
	if (stack[resource.offset] === '(') {
		// Found beginning of src
		let parseStep = 0;  // 0 = src, 1 = title, 2 = done
		let str = "";
		++resource.offset;

		for (; parseStep !== 2 && resource.offset < stack.length; ++resource.offset) {
			if (stack[resource.offset] === ')') {
				if (parseStep === 0) {
					// src
					resource.src = str;
				}

				parseStep = 2;
				break;
			} else if (stack[resource.offset] === '"') {
				if (parseStep === 0) {
					// switch to title
					resource.src = str;
					str = "";
					parseStep = 1;
					continue;
				} else if (parseStep === 1) {
					// end title
					resource.title = str;
					parseStep = 2
				}
			}

			str += stack[resource.offset];
		}
	}

	return resource;
}

/*
* Return array of classes for columns of table or null if it is invalid
*/
function parseTableAlignment(format) {
	if (format[0] !== '|') return null;

	let tableStyling = [];
	let alignment = -1;  // 0 = center, 1 = right, 2 = left, 3 = justified

	for (let i=1; i < format.length; ++i) {
		if (format[i] === ':') {
			if (alignment === -1) {
				// colon is first thing in the table specifier; left align
				alignment = 2;
			} else {
				// colon is not the first thing
				// if there was a colon at the start of the specifier,
				// alignment == 2 -> +1 == 3 == justified
				// if there was not a colon at the start, then
				// alignment == 0 -> +1 == 1 == right align
				++alignment;
			}
		} else if (format[i][0] === '-') {
			if (alignment === -1) {
				// this is the first thing in the table specifier; center by default
				alignment = 0;
			}
		} else if (format[i] === '|') {
			if (alignment === -1) {
				// This is not a valid table specifier
				return null;
			} else {
				switch (alignment) {
					case 0:
						tableStyling.push("md-table-align-center");
						break;
					case 1:
						tableStyling.push("md-table-align-right");
						break;
					case 2:
						tableStyling.push("md-table-align-left");
						break;
					case 3:
						tableStyling.push("md-table-align-justify");
						break;
				}

				alignment = -1;
			}
		} else {
			return null;
		}
	}

	return tableStyling;
}

/*
 * Find last index of token in string
 *
 * array	The array to search
 * token	The token to search for
 * Returns the index of the token, or -1 if no token found
 */
function rfind(array, token) {
	for (let j=array.length-1; j >= 0; --j) {
		if (array[j] === token) {
			return j;
		}
	}
	return -1;
}

/*
 * Parses inline markdown elements.
 *
 * tokens	An array of tokens to parse
 * Returns an array of strings containing the HTML version of the given
 * markdown.
 */
function parseInlineMarkdown(tokens) {
	let stack = [];

	/*
	 * Reduce all elements in stack after and including index into one string
	 */
	let reduce_stack = (index) => {
		let reduced = stack.slice(index).join('');
		stack.splice(index, stack.length, reduced);
	};

	for (let i=0; i < tokens.length; ++i) {
		let token = tokens[i];

		if (token.startsWith("*")) {
			let match;

			if (token.length > 2) {
				// Lexer made the token too long
				// Split up the token into valid subtokens and replace them
				let splitTokens = splitLength(token, 2);

				let forwardMatch = rfind(stack, splitTokens[0]);
				let backwardMatch = rfind(stack, splitTokens[splitTokens.length - 1]);

				if (backwardMatch > forwardMatch) {
					// This token works better if the split version is reversed
					splitTokens.reverse();
					match = backwardMatch;
				} else {
					match = forwardMatch;
				}

				tokens.splice(i, 1, ...splitTokens);
				token = tokens[i];  // get new shortened token
			} else {
				// Search backwards through parse stack for matching token
				match = rfind(stack, token);
			}

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
			let match;

			if (token.length > 2) {
				// Lexer made the token too long
				// Split up the token into valid subtokens and replace them
				let splitTokens = splitLength(token, 2);

				let forwardMatch = rfind(stack, splitTokens[0]);
				let backwardMatch = rfind(stack, splitTokens[splitTokens.length - 1]);

				if (backwardMatch > forwardMatch) {
					// This token works better if the split version is reversed
					splitTokens.reverse();
					match = backwardMatch;
				} else {
					match = forwardMatch;
				}

				tokens.splice(i, 1, ...splitTokens);
				token = tokens[i];  // get new shortened token
			} else {
				// Search backwards through parse stack for matching token
				match = rfind(stack, token);
			}

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
			let match = rfind(stack, token);

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
			let match = rfind(stack, token);

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
			let match = rfind(stack, token);

			if (match !== -1) {
				// A match was found!
				stack[match] = "<sup>";
				stack.push("</sup>");
				reduce_stack(match);
			} else {
				stack.push(token);
			}
		} else if (token === ']' || token === ")") {
			/* Links */
			stack.push(token);

			if (token === ']') {
				// Check if this is a longer link
				if (i+1 < tokens.length && tokens[i+1] === '(') {
					// This is a longer link, so itll get parsed later
					continue;
				}
			}

			// Search backwards through parse stack for beginning of link
			let match = rfind(stack, '[');

			if (match !== -1) {
				if (match !== 0 && stack[match-1] === '!') {
					// This is an image
					continue;
				}

				let link = parseResource(stack.slice(match));

				if (link === null || (link.src === null) && link.alt === null) {
					// Not a valid link
					continue;
				}

				let linkHtml = `<a href="${link.src ? link.src : link.alt}" title="${link.title ?? (link.src ?? link.alt)}">${link.alt}</a>`;
				stack.splice(match, link.offset+1, linkHtml);

			}
		} else {
			stack.push(token);
		}
	}

	return stack;
}

/*
 * Parses markdown, returning HTML
 *
 * tokens	The tokens to parse
 * Returns an HTML string
 */
function parseMarkdown(tokens) {
	let stack = [];
	let blockStack = [];

	let listIndent = -1;

	/*
	 * Flush the blockstack into the stack before the given index
	 *
	 * index	The index to flush before
	 * Returns the number of tokens added to the stack
	 */
	let blockStack_flushBefore = (index) => {
		let tokensAdded = 0;

		while (blockStack.length > 0) {
			stack.splice(index, 0, `</${blockStack.pop()}>`);
			++tokensAdded;
		}

		return tokensAdded;
	}

	/*
	 * Find last index of token containing a newline. Returns -1 if no match
	 * found.
	 */
	let rfind_lf = () => {
		for (let j=stack.length-1; j >= 0; --j) {
			if (stack[j].includes('\n')) {
				return j;
			}
		}
		return -1;
	};

	/*
	 * Reduce all elements in stack after and including index into one string
	 */
	let reduce_stack = (index) => {
		let reduced = stack.slice(index).join('');
		stack.splice(index, stack.length, reduced);
	};

	/*
	 * Returns a css class for an ordered list based off of a list marker, or
	 * null if the list marker is not a valid marker.
	 */
	let getOlClass = (firstToken, secondToken) => {
		let olClass;

		if (firstToken.split('').every(c => "ivxlcdm".includes(c))) {
			// lower roman numerals
			olClass = "lower-roman";
		} else if (firstToken.split('').every(c => "IVXLCDM".includes(c))) {
			// upper roman numerals
			olClass = "upper-roman";
		} else if (firstToken.length === 1
					&& (firstToken.charCodeAt(0) >= 0x41 && firstToken.charCodeAt(0) <= 0x5A)) {
			// upper latin
			olClass = "upper-latin";
		} else if (firstToken.length === 1
					&& (firstToken.charCodeAt(0) >= 0x61 && firstToken.charCodeAt(0) <= 0x7A)) {
			// lower latin
			olClass = "lower-latin";
		} else if (firstToken.split('').every(c => c.charCodeAt(0) >= 0x30 && c.charCodeAt(0) <= 0x39)) {
			// arabic
			olClass = "arabic";
		} else {
			return null;
		}

		if (secondToken === ')') {
			olClass += "-paren";
		} else if (secondToken !== '.') {
			return null;
		}

		return olClass;
	};

	let scratch;  // scratch variable for assignments in if conditions
				  // consider refactoring this out

	for (let i=0; i < tokens.length; ++i) {
		let token = tokens[i];

		if (token.startsWith('\n')) {
			// Handle block elements

			if (stack.length === 0) continue;  // Ignore this token

			let lineEnd = rfind_lf();  // Find index of last line ending
			let indent = 0;
			let firstTokenIndex = null;

			// lineEnd can never be last element, so +1 is always valid
			for (let j=lineEnd+1; j < stack.length; ++j) {
				if (!stack[j].split('').every(c => " \t".includes(c))) {
					firstTokenIndex = j;
					break;
				} else {
					indent += stack[j].length;
				}
			}

			firstToken = stack[firstTokenIndex];
			if (firstToken === null || firstToken === undefined) continue;  // Ignore this token

			if (firstToken.startsWith("#")) {
				/* Headings */
				firstTokenIndex += blockStack_flushBefore(firstTokenIndex);

				let level = (firstToken.length <= 6) ? firstToken.length : 6;
				stack[firstTokenIndex] = `<h${level}>`;
				stack.push(`</h${level}>`);

				let inline = parseInlineMarkdown(stack.slice(firstTokenIndex));
				stack.splice(firstTokenIndex, stack.length, ...inline);
				reduce_stack(lineEnd+1);
			} else if (firstToken === '!') {
				/* Images */
				// '!', '[', ..., ']', '(', ..., ')'
				if (stack.length - lineEnd < 5) continue;  // Not a valid image

				firstTokenIndex += blockStack_flushBefore(firstTokenIndex);

				let img = parseResource(stack.slice(firstTokenIndex + 1));

				if (img.src === null || img.alt === null) {
					// Not a valid image
					continue;
				}

				let imgHtml = `<img src="${img.src}" alt="${img.alt}" title="${img.title ?? img.alt}" />`;
				stack.splice(firstTokenIndex, img.offset+2, imgHtml);  // offset+2 since we've processed the \n and ! out here
			} else if (firstToken === '>') {
				/* Blockquotes */
				if (blockStack.length !== 0 && blockStack[blockStack.length-1] !== "blockquote") {
					// Blockstack is not empty and there isnt already a blockquote there
					firstTokenIndex += blockStack_flushBefore(firstTokenIndex);
				}

				if (blockStack.length === 0) {
					// Blockstack is empty; start a new blockquote
					// NOTE: class blockquote triggers a style from bootstrap
					// NOTE: should we use that style??
					stack[firstTokenIndex] = "<figure class=\"bq\"><blockquote>";
					blockStack.push("figure");
					blockStack.push("blockquote");
				} else {
					// Just keep adding to the current blockquote; itll get
					// closed later
					stack[firstTokenIndex] = '<br>'
				}
			} else if ((firstToken === '--' || firstToken === '\u2014')
					&& (blockStack.length !== 0 && blockStack[blockStack.length-1] === "blockquote")) {
				/* Blockquote attribution */
				stack[firstTokenIndex] = `</${blockStack.pop()}><figcaption>`;
				stack.push("</figcaption>");

				let inline = parseInlineMarkdown(stack.slice(firstTokenIndex));
				stack.splice(firstTokenIndex, stack.length, ...inline);
				reduce_stack(firstTokenIndex);

				blockStack_flushBefore(stack.length);
			} else if (firstToken === '-' || firstToken === '*' || firstToken === '\u2014') {
				/* unordered list */
				if (blockStack.length !== 0 && (blockStack[blockStack.length-1] !== "ol"
												&& blockStack[blockStack.length-1] !== "ul")) {
					// Blockstack is not empty and there isnt already a list there
					let shift = blockStack_flushBefore(lineEnd);
					firstTokenIndex += shift;
					lineEnd += shift;
				}

				if (indent > listIndent || blockStack.length === 0) {
					// Add a new list level
					let classList = "";

					if (firstToken !== '*') classList = `class="list-dashed"`;
					stack.splice(firstTokenIndex, 0, `<ul ${classList}>`);
					++firstTokenIndex;
					blockStack.push("ul");

					listIndent = indent;
				} else if (indent < listIndent) {
					// Go up a list level
					stack.splice(firstTokenIndex, 0, `</${blockStack.pop()}>`);
					++firstTokenIndex;

					listIndent = indent;
				} else if (blockStack[blockStack.length-1] === "ol") {
					// ul directly after an ol
					let classList = "";

					if (firstToken !== '*') classList = `class="list-dashed"`;
					stack.splice(firstTokenIndex, 0, `</${blockStack.pop()}><ul ${classList}">`);
					++firstTokenIndex;
					blockStack.push("ul");
				}

				stack[firstTokenIndex] = "<li>";
				stack.push("</li>");

				let inline = parseInlineMarkdown(stack.slice(firstTokenIndex+1));
				stack.splice(firstTokenIndex+1, stack.length, ...inline);
				reduce_stack(firstTokenIndex);
			} else if (stack.length > firstTokenIndex && ".)".includes(stack[firstTokenIndex+1])
						&& (scratch = getOlClass(firstToken.trimStart(), stack[firstTokenIndex+1])) !== null) {
				/* ordered list */
				if (blockStack.length !== 0 && (blockStack[blockStack.length-1] !== "ol"
												&& blockStack[blockStack.length-1] !== "ul")) {
					// Blockstack is not empty and there isnt already a list there
					let shift = blockStack_flushBefore(lineEnd);
					firstTokenIndex += shift;
					lineEnd += shift;
				}

				indent += firstToken.length - firstToken.trimStart().length;

				if (indent > listIndent || blockStack.length === 0) {
					// Add a new list level
					stack.splice(firstTokenIndex, 0, `<ol class="${scratch}">`)
					++firstTokenIndex;
					blockStack.push("ol");

					listIndent = indent;
				} else if (indent < listIndent) {
					// Go up a list level
					stack.splice(firstTokenIndex, 0, `</${blockStack.pop()}>`);
					++firstTokenIndex;

					listIndent = indent;
				} else if (blockStack[blockStack.length-1] === "ul") {
					// ol directly after a ul
					stack.splice(firstTokenIndex, 0, `</${blockStack.pop()}><ol class="${scratch}">`);
					++firstTokenIndex;
					blockStack.push("ol");
				}

				stack[firstTokenIndex] = "<li>";
				stack.push("</li>");
				stack.splice(firstTokenIndex+1, 1);

				let inline = parseInlineMarkdown(stack.slice(firstTokenIndex+1));
				stack.splice(firstTokenIndex+1, stack.length, ...inline);
				reduce_stack(firstTokenIndex);
			} else if (firstToken.startsWith('---') && stack.slice(firstTokenIndex).every(elem => elem.split('').every(ch => ch === '-'))) {
				/* Horizontal line */
				firstTokenIndex += blockStack_flushBefore(firstTokenIndex);
				stack.splice(firstTokenIndex, stack.length, "<hr />");
			} else if (lineEnd !== -1 && token.length === 1 && i+1 !== tokens.length && blockStack.length === 0) {
				// Single newline inside a paragraph; ignore
				stack.push('\u0003');
				continue;
			} else {
				/* Paragraphs */
				firstTokenIndex += blockStack_flushBefore(firstTokenIndex);

				if (stack[firstTokenIndex] === '|') {
					// Maybe a table
					let table = stack.slice(firstTokenIndex);
					let rows = [];

					while (table.length > 0) {
						let row = [];
						do {
							row.push(table.shift());
						} while (row[row.length-1] !== '\u0003' && table.length > 0);
						// push row without indentation and line seps
						rows.push(row.filter(token => !token.split('').every(c => " \t\u0003".includes(c))));
					}

					if (rows.length > 3 && rows[1].join('').split('').every(c => "|:-".includes(c))) {
						// This is a table
						let columnClasses = parseTableAlignment(rows[1]);

						if (columnClasses !== null) {
							// Valid table
							stack.splice(firstTokenIndex, stack.length);  // Remove existing table tokens from stack

							// Insert table formatting
							stack.push(`<table><thead><tr><th class="${columnClasses[0]}">`);

							// Insert table heading
							for (let i=1, col=1; i < rows[0].length-1; ++i) {
								if (rows[0][i] === '|') {
									stack.push(`</th><th class="${columnClasses[col]}">`);
									++col;
								} else {
									stack.push(rows[0][i]);
								}
							}

							// Table body
							stack.push("</th></tr></thead><tbody>");

							for (let i=2; i < rows.length; ++i) {
								stack.push(`<tr><td class="${columnClasses[0]}">`);

								for (let j=1, col=1; j < rows[i].length-1; ++j) {
									if (rows[i][j] === '|') {
										stack.push(`</td><td class="${columnClasses[col]}">`);
										++col;
									} else {
										stack.push(rows[i][j]);
									}
								}

								stack.push("</td></tr>");
							}

							// End of table
							stack.push("</tbody></table>");

							// Apply inline styles
							let inline = parseInlineMarkdown(stack.slice(firstTokenIndex));
							stack.splice(firstTokenIndex, stack.length, ...inline);
							reduce_stack(firstTokenIndex);

							stack.push('\n');
							continue;
						}
					}

				}

				stack.splice(firstTokenIndex, 0, "<p>");
				stack.push("</p>");

				let inline = parseInlineMarkdown(stack.slice(firstTokenIndex));
				stack.splice(firstTokenIndex, stack.length, ...inline);
				reduce_stack(firstTokenIndex);
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
	let targetElems = document.querySelectorAll("pre.markdown");

	for (const target of targetElems) {
		if (!target instanceof HTMLElement) continue;  // Not an HTML element; ignore it

		let markdown;

		if ("src" in target.dataset) {
			// Source specified; load remote file
			markdown = await fetch(target.dataset.src).then(response => response.text());
		} else {
			// No source; use textContent
			markdown = target.textContent;
		}

		let card = document.createElement("div");
		card.classList += "card";

		let cardBody = document.createElement("div");
		cardBody.classList += "card-body";
		card.appendChild(cardBody);

		let newElem = document.createElement("div");
		newElem.classList += "markdown";
		cardBody.appendChild(newElem);

		let tokens = tokenizeMarkdown(markdown);
		newElem.innerHTML = parseMarkdown(tokens);

		target.parentNode.replaceChild(card, target);
	}
});
