
# Docma

![npm](https://img.shields.io/npm/v/docma.svg)
![release](https://img.shields.io/github/release/onury/docma.svg)
![dependencies](https://david-dm.org/onury/docma.svg)
![license](http://img.shields.io/npm/l/docma.svg)

> © 2016, Onur Yıldırım (@onury). MIT License.

A powerful API documentation generator with a cool template engine.  

Docma is a dev-tool written in Node.js to easily generate beautiful HTML documentation from your JS source files. It parses JSDoc comments into a Javascript object and builds a web app from the given template. The documentation data is then passed to the styled template within the global `docma` object.

### Table of Contents
- [Installation](#installation)
- [Building Documentation](#building-documentation)
    + [Build Configuration](#build-configuration)
- [Docma Templates](#docma-templates)
    + [Template Structure](#template-structure)
    + [Template Configuration](#template-configuration)
    + [HTML](#html)
    + [Partials](#partials)
    + [Docma-Web Core](#docma-web-core)
    + [Custom Scripts](#custom-scripts)
    + [Initializing the Template (Web App)](#initializing-the-template-web-app)
    + [CSS & Less](#css-and-less)
    + [Other Files](#other-files)
    + [Docma Default Template](#docma-default-template)
- [Parsed Documentation](parsed-documentation)
- [Change-Log](change-log)
- [License](license)

### Installation
```shell
npm i docma --save-dev
```

### Building Documentation

```js
var Docma = require('docma');
```
Either by passing a configuration object.
```js
// Docma.create(config) >> equivalent to >> new Docma(config)
Docma.create(config)
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

<table>
    <tr>
        <td><b>Option</b></td>
        <td><b>Type</b></td>
        <td><b>Default</b></td>
        <td><b>Description</b></td>
    </tr>
    <tr>
        <td><code><b>src</b></code></td>
        <td><code>String|Array</code></td>
        <td></td>
        <td>Required. One or more file/directory paths to be processed. This also accepts a <a href="https://github.com/isaacs/node-glob">Glob</a> string or array of globs. e.g. <code>./src/&#x2A;&#x2A;/&#x2A;.js</code> will produce an array of all .js files under <code>./src</code> directory and sub-directories.</td>
    </tr>
    <tr>
        <td><code><b>dest</b></code></td>
        <td><code>String</code></td>
        <td></td>
        <td>Required. Destination output directory path.</td>
    </tr>
    <tr>
        <td><code><b>template</b></code></td>
        <td><code>Object</code></td>
        <td><code>undefined</code></td>
        <td>Template specific configuration.</td>
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
        <td>↳<code>template.<b>document</b></code></td>
        <td><code>Object</code></td>
        <td><code>undefined</code></td>
        <td>
            Configuration to be applied to the main HTML document of the output.
        </td>
    </tr>
    <tr>
        <td>↳<code>template.document.<b>title</b></code></td>
        <td><code>String</code></td>
        <td><code>""</code></td>
        <td>
            Title of the HTML document. (Sets the value of the <code>&lt;title&gt;</code> element.)
        </td>
    </tr>
    <tr>
        <td>↳<code>template.document.<b>meta</b></code></td>
        <td><code>Array|Object</code></td>
        <td><code>undefined</code></td>
        <td>
            One or more meta elements to be set for the main HTML document. Set arbitrary object(s) for each meta element to be added. e.g. <code>[{ charset: "utf-8"}, { name: "robots", "content": "index, follow" }]</code>
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
        <td><code><b>dump</b></code></td>
        <td><code>Boolean</code></td>
        <td><code>false</code></td>
        <td>Set to <code>true</code> to output a JSON file from the documentation data. This will create a <code>documentation.json</code> file within the root of the output directory.</td>
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
</table>

## Docma Templates

Docma templates are essentially web files that mainly make use of [Dust.js][dustjs] internally. You can check out the [default template][default-template] for the structure and how partials are used.

### Template Structure

```
/template                      Required
    ├─ docma.template.json       ✔︎      Template configuration.
    ├─ index.html                ✔︎      Main entry point. (defined in docma.template.json)
    ├─ /partials                 ✔︎      Partials to be compiled.
    │      └─ docma-main.html    ✔︎      Main partial file.
    ├─ /js
    ├─ /css
    ├─ /less
    ├─ ...
    :
```

### Template Configuration

Docma templates should have a `docma.template.json` in the root of the template. This file defines template specific settings such as name of the template, version, the main entry point, document settings, ignored files, etc... This object can be accessed via `docma.template.options` within the template.

<table>
    <tr>
        <td><b>Config</b></td>
        <td><b>Type</b></td>
        <td><b>Default</b></td>
        <td><b>Description</b></td>
    </tr>
    <tr>
        <td><code><b>name</b></code></td>
        <td><code>String</code></td>
        <td></td>
        <td>
            Required. Name of the template.
        </td>
    </tr>
    <tr>
        <td><code><b>version</b></code></td>
        <td><code>String</code></td>
        <td><code>"1.0.0"</code></td>
        <td>
            Version of the template. (<a href="http://semver.org/">semver</a>).
        </td>
    </tr>
    <tr>
        <td><code><b>author</b></code></td>
        <td><code>String</code></td>
        <td></td>
        <td>
            Required. Author information.
        </td>
    </tr>
    <tr>
        <td><code><b>license</b></code></td>
        <td><code>String</code></td>
        <td></td>
        <td>
            Required. Name of the license. e.g. <code>"MIT"</code>
        </td>
    </tr>
    <tr>
        <td><code><b>main</b></code></td>
        <td><code>String</code></td>
        <td><code>"index.html"</code></td>
        <td>
            Name of the main HTML file which is the entry point of the template.
        </td>
    </tr>
    <tr>
        <td><code><b>ignore</b></code></td>
        <td><code>Array</code></td>
        <td><code>undefined</code></td>
        <td>
            List of files or directories to be ignored. <a href="https://github.com/isaacs/node-glob">Globs</a> allowed.
        </td>
    </tr>
    <tr>
        <td><code><b>compile</b></code></td>
        <td><code>Object</code></td>
        <td><code>undefined</code></td>
        <td>
            Hash-map for files to be compiled. Each key should be a relative path to template directory and each value should be a relative path to output directory (including the file name). Currently only Javascript and Less files are supported. e.g. <code>{ "js/main.js": "js/main.min.js", "less/app.less": "css/app.css" }</code>.
        </td>
    </tr>
    <tr>
        <td><code><b>options</b></code></td>
        <td><code>Object</code></td>
        <td><code>undefined</code></td>
        <td>
            Template default options. This object will be merged with the template options defined at build-time.
        </td>
    </tr>
</table>

Note that `docma.template.json` does not include any build configuration. This only configures the template.

#### HTML

`<template>/index.html` is the default entry point (main file) of the generated documentation. It should not include any Dust templates, but can of course include other custom HTML.

It should also include a `<div id="docma-main"></div>` which all the Dust templates will be compiled into. If you don't define this element, it will be created and dynamically appended to the body of the document.

Note that `index.html` is the default name of the entry point. You can customize this (name) in `docma.template.json`.

Example main file (`index.html`):
```html
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
</head>
<body>
    <div id="docma-main"></div>
    <div id="my-footer"></div>
</body>
</html>
```

An empty body would also be valid but we want the footer to come after _docma-main_ element. So it's explicitly defined.

Also, note that **title** of the document is not set. Since this is a template, title will be defined at build time and `<title>` element will be automatically added to the output document. See [Build Configuration](#build-configuration).

#### Partials

Put all [Dust.js][dustjs] partials in `<template>/partials` directory. You should name your main partial as `docma-main.html` which will be compiled into `<div id="docma-main"></div>` in your main HTML.

A simple example for `docma-main.html` partial:
```html
{#documentation}
    <h4 id="{.|$id}">{longname}</h4>
    <p>{description}</p>
{/documentation}
```

You can have sub directories within `<template>/partials` but all HTML files in these directories will be treated as if they were at the same level (under `<template>/partials` directory). For example, if you have a template at `<template>/partials/widgets/menu.html`, you should still include it like this: `{>"menu"/}` not `{>"widgets/menu"/}` or `{>"partials/widgets/menu"/}`. That's why all partials should have unique names.

These HTML files under `<template>/partials` are pre-compiled into Javascript and will be included as Dust JS templates. (Note that this directory will not be copied over to output directory.)

#### Docma-Web Core

When you build the documentation with your template, a `docma-web.js` will be generated (and linked in your main HTML); which is the core engine for the documentation web app. This will include everything the app needs such as the documentation data, compiled partials, dustjs engine, etc... (Note that the size of this script depends especially on the generated documentation data.)

See [Docma Web API][docma-web-api].

#### Custom Scripts

You have full control over the main HTML file so you can include any Javascript files in it. Docma web core will always be prepended before your scripts; so that you can safely access the global `docma` object.

#### Initializing the Template (Web App)

In order to make sure you execute some script after Docma is ready (and compiled partials are rendered), use the `.ready()` method of the global `docma` object.
```js
// run this in any js file in the browser
docma.ready(function (err) {
    if (err) {
        console.log(err);
        return;
    }
    // initialize your code here
})
```

#### CSS & Less

You can include any `.css` files, anywhere in your template. Since you have control over the main HTML file, you can link any stylesheet in it. As a convention, it's recommended that you place all `.css` files under `<template>/css`.

You can also include less files in your template. Main less file(s) to be compiled, should be defined in `docma.template.json`.

#### Other Files

You can include any custom files anywhere in your template. They will be copied over into the output directory. If you need to include a file in the template but don't want it to be in the generated output; define it in the `docma.template.json` file, within the `ignore` setting.

#### Docma Default Template

Using the default template is straight-forward. Just set `buildConfig.template.path` to `"default"` or omit it. You can check out the source of the [default template][default-template] to see a detailed example of how a template is structured and configured.

## Parsed Documentation

To investigate the parsed JSDoc documentation, enable the `dump` option that will create a `documentation.json` file within the root of the output directory.

If you have a problem with the parsed documentation data, open an issue @ [jsdoc-x][jsdoc-x]. _(I'm the author.)_

## Change-Log

See [CHANGELOG.md](CHANGELOG.md).

## License

MIT. You don't have to include any copyright notice in your templates but I'd appreciate if you let people know about this tool so we can read better documentations.


[jsdoc-x]:https://github.com/onury/jsdoc-x
[default-template]:https://github.com/onury/docma/tree/master/templates/default
[docma-web-api]:https://github.com/onury/docma/blob/master/doc/docma.web.md
[dustjs]: http://www.dustjs.com
