## Markdown syntax

Paragraphs are generic blocks of text. They are separated by a blank line. Two adjacent lines will be combined into one paragraph.

Headings are defined by adding `#`s in front of a line. One `#` will make a top-level heading (level 1), two will make a level 2 heading, and so on all the way to level 6 (`######`).

The following basic formatting can be applied to any text in both paragraphs and headings.

| Syntax           | Result                 |
|------------------|------------------------|
| `**bold**`       | **bold**               |
| `*italic*`       | *italic*               |
| `__underlined__` | <u>underlined</u>      |
| `^(superscript)` | <sup>superscript</sup> |
| `_(subscript)`   | <sub>subscript</sub>   |

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

Both numbered and bulleted lists can be inserted. Numbered lists can use arabic numbers, or uppercase or lowercase latin letters, following the first syntax below. The numbers do not need to be in order, and they can be repeated, as they will be assigned the proper number in the order they appear in the document.

Bulleted lists can use either bullet points (represented by `*`) or dashes (represented by `-`).

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

> Blockquote
 -- Attribution

## Getting the Markdown onto a webpage

Each subpage is sorted into its own directory (i.e. the news page is in the news folder). This is the directory where you will be putting the markdown files you've written for this page. This folder also contains two important files: `index.html`, and `manifest.json`. These are the two files which will have to be edited to put your markdown on the webpage.

The first thing you need to do is add the following code to `index.html` in the spot where you want your markdown to appear on the page. Replace `templateID` with an unique name to represent what you're adding to the page.

```html
<div class="markdown-target" id="templateID"></div>
```

The default `manifest.json` file should look something like this

```json
{
    "targets": {

    }
}
```

After you've added the div to `index.html`, make an entry in `manifest.json` for your div. Inside the `targets` object, add the ID of your div and an array. Each item in this array will be placed inside the div with the ID `templateID`. In this example, we will add just one item to the array.

```json
{
    "targets": {
        "templateID": [
            {

            }
        ]
    }
}
```

All entries have a type, which can be one of `card`, `img-card`, and `img-card-collapse`. See the Manifest Entries section for details

```json
{
    "targets": {
        "templateID": [
            {
                "type": "card"
            }
        ]
    }
}
```

## Manifest Entries

### The `src` property

Some types of entries require the `src` property. This is a string containing the url to the markdown file that should be loaded with this entry.

```json
{
    "type": "card",
    "src": "/path/to/file.md"
}
```

### Other Properties

Other properies are defined in the `properties` element of the entry.

```json
{
    "type": "card",
    "properties": {

    }
}
```

### `card`

The `card` type is a basic card with a header. This type requires the `src` property.

`card`s have the following properties

#### `header`

The text to display as the heading for this card. This string may contain markdown.

### `img-card`

The `img-card` type is a card with an image at the top. This type requires the `src` property.

`img-card`s have the following properties

#### `src`

The URL of the image to display. This is distinct from the `src` property that contains the URL to the markdown file to render.

#### `alt`

Alt text for the image. This is plaintext, and cannot contain markdown.

#### `title`

The title of the card. This may contain markdown.

#### `date`

The date the event on the card took place. This is optional, and may contain markdown.

### `img-card-collapse`

The `img-card-collapse` type is an image card with a collapsible transcription. This type requires the `src` property.

`img-card-collapse`s have the following properties

#### `src`

The URL of the image to display. This is distinct from the `src` property that contains the URL to the markdown file to render.

#### `alt`

Alt text for the image. This is plaintext, and cannot contain markdown.
