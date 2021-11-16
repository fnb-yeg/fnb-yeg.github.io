# Markdown

Markdown is a simple text styling syntax that provides an easier alternative to HTML. Different versions, or *flavours*, of it are used across the web, on sites like Discord, Reddit, and GitHub. The FNB Edmonton site lets you make posts using Markdown, either by embedding it directly into an HTML file, or by creating a Markdown file (`.md`) and linking it to and HTML file. This document describes how to use Markdown to create pages and posts on this website.

## Using Markdown with HTML

Since Markdown cannot be used to create webpages on its own, you need to combine it with some HTML. To use Markdown with HTML, first make sure that the following code is in the HTML file's head. If the page already has Markdown in it then you don't need to worry about this.

```html
<script src="/js/markdown.min.js"></script>
```

This will enable Markdown on this HTML page. Next you need to define the div in which the Markdown will go. To do this, just find the place in the HTML file where you want your Markdown to appear, and add a div with the class `markdown`.

```html
<div class="markdown"></div>
```

Now, we can add the Markdown to the page. This can be done either by loading it from a file, or by embedding the Markdown directly into the div.

To load the Markdown from a file, use the `data-src` attribute with the path to the file as its value.

```html
<div class="markdown" data-src="/path/to/file.md"></div>
```

To embed the Markdown directly, simply start writing it inside the div! Keep in mind that any HTML tags you write in this div will be ignored, however HTML comments will work inside Markdown. Angle brackets (`<` and `>`) must be encoded as HTML entities as well, but only when you embed Markdown into HTML. Indentation of your Markdown doesn't matter; it will be ignored.

```html
<div class="markdown">
# Put your Markdown here!
</div>
```

### Card Types

The `data-type` attribute specifies what kind of Bootstrap card to render. When this is used, it also determines what kind of context-based styling will be applied to any Markdown inside the content for this card. If the attribute is omitted then a basic card with no context-based styling is used. This section documents that context-based styling. There are currently 4 types of cards available for Markdown:

 - `recipe`, which creates a card specifically for displaying recipes
 - `news-basic`, which creates a basic news card with only a text header
 - `news-img`, which creates a news card with an image at the top
 - `news-img-collapse`, which creates a news card with an image at the top and a collapsible transcription.

#### `recipe`

 - The first non-blank line will be turned into the header. This line should be followed by a blank line.
 - The next three non-blank lines will be placed next to each other in a row. Each of these lines should be followed by a blank line.

A sample `recipe` card looks like this

```html
<div class="markdown" data-type="recipe">
## Name of Dish

**Makes**: # servings

**Prep Time**: # mins

**Cook Time**: # minutes

Ingredients:
 * **Quantity 1** Ingredient 1
 * **Quantity 2** Ingredient 2
&emsp;Other Options
 * **Quantity 3** Ingredient 3

Equipment:
 * **Size** equipment

Type up the recipe instructions here. Sauté.
</div>
```

#### `news-basic`

 - The first non-blank line will be turned into the header. This line should be followed by a blank line.

A sample `news-basic` card looks like this

```html
<div class="markdown" data-type="news-basic">
### Card Header

Brief description of event or project.
</div>
```

#### `news-img`

 - The first non-blank line should be an image, and it will be pinned at the top of the card.
 - The next two non-blank lines should be the title of the event, and the date if applicable. If the date is not applicable, replace it with `&nbsp;`

A sample `news-img` card looks like this

```html
<div class="markdown" data-type="news-img">
![Briefly describe your image here. If it is a poster, transcribe it.](/path/to/img)

##### Title of News Item
Date event took place

Description of event.
</div>
```

#### `news-img-collapse`

 - The first non-blank line should be an image, and it will be pinned at the top of the card.
 - All other text is used as the image transcription. It is hidden by default

`news-img-collapse` automatically inserts the expand/collapse toggle button.

A sample `news-img-collapse` card looks like this

```html
<div class="markdown" data-type="news-img-collapse">
![Briefly describe your image here. If it is a poster, transcribe it.](/path/to/img)

Type up the image transcription here.
Remember that this will be rendered markdown, so you can use markdown formatting to format the
transcription, unlike the alt text.
</div>
```

## Markdown syntax

Paragraphs are generic blocks of text. They are separated by a blank line. Two adjacent lines will be combined into one paragraph.

Headings are defined by adding `#`s in front of a line. One `#` will make a top-level heading (level 1), two will make a level 2 heading, and so on all the way to level 6 (`######`).

The following basic formatting can be applied to any text in both paragraphs and headings.

| Syntax              | Result                 |
|---------------------|------------------------|
| `**bold**`          | **bold**               |
| `*italic*`          | *italic*               |
| `__underlined__`    | <u>underlined</u>      |
| `^(superscript)`    | <sup>superscript</sup> |
| `_(subscript)`      | <sub>subscript</sub>   |
| `~~strikethrough~~` | <s>strikethrough</s>   |

Hyperlinks can also be put in both paragraphs and headings. There are three syntaxes for hyperlinks.

The most basic hyperlink syntax inserts only the link itself. This syntax can also be used with email addresses, in which case the link will open an email client automatically.

```
<https://edmonton.foodnotbombs.us>
```

The next syntax allows you to put some other text in the place of the hyperlink.

```
[FNB YEG](https://edmonton.foodnotbombs.us)
```

The third and final syntax allows you to add title text to the link, which will be displayed when one hovers over the link.

```
[FNB YEG](https://edmonton.foodnotbombs.us "FNB Edmonton")
```

Images are inserted similarly to hyperlinks. The syntax for an image provides alt text for the image, which is the text read by screen readers and displayed if the image can't be loaded, followed by the URL of the image.

```
![Description of the image](/path/to/the/image)
```

Both numbered and bulleted lists can be inserted. Numbered lists can use arabic numbers, latin letters, and roman numerals following the first syntax below. The numbers do not need to be in order, and they can be repeated, as they will be assigned the proper number in the order they appear in the document.

Bulleted lists can use either bullet points (represented by `*` or `•`) or dashes (represented by `-`).

```
1. First item
2. Second item
8. Third item (this will be numbered 3 when rendered)

- First point
- Second point
- Third point
```

Tables use the below syntax. The first row is the header of the table, and the second row defines the text alignment. Colons can be placed on the left, right, or both sides to change the text alignment Note that the rows do not have to align nicely in the markdown file, but it does make it easier for someone editing your markdown.

```
| This         | is       | a        | table         |
|:-------------|----------|:--------:|---------------|
| left-aligned | centered | centered | right-aligned |
```

Blockquotes are defined with the `>` symbol at the start of a line. Several of these on adjacent lines are combined into a longer block quote. At the end of a blockquote, one or two dashes can be used to add an attribution to the end.

```
> Blockquote
 -- Attribution
```
