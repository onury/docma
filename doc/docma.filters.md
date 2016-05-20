## Docma (Dust) Filters

Docma uses [Dust.js](http://www.dustjs.com/) as the template engine; which is also globally accessible within the template (web app).

As well as the Dust.js built-in filters, Docma includes pre-defined filters for ease of use. Note that you can also create your own custom filters using the `dust` object.

- Guide on [how to use Dust.js filters](http://www.dustjs.com/guides/using-filters)
- Create filters using [Dust.js Filter API](http://www.dustjs.com/docs/filter-api)

### Built-in Filters by Dust.js

<table>
    <tr>
        <td><b>Input</b></td>
        <td><b>Filter</b></td>
        <td><b>Description</b></td>
    </tr>
    <tr>
        <td><code>String</code></td>
        <td><b><code>h</code></b></td>
        <td>HTML encode.</td>
    </tr>
    <tr>
        <td><code>String</code></td>
        <td><b><code>s</code></b></td>
        <td>Turn off automatic HTML encoding</td>
    </tr>
    <tr>
        <td><code>String</code></td>
        <td><b><code>j</code></b></td>
        <td>Javascript string encode</td>
    </tr>
    <tr>
        <td><code>String</code></td>
        <td><b><code>u</code></b></td>
        <td>encodeURI</td>
    </tr>
    <tr>
        <td><code>String</code></td>
        <td><b><code>uc</code></b></td>
        <td>encodeURIComponent</td>
    </tr>
    <tr>
        <td><code>Object</code></td>
        <td><b><code>js</code></b></td>
        <td>JSON.stringify</td>
    </tr>
    <tr>
        <td><code>String</code></td>
        <td><b><code>jp</code></b></td>
        <td>JSON.parse</td>
    </tr>
</table>

### Built-in Filters by Docma

<table>
    <tr>
        <td><b>Input</b></td>
        <td><b>Filter</b></td>
        <td><b>Description</b></td>
    </tr>
    <tr>
        <td><code>String</code></td>
        <td><b><code>$pt</code></b></td>
        <td>
            Converts ticks to HTML code tags.<br />
            Also available as <code>docma.utils.parseTicks(string)</code>
        </td>
    </tr>
    <tr>
        <td><code>String</code></td>
        <td><b><code>$pnl</code></b></td>
        <td>
            Converts new lines to HTML paragraphs.<br />
            Also available as <code>docma.utils.parseNewLines(string)</code>
        </td>
    </tr>
    <tr>
        <td><code>String</code></td>
        <td><b><code>$pl</code></b></td>
        <td>
            Converts JSDoc <code>@link</code> directives to HTML anchor tags.<br />
            Also available as <code>docma.utils.parseLinks(string)</code>
        </td>
    </tr>
    <tr>
        <td><code>String</code></td>
        <td><b><code>$tl</code></b></td>
        <td>
            Removes leading spaces and dashes.<br />
            Also available as <code>docma.utils.trimLeft(string)</code>
        </td>
    </tr>
    <tr>
        <td><code>String</code></td>
        <td><b><code>$p</code></b></td>
        <td>
            Applies <code>$tl|$pnl|$pt|$pl</code> filters combined.<br />
            Also available as <code>docma.utils.parse(string)</code>
        </td>
    </tr>
    <tr>
        <td><code>String</code></td>
        <td><b><code>$nt</code></b></td>
        <td>
            Normalizes the number of spaces/tabs to multiples of 2 spaces, in the beginning of each line.<br />
            Also available as <code>docma.utils.normalizeTabs(string)</code>
        </td>
    </tr>
    <tr>
        <td><code>Object</code><br />(symbol)</td>
        <td><b><code>$desc</code></b></td>
        <td>
            Parses and returns the (class description or) description of the documentation symbol.
        </td>
    </tr>
    <tr>
        <td><code>Object</code><br />(param)</td>
        <td><b><code>$def</code></b></td>
        <td>
            Returns the default value of the parameter.
        </td>
    </tr>
    <tr>
        <td><code>Object</code><br />(symbol)</td>
        <td><b><code>$val</code></b></td>
        <td>
            Returns the value of the symbol (if any).
        </td>
    </tr>
    <tr>
        <td><code>Object</code><br />(symbol)</td>
        <td><b><code>$id</code></b></td>
        <td>
            Returns a readable id for the symbol. Useful for anchor bookmarks.<br />
            e.g. <code>&lt;a href="#{.|$id}"&gt;{longname}&lt;/a&gt;</code>
        </td>
    </tr>
</table>

←— [Docma documentation][docma].


[docma]:https://github.com/onury/docma
