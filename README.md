# Docma

![npm](https://img.shields.io/npm/v/docma.svg)
![release](https://img.shields.io/github/release/onury/docma.svg)
![dependencies](https://david-dm.org/onury/docma.svg)
![license](http://img.shields.io/npm/l/docma.svg)
![maintained](https://img.shields.io/maintenance/yes/2017.svg)

> © 2017-2018, Onur Yıldırım (@onury). MIT License.

## v2 Branch — WIP

This is v2 branch, a work in progress. You can donwload/clone and use this version for experimental purposes until this becomes the master. For latest stable version, use the current master branch.

---

A powerful tool to easily generate beautiful HTML documentation from Javascript ([JSDoc][jsdoc]), [Markdown][markdown] and HTML files.

### Features

- Parse **JSDoc** documentation, **Markdown** and **HTML** files.
- Build a cool **SPA** (Single Page Application) from parsed files.
- Generate multiple/separate API documentations by grouping JS files.
- Path or Query-string based app routing.
- Non-opinionated engine, built-in template with cool opinions. :sunglasses:
- Supports custom templates.
- Works great with **GitHub Pages**.
- Build via API or CLI.
- Extremely configurable and debuggable.
- Well documented. :point_up:

...like this:

[![Docma Screenshot][screenshot]][docma-doc]

### Installation

```sh
npm i docma -g
```

### Command-Line Usage
```shell
    docma -c path/to/docma.config.json -d path/to/destination
```
See <a href="https://onury.io/docma/?content=docma-cli">Docma CLI reference</a>.

### Programmatic Usage

```js
    var Docma = require('docma');
    Docma.create()
        .build(config)
        .then(function (success) {
            console.log('Documentation is built successfully.');
        })
        .catch(function (error) {
            console.log(error);
        });
```
See <a href="https://onury.io/docma/?api=docma#Docma~BuildConfiguration">Build configuration</a>.

### Documentation

Read [**Docma documentation**][docma-doc], built with Docma, for a Docma demo... ;)

### Related Modules

- [jsdoc-x][jsdoc-x] — Parser for outputting a Javascript object from documented code via JSDoc's explain (-X) command.
- [marked][marked] — A full-featured markdown parser and compiler, written in JavaScript. Built for speed.
- [dustjs][dustjs-github] — Asynchronous Javascript templating for the browser and server.


[screenshot]:https://raw.github.com/onury/docma/master/docma-screen.jpg
[docma-doc]:https://onury.io/docma
[jsdoc]:http://usejsdoc.org
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
