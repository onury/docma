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

...like this:

[![Docma Screenshot][screenshot]][docma-doc]

### Installation

```sh
npm i docma
```

### Documentation

Read [Docma documentation][docma-doc], built with Docma, for a Docma demo... ;)

### CLI

```sh
npm i -g docma
docma [input ...] -o [output] # input files and output directory
docma -f [config.json] # json config
```

### Related Modules

- [grunt-docma][grunt-docma] — Grunt task for Docma.
- [jsdoc-x][jsdoc-x] — Parser for outputting a Javascript object from documented code via JSDoc's explain (-X) command.
- [marked][marked] — A full-featured markdown parser and compiler, written in JavaScript. Built for speed.
- [dustjs][dustjs-github] — Asynchronous Javascript templating for the browser and server.


[screenshot]:https://raw.github.com/onury/docma/master/docma-screen.jpg
[docma-doc]:https://onury.github.io/docma
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
