<p align="center"><img width="200" height="200" src="https://raw.github.com/onury/docma/v2/docma-logo.png" /></p>

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
[![npm](http://img.shields.io/npm/v/docma.svg)](https://www.npmjs.com/package/docma)
[![release](https://img.shields.io/github/release/onury/docma.svg)](https://github.com/onury/docma)
[![license](http://img.shields.io/npm/l/docma.svg)](https://github.com/onury/docma/blob/master/LICENSE)
[![downloads](https://img.shields.io/npm/dt/docma.svg)](https://www.npmjs.com/package/docma)
[![dependencies](https://david-dm.org/onury/docma.svg)](https://david-dm.org/onury/docma)
[![maintained](https://img.shields.io/maintenance/yes/2017.svg)](https://github.com/onury/docma/graphs/commit-activity)  

---

## v2 Branch — W.I.P.

_This is v2 branch, a work in progress. You can download/clone and use this version for experimental purposes until this becomes the master. See [CHANGELOG](CHANGELOG.md) for current progress._

_For latest stable version (v1.5.x), use the [current master branch](https://github.com/onury/docma)._

---

> © 2018, Onur Yıldırım ([@onury](https://github.com/onury)). MIT License.

A powerful tool to easily generate beautiful HTML documentation from Javascript ([JSDoc][jsdoc]), [Markdown][markdown] and HTML files.

### Features

- Parse **JSDoc** documentation, **Markdown** and **HTML** files.
- Build a cool **SPA** (Single Page Application) from parsed files.
- Generate multiple/separate API documentations by **grouping** JS files.
- Path or Query-string based app routing.
- Non-opinionated engine, **built-in** template with cool opinions. :sunglasses:
- Supports custom templates.
- Works great with **GitHub Pages**, Amazon **S3**, Nginx, Apache, etc...
- Build via **API** or **CLI**.
- Extremely configurable and debuggable.
- Well documented. :point_up:

...like this:

[![Docma Screenshot][screenshot]][docma-docs]

### Installation

```sh
npm i docma -g
```

### Building Documentation with CLI

You can use Docma CLI to build documentations directly from your console. Once you create the configuration (JSON) file, it's quite simple.

```sh
docma -c path/to/docma.json
```
You can even serve the docs locally and test.
```sh
docma serve path/to/docs
```

See 
 - [Docma CLI Reference][docma-cli]
 - [Build Configuration][docma-config]

### Building Documentation Programmatically

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

### Parsed Output

To investigate the parsed JSDoc output, enable the `debug` option that will create a JSON output(s) within the root of the destination directory. If you have a problem with the parsed documentation data, open an issue @ [jsdoc-x][jsdoc-x]. _(I'm the author.)_

For markdown output issues (that are not related with style), you can open an issue @ [marked][marked].

### Change-log

See [**CHANGELOG**][changelog].  
_Note: If you're upgrading from Docma v1.x to v2.x, there are some [**breaking changes**][changelog]._

### Documentation
Read [Docma documentation][docma-docs], built with Docma, for a Docma demo... :eyes:

### License

[**MIT**][license]. You don't have to include any copyright notice in your documentation output or templates but I'd appreciate if you let people know about this tool so we can read better documentations.

Emoji shortcuts used in source markdown files are parsed into [twemoji][twemoji]. Graphics and icons licensed under [CC-BY 4.0][cc-by-4].

### Related Modules

- [jsdoc-x][jsdoc-x] — Parser for outputting a Javascript object from documented code via JSDoc's explain (-X) command.
- [marked][marked] — A full-featured markdown parser and compiler, written in JavaScript. Built for speed.
- [dustjs][dustjs-github] — Asynchronous Javascript templating for the browser and server.


[license]:https://github.com/onury/docma/blob/master/LICENSE
[changelog]:https://github.com/onury/docma/blob/master/CHANGELOG.md
[screenshot]:https://raw.github.com/onury/docma/master/docma-screen.jpg
[docma-docs]:https://onury.io/docma
[docma-api]:https://onury.io/docma/?api=docma
[docma-cli]:https://onury.io/docma/?content=docma-cli
[docma-config]:https://onury.io/docma/?api=docma#Docma~BuildConfiguration
[docma-web-api]:https://github.com/onury/docma/blob/master/doc/docma.web.md
[zebra]:https://onury.io/docma/?content=zebra-template
[jsdoc]:http://usejsdoc.org
[jsdoc-x]:https://github.com/onury/jsdoc-x
[marked]:https://github.com/chjj/marked
[markdown]:https://daringfireball.net/projects/markdown
[dustjs]: http://www.dustjs.com
[dustjs-github]: https://github.com/linkedin/dustjs
[twemoji]:https://github.com/twitter/twemoji
[cc-by-4]:https://creativecommons.org/licenses/by/4.0
