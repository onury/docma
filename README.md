# Docma

![npm](https://img.shields.io/npm/v/docma.svg)
![release](https://img.shields.io/github/release/onury/docma.svg)
![dependencies](https://david-dm.org/onury/docma.svg)
![license](http://img.shields.io/npm/l/docma.svg)

> © 2016, Onur Yıldırım (@onury). MIT License.

A powerful tool to easily generate beautiful HTML documentation from Javascript ([JSDoc][jsdoc]) and [Markdown][markdown] files.

### Features

- Parse **JSDoc** documentation and **Markdown** files.
- Build a cool **SPA** (Single Page Application) from parsed files.
- Generate multiple/separate API documentations by grouping JS files.
- Path or Query-string based app routing.
- Non-opinionated engine, built-in template with cool opinions. :sunglasses:
- Supports custom templates.
- Works great with **GitHub Pages**.
- Extremely configurable and debuggable.
- Well documented. :point_up:

### Table of Contents

- [Installation](#installation)
- [Building Documentation](#building-documentation)
    + [Build Configuration](#build-configuration)
    + [Parsed Output](#parsed-output)
- [Docma Templates](#docma-templates)
- [Change-Log](#change-log)
- [License](#license)
- [Related Modules](#related-modules)

### Installation

```sh
npm i docma --save-dev
```

### Building Documentation

Once you create the configuration object (or file), building documentation is pretty simple.

```js
var Docma = require('docma');
```
Either by passing a configuration object.
```js
var config = {
    src: [
        './code/**/*.js',
        './README.md'
    ],
    dest: './output/doc'
};
Docma.create(config) // equivalent to >> new Docma(config)
    .build()
    .catch(function (error) {
        console.log(error);
    });
```
Or by reading configuration from a JSON file.
```js
Docma.fromFile(configFile)
    .then(function (docma) {
        return docma.build();
    })
    .catch(function (error) {
        console.log(error);
    });
```

#### Build Configuration

Docma is very configurable 👏 but, you're only required to define very few options such as the source files (`src`) and the destination directory (`dest`) for a simple build.

<table>
    <tr>
        <td><b>Option</b></td>
        <td><b>Type</b></td>
        <td><b>Default</b></td>
        <td><b>Description</b></td>
    </tr>
    <tr>
        <td><code><b>src</b></code></td>
        <td><code>String|Array|Object</code></td>
        <td></td>
        <td>
            Required. One or more file/directory paths to be processed. This also accepts <a href="https://github.com/isaacs/node-glob">Glob</a> strings or array of globs. e.g. <code>./src/&#x2A;&#x2A;/&#x2A;.js</code> will produce an array of all <code>.js</code> files under <code>./src</code> directory and sub-directories.
        </td>
    </tr>
    <tr>
        <td><code><b>dest</b></code></td>
        <td><code>String</code></td>
        <td></td>
        <td>Required. Destination output directory path. <b>CAUTION:</b> This directory will be emptied before the build. Make sure you set this to a correct path.</td>
    </tr>
    <tr>
        <td><code><b>debug</b></code></td>
        <td><code>Boolean</code></td>
        <td><code>false</code></td>
        <td>
        If enabled, Javascript files are not minified, compiled less files are not compressed. Additionally, a <code>documentation.json</code> file (that includes the documentation data) is created within the root of the output directory, for investigation.
        </td>
    </tr>
    <tr>
        <td>↳<code>template.<b>app</b></code></td>
        <td><code>Object</code></td>
        <td><code>undefined</code></td>
        <td>
            Configuration for the generated web application.
        </td>
    </tr>
    <tr>
        <td>↳<code>template.app.<b>entrance</b></code></td>
        <td><code>String</code></td>
        <td><code>""</code></td>
        <td>
            Since you can include other HTML content in the output, other than the generated (JSDoc) documentation content; you can define which content should be loaded and displayed when the web app is first entered via the main file; i.e. <code>/index.html</code>. To set this to the documentation page (generated from JSDoc) either omit this option or set to <code>"doc"</code>. For other content, set this to the name of the HTML file placed within the <code>&lt;dest&gt;/content</code> directory, without the extension <code>.html</code>. For example, if you've included a markdown <code>README.md</code> file in the <code>src</code> array, this will be converted to HTML and generated as <code>&lt;dest&gt;/content/readme.html</code>. In order to set this as the <code>entrance</code>, set this option to <code>"readme"</code> (in lowercase).
        </td>
    </tr>
    <tr>
        <td><code><b>app</b></code></td>
        <td><code>Object</code></td>
        <td><code>undefined</code></td>
        <td>
            Configuration for the generated SPA (Single Page Application).
        </td>
    </tr>
    <tr>
        <td>↳<code>app.<b>title</b></code></td>
        <td><code>String</code></td>
        <td><code>""</code></td>
        <td>
            Title of the main HTML document of the generated web app. (Sets the value of the <code>&lt;title&gt;</code> element.)
        </td>
    </tr>
    <tr>
        <td>↳<code>app.<b>meta</b></code></td>
        <td><code>Array|Object</code></td>
        <td><code>undefined</code></td>
        <td>
            One or more meta elements to be set for the main HTML document of the generated web app. Set arbitrary object(s) for each meta element to be added. e.g. <code>[{ charset: "utf-8"}, { name: "robots", "content": "index, follow" }]</code>
        </td>
    </tr>
    <tr>
        <td>↳<code>app.<b>base</b></code></td>
        <td><code>String</code></td>
        <td><code>"/"</code></td>
        <td>
            Sets the base path of the generated web app. For example if the app will operate within `/doc/*` set the base path to `"/doc"`.
        </td>
    </tr>
    <tr>
        <td><code><b>template</b></code></td>
        <td><code>Object</code></td>
        <td><code>undefined</code></td>
        <td>
            SPA template configuration.
        </td>
    </tr>
    <tr>
        <td>↳<code>template.<b>path</b></code></td>
        <td><code>String</code></td>
        <td><code>"default"</code></td>
        <td>
            Either the path of a custom Docma template or the name of a built-in template. Omit to use the default built-in template.
        </td>
    </tr>
    <tr>
        <td>↳<code>template.<b>options</b></code></td>
        <td><code>Object</code></td>
        <td><code>undefined</code></td>
        <td>
            Options to be passed to the template.
            If any option is omitted in the build, default values within the <code>docma.template.json</code> configuration file of the template are used.
        </td>
    </tr>
    <tr>
        <td><code><b>jsdoc</b></code></td>
        <td><code>Object</code></td>
        <td><code>undefined</code></td>
        <td>JSDoc parse options.</td>
    </tr>
    <tr>
        <td>↳<code>jsdoc.<b>encoding</b></code></td>
        <td><code>String</code></td>
        <td><code>"utf8"</code></td>
        <td>Encoding to be used when reading source files.</td>
    </tr>
    <tr>
        <td>↳<code>jsdoc.<b>recurse</b></code></td>
        <td><code>Boolean</code></td>
        <td><code>false</code></td>
        <td>
            Specifies whether to recurse into subdirectories when scanning for source files.
        </td>
    </tr>
    <tr>
        <td>↳<code>jsdoc.<b>pedantic</b></code></td>
        <td><code>Boolean</code></td>
        <td><code>false</code></td>
        <td>
            Specifies whether to treat errors as fatal errors, and treat warnings as errors.
        </td>
    </tr>
    <tr>
        <td>↳<code>jsdoc.<b>access</b></code></td>
        <td><code>String|Array</code></td>
        <td><code>undefined</code></td>
        <td>
            Specifies which symbols to be processed with the given access property. Possible values: <code>"private"</code>, <code>"protected"</code>, <code>"public"</code> or <code>"all"</code> (for all access levels). By default, all except private symbols are processed. Note that, if access is not set for a documented symbol, it will still be included, regardless of this option.
        </td>
    </tr>
    <tr>
        <td>↳<code>jsdoc.<b>private</b></code></td>
        <td><code>Boolean</code></td>
        <td><code>false</code></td>
        <td></td>
    </tr>
    <tr>
        <td>↳<code>jsdoc.<b>package</b></code></td>
        <td><code>String</code></td>
        <td><code>undefined</code></td>
        <td>
            The path to the <code>package.json</code> file that contains the project name, version, and other details. If set to <code>true</code> instead of a path string, the first <code>package.json</code> file found in the source paths.
        </td>
    </tr>
    <tr>
        <td>↳<code>jsdoc.<b>module</b></code></td>
        <td><code>Boolean</code></td>
        <td><code>true</code></td>
        <td>
            Specifies whether to include <code>module.exports</code> symbols.
        </td>
    </tr>
    <tr>
        <td>↳<code>jsdoc.<b>undocumented</b></code></td>
        <td><code>Boolean</code></td>
        <td><code>true</code></td>
        <td>
            Specifies whether to include undocumented symbols.
        </td>
    </tr>
    <tr>
        <td>↳<code>jsdoc.<b>undescribed</b></code></td>
        <td><code>Boolean</code></td>
        <td><code>true</code></td>
        <td>
            Specifies whether to include symbols without a description.
        </td>
    </tr>
    <tr>
        <td>↳<code>jsdoc.<b>relativePath</b></code></td>
        <td><code>String</code></td>
        <td><code>undefined</code></td>
        <td>
            When set, all <code>symbol.meta.path</code> values will be relative to this path.
        </td>
    </tr>
    <tr>
        <td>↳<code>jsdoc.<b>predicate</b></code></td>
        <td><code>Function</code></td>
        <td><code>undefined</code></td>
        <td>
            Alias: <code>filter</code>. This is used to filter the parsed documentation output array. If a <code>Function</code> is passed; it's invoked for each included <code>symbol</code>. e.g. <code>function (symbol) { return symbol; }</code> Returning a falsy value will remove the symbol from the output. Returning <code>true</code> will keep the original symbol. To keep the symbol and alter its contents, simply return an altered symbol object.
        </td>
    </tr>
    <tr>
        <td>↳<code>jsdoc.<b>hierarchy</b></code></td>
        <td><code>Boolean</code></td>
        <td><code>false</code></td>
        <td>
            Specifies whether to arrange symbols by their hierarchy. This will find and move symbols that have a <code>memberof</code> property to a <code>$members</code> property of their corresponding owners. Also the constructor symbol will be moved to a <code>$constructor</code> property of the <code>ClassDeclaration</code> symbol; if any.
        </td>
    </tr>
    <tr>
        <td>↳<code>jsdoc.<b>sort</b></code></td>
        <td><code>Boolean|String</code></td>
        <td><code>false</code></td>
        <td>
            Specifies whether to sort the documentation symbols. For alphabetic sort, set to <code>true</code> or <code>"alphabetic"</code>. To additionally group by scope (static/instance) set to <code>"grouped"</code>. Set to <code>false</code> to disable.
        </td>
    </tr>
    <tr>
        <td><code><b>markdown</b></code></td>
        <td><code>Object</code></td>
        <td><code>undefined</code></td>
        <td>Markdown parse options.</td>
    </tr>
    <tr>
        <td>↳<code>markdown.<b>gfm</b></code></td>
        <td><code>Boolean</code></td>
        <td><code>true</code></td>
        <td>
            Whether to enable <a href="https://help.github.com/categories/writing-on-github">GitHub flavored markdown</a>.
        </td>
    </tr>
    <tr>
        <td>↳<code>markdown.<b>tables</b></code></td>
        <td><code>Boolean</code></td>
        <td><code>true</code></td>
        <td>
            Whether to enable enable GFM <a href="https://github.com/adam-p/markdown-here/wiki/Markdown-Cheatsheet#tables">tables</a>.
            This option requires the <code>gfm</code> option to be <code>true</code>.
        </td>
    </tr>
    <tr>
        <td>↳<code>markdown.<b>breaks</b></code></td>
        <td><code>Boolean</code></td>
        <td><code>false</code></td>
        <td>
            Whether to enable enable GFM <a href="https://help.github.com/articles/basic-writing-and-formatting-syntax/#paragraphs-and-line-breaks">line breaks</a>.
            This option requires the <code>gfm</code> option to be <code>true</code>.
        </td>
    </tr>
    <tr>
        <td>↳<code>markdown.<b>pedantic</b></code></td>
        <td><code>Boolean</code></td>
        <td><code>false</code></td>
        <td>
            Whether to conform with obscure parts of <code>markdown.pl</code> as much as possible.
            Don't fix any of the original markdown bugs or poor behavior.
        </td>
    </tr>
    <tr>
        <td>↳<code>markdown.<b>sanitize</b></code></td>
        <td><code>Boolean</code></td>
        <td><code>false</code></td>
        <td>
            Whether to use smarter list behavior than the original markdown.
            May eventually be default with the old behavior moved into <code>pedantic</code>.
        </td>
    </tr>
    <tr>
        <td>↳<code>markdown.<b>smartypants</b></code></td>
        <td><code>Boolean</code></td>
        <td><code>false</code></td>
        <td>
            Whether to use "smart" typographic punctuation for things like quotes and dashes.
        </td>
    </tr>
    <tr>
        <td>↳<code>markdown.<b>tasks</b></code></td>
        <td><code>Boolean</code></td>
        <td><code>true</code></td>
        <td>
            Whether to parse GitHub style task markdown (e.g. <code>&#x2D; [x] task</code>) into checkbox elements. Also, list is marked with <code>class="docma task-list"</code> and each item is marked with <code>class="docma task-item"</code> attributes.
        </td>
    </tr>
    <tr>
        <td>↳<code>markdown.<b>emoji</b></code></td>
        <td><code>Boolean</code></td>
        <td><code>true</code></td>
        <td>
            If set to <code>true</code>, emoji shortcuts (e.g. <code>&#x3A;smiley&#x3A;</code>) are parsed into <code>&lt;img /&gt;</code> elements with <a href="http://twitter.github.io/twemoji">twemoji</a> SVG URLs (and <code>class="docma emoji"</code> attribute).
        </td>
    </tr>
</table>

## Parsed Output

To investigate the parsed JSDoc output, enable the `debug` option that will create a `documentation.json` file within the root of the output directory.

If you have a problem with the parsed documentation data, open an issue @ [jsdoc-x][jsdoc-x]. _(I'm the author.)_

For markdown output issues (that are not related with style), you can open an issue @ [marked][marked].


## Change-Log

See [CHANGELOG.md](CHANGELOG.md).

## License

MIT. You don't have to include any copyright notice in your documentation output or templates but I'd appreciate if you let people know about this tool so we can read better documentations.

Emoji shortcuts used in source markdown files are parsed into [twemoji][twemoji]. Graphics licensed under [CC-BY 4.0][cc-by-4].

## Related Modules

- [grunt-docma][grunt-docma] — Grunt task for Docma.
- [jsdoc-x][jsdoc-x] — Parser for outputting a Javascript object from documented code via JSDoc's explain (-X) command.
- [marked][marked] — A full-featured markdown parser and compiler, written in JavaScript. Built for speed.
- [dustjs][dustjs-github] — Asynchronous Javascript templating for the browser and server.


[jsdoc]:http://http://usejsdoc.org
[markdown]:https://daringfireball.net/projects/markdown
[jsdoc-x]:https://github.com/onury/jsdoc-x
[marked]:https://github.com/chjj/marked
[default-template]:https://github.com/onury/docma/tree/master/templates/default
[docma-web-api]:https://github.com/onury/docma/blob/master/doc/docma.web.md
[dustjs]: http://www.dustjs.com
[dustjs-github]: https://github.com/linkedin/dustjs
[grunt-docma]:https://github.com/onury/grunt-docma
[twemoji]:https://github.com/twitter/twemoji
[cc-by-4]:https://creativecommons.org/licenses/by/4.0
