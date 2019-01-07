<h1 align="center">
    <a href="https://onury.io/docma"><img width="200" height="200" src="https://raw.githubusercontent.com/onury/docma/master/docma-logo.png" alt="Docma" /></a>
</h1>

<p align="center">
    <a href="https://www.npmjs.com/package/docma"><img src="http://img.shields.io/npm/v/docma.svg?style=flat-square" alt="npm" /></a>
    <a href="https://github.com/onury/docma"><img src="https://img.shields.io/github/release/onury/docma.svg?style=flat-square" alt="release" /></a>
    <a href="https://github.com/onury/docma/blob/master/LICENSE"><img src="http://img.shields.io/npm/l/docma.svg?style=flat-square" alt="license" /></a>
    <a href="https://www.npmjs.com/package/docma"><img src="https://img.shields.io/npm/dt/docma.svg?style=flat-square" alt="downloads" /></a>
    <a href="https://david-dm.org/onury/docma"><img src="https://david-dm.org/onury/docma.svg?style=flat-square" alt="dependencies" /></a>
    <a href="https://github.com/onury/docma/graphs/commit-activity"><img src="https://img.shields.io/maintenance/yes/2019.svg?style=flat-square" alt="maintained" /></a>
    <a href="https://onury.io/docma"><img src="https://img.shields.io/badge/docs%20by-docma-c27cf4.svg?docs%20by=docma&style=flat-square" alt="documentation" /></a>
    <br />
    <sub>© 2019, Onur Yıldırım (<b><a href="https://github.com/onury">@onury</a></b>).</sub>
</p>

A powerful tool to easily generate beautiful HTML documentation from Javascript ([JSDoc][jsdoc]), [Markdown][markdown] and HTML files.

## Features

- Parse **JSDoc** documentation, **Markdown** and **HTML** files.
- Build a cool **SPA** (Single Page Application) from parsed files.
- Generate multiple/separate API documentations by **grouping** JS files.
- Path or Query-string based app routing.
- Non-opinionated engine, **built-in** template with [cool opinions][zebra]. :sunglasses:
- Supports custom templates, comes with template authoring tools.
- Works great with **GitHub Pages**, Amazon **S3**, Nginx, Apache, etc...
- Build via [**API**][docma-api] or [**CLI**][docma-cli].
- Extremely configurable and debuggable.
- Well documented. :point_up:

...like this:

<p align="center">
    <a href="https://onury.io/docma"><img width="650" height="385" src="https://raw.github.com/onury/docma/master/docma-screen.gif" alt="Docma screen" /></a>
    <br />
    <br />
    <sub>This is generated with the built-in template, Zebra.</sub><br />
    <a href="https://onury.io/docma">click to view live</a>
</p>

## Installation

```console
npm i docma -D
```

## Building Documentation with CLI

You can use Docma CLI to build documentations directly from your console. 
Once you create the configuration file `docma.json` in your project root, it's quite simple.

```console
docma
```
You can even serve the docs locally and test.
```console
docma serve
```

See 
 - [Docma CLI Reference][docma-cli]
 - [Build Configuration][docma-config]
 - [F.A.Q.][docma-faq]

## Building Documentation Programmatically

If you need to build documentation from within your code, use the API.

```js
const Docma = require('docma');
```
Either by passing a [configuration][docma-config] object.
```js
const config = {
    src: [
        './code/**/*.js',
        './README.md'
    ],
    dest: './output/doc'
};
Docma.create()
    .build(config)
    .then(success => console.log('Documentation is built successfully.'))
    .catch(error => console.log(error));
```
Or by reading [configuration][docma-config] from a JSON file.
```js
Docma.create()
    .build('./path/to/docma.json')
    .catch(error => console.log(error));
```
See [Docma API Reference][docma-api].

## Parsed Output

Sometimes, the issue is with invalid JSDoc comments. [See this](https://github.com/onury/docma/issues/55#issuecomment-437599192) for linting/validating your JSDoc while you type and within a build process.

To investigate the parsed JSDoc output, enable the `debug` option that will create a JSON output(s) within the root of the destination directory. If you have a problem with the parsed documentation data, open an issue @ [jsdoc-x][jsdoc-x]. _(I'm the author.)_

For markdown output issues (that are not related with style), you can open an issue @ [marked][marked].

## Changelog

See [**CHANGELOG**][changelog].  

#### Compatibility Table

| Docma version | Node version |
|---------------|--------------|
| [v3.0.0](https://github.com/onury/docma/blob/master/CHANGELOG.md#300-2018-11-18)   | **v8+** |
| [v2.0.0](https://github.com/onury/docma/blob/master/CHANGELOG.md#200-2018-04-12)   | **v6+** |
| [v1.0.0](https://github.com/onury/docma/blob/master/CHANGELOG.md#100-2016-06-11)   | **v4+** |

 ## Documentation
Read [**Docma documentation**][docma-docs], built with Docma, for a Docma demo... :eyes:  
Also see the [**F.A.Q.**][docma-faq] section.

## License

[**MIT**][license]. You don't have to include any copyright notice in your documentation output or templates but I'd appreciate if you let people know about this tool so we can read better documentations.

Emoji shortcuts used in source markdown files are parsed into [twemoji][twemoji]. Graphics and icons licensed under [CC-BY 4.0][cc-by-4].

## Related Modules

- [jsdoc-x][jsdoc-x] — Parser for outputting a Javascript object from documented code via JSDoc's explain (-X) command.
- [marked][marked] — A full-featured markdown parser and compiler, written in JavaScript. Built for speed.
- [dustjs][dustjs-github] — Asynchronous Javascript templating for the browser and server.


[license]:https://github.com/onury/docma/blob/master/LICENSE
[changelog]:https://github.com/onury/docma/blob/master/CHANGELOG.md
[screenshot]:https://raw.github.com/onury/docma/master/docma-screen.jpg
[screen-gif]:https://raw.github.com/onury/docma/master/docma-screen.gif
[docma-docs]:https://onury.io/docma
[docma-api]:https://onury.io/docma/api
[docma-cli]:https://onury.io/docma/cli
[docma-config]:https://onury.io/docma/api/#Docma~BuildConfiguration
[docma-faq]:https://onury.io/docma/faq
[zebra]:https://onury.io/docma/templates/zebra
[jsdoc]:http://usejsdoc.org
[jsdoc-x]:https://github.com/onury/jsdoc-x
[marked]:https://github.com/chjj/marked
[markdown]:https://daringfireball.net/projects/markdown
[dustjs]: http://www.dustjs.com
[dustjs-github]: https://github.com/linkedin/dustjs
[twemoji]:https://github.com/twitter/twemoji
[cc-by-4]:https://creativecommons.org/licenses/by/4.0
