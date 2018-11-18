# Docma + Zebra Markdown Test

## How is this rendered to HTML?

Markdown files are rendered into plain HTML using **[`marked`](https://github.com/chjj/marked)** and styled by **[Docma](https://github.com/onury/docma)** default template.

### `Docma` Supproted Markdown options:

_Docma supports all `marked` options and a few others._

<table>
    <tr>
        <td><b>Option</b></td>
        <td><b>Type</b></td>
        <td><b>Default</b></td>
        <td><b>Description</b></td>
    </tr>
    <tr>
        <td><code><b>gfm</b></code></td>
        <td><code>Boolean</code></td>
        <td><code>true</code></td>
        <td>
            Whether to enable <a href="https://help.github.com/categories/writing-on-github">GitHub flavored markdown</a>.
        </td>
    </tr>
    <tr>
        <td><code><b>tables</b></code></td>
        <td><code>Boolean</code></td>
        <td><code>true</code></td>
        <td>
            Whether to enable enable GFM <a href="https://github.com/adam-p/markdown-here/wiki/Markdown-Cheatsheet#tables">tables</a>.
            This option requires the <code>gfm</code> option to be <code>true</code>.
        </td>
    </tr>
    <tr>
        <td><code><b>breaks</b></code></td>
        <td><code>Boolean</code></td>
        <td><code>false</code></td>
        <td>
            Whether to enable enable GFM <a href="https://help.github.com/articles/basic-writing-and-formatting-syntax/#paragraphs-and-line-breaks">line breaks</a>.
            This option requires the <code>gfm</code> option to be <code>true</code>.
        </td>
    </tr>
    <tr>
        <td><code><b>pedantic</b></code></td>
        <td><code>Boolean</code></td>
        <td><code>false</code></td>
        <td>
            Whether to conform with obscure parts of <code>markdown.pl</code> as much as possible.
            Don't fix any of the original markdown bugs or poor behavior.
        </td>
    </tr>
    <tr>
        <td><code><b>sanitize</b></code></td>
        <td><code>Boolean</code></td>
        <td><code>false</code></td>
        <td>
            Whether to use smarter list behavior than the original markdown.
            May eventually be default with the old behavior moved into <code>pedantic</code>.
        </td>
    </tr>
    <tr>
        <td><code><b>smartypants</b></code></td>
        <td><code>Boolean</code></td>
        <td><code>false</code></td>
        <td>
            Whether to use "smart" typographic punctuation for things like quotes and dashes.
        </td>
    </tr>
    <tr>
        <td><code><b>tasks</b></code></td>
        <td><code>Boolean</code></td>
        <td><code>true</code></td>
        <td>
            Whether to parse GitHub style task markdown (e.g. <code>&#x2D; [x] task</code>) into checkbox elements. Also, list is marked with <code>class="docma task-list"</code> and each item is marked with <code>class="docma task-item"</code> attributes.
        </td>
    </tr>
    <tr>
        <td><code><b>emoji</b></code></td>
        <td><code>Boolean</code></td>
        <td><code>true</code></td>
        <td>
            If set to <code>true</code>, emoji shortcuts (e.g. <code>&#x3A;smiley&#x3A;</code>) are parsed into <code>&lt;img /&gt;</code> elements with <a href="http://twitter.github.io/twemoji">twemoji</a> SVG URLs (and <code>class="docma emoji"</code> attribute).
        </td>
    </tr>
</table>

### Markdown Test

#### Unordered List

- *This text is italicized*
- ~~This was mistaken text~~.
- **This is bold text**
- **This text is _extremely_ important**

#### Quotation

In the words of Abraham Lincoln:

> Pardon my French

Use `git status` to list all new or modified files that haven't yet been committed.

#### Code Block
Some JS code exmaple here:
```js
module.exports = function () {
    "use strict";
    function Documentation() {
        this.is.generated("by").docma;
    }
    // .. proto methods ...
};
```

#### Numbered/Ordered List:

1. James Madison
2. James Monroe
3. John Quincy Adams

#### Nested List:

1. Make my changes
  1. Fix bug
  2. Improve formatting
    * Make the headings bigger
2. Push my commits to GitHub
3. Open a pull request
  * Describe my changes
  * Mention all the members of my team
    * Ask for feedback

#### Task List:

- [x] Finish my changes
- [ ] Push my commits to GitHub
- [ ] Open a pull request

#### Emoji

@onury :sunglasses: This PR looks great - it's ready to merge! :ok_hand:

#### Ignore Markdown

Let's rename \*our-new-project\* to \*our-old-project\*.

#### table

Colons can be used to align columns.

| Tables are cool | Left aligned column | Right Aligned  |
| --------------- | ------------------- | -----:|
| Column 1        | Column 2            | $1600 |
| This is the     | second row...       |   $12 |
| Zebra stripes   | are neat!           |    $1 |

#### Horizontal Rule

---

Can use hyphens, asterisks or underscores...


#### Images & YouTube Videos

YouTube videos can't be added directly but you can add an image with a link to the video like this:

<p>
<a href="http://www.youtube.com/watch?feature=player_embedded&v=oksphy2zJqQ">
<img src="http://img.youtube.com/vi/oksphy2zJqQ/0.jpg" alt="Dire Straits rules!" width="240" height="180" border="10" />
</a>
</p>

Or, in pure Markdown, but losing the image sizing and border:

[![Dire Straits rules!](http://img.youtube.com/vi/oksphy2zJqQ/0.jpg)](http://www.youtube.com/watch?v=oksphy2zJqQ)
