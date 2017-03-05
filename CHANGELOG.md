## Docma Change-Log

#### **v1.4.5** Release (2017-03-05)

- <p><b>Docma</b> (Builder):</p>
    + Added build config options: `jsdoc.allowUnknownTags`, `jsdoc.dictionaries`, `jsdoc.includePattern`, `jsdoc.excludePattern` (`jsdoc-x` feature).
    + Added [JSDoc plugin](http://usejsdoc.org/about-plugins.html) support via the new `jsdoc.plugins` option (`jsdoc-x` feature).

#### **v1.4.0** Release (2017-02-13)

- <p><b>Docma</b> (Builder):</p>
    + Fixed incorrect routing when routing method is set to `"path"`.
    + If `app.entrance` is not set in build configuration, it now defaults to `"api"`.
    + If `app.server` is not set in build configuration, it now defaults to `"static"`. (`"static"` is similar to `"github"` which generates static HTML files.)

- <p><b>Docma CLI</b>:</p>
    + Respecting debug option in config file. If no debug options are set in the command-line arguments (such as `--debug`, `--quite`, `--nomin`, `--jd-out`, `--verbose`, `--web-logs`); the bitwise debug value from the config file is used, if set.

- <p><b>Docma Web Core</b>:</p>
    + Fixed `.split()` error for `null` (404) routes.
    + Updated web dependencies to latest versions.

- <p><b>Default Template</b>:</p>
    + Fixed a style issue where sidebar would not scroll all the way to the bottom in Firefox. Fixes [issue #8](https://github.com/onury/docma/issues/8).
    + If `template.title` is omitted, `app.title` is used. (Defaults to `"Documentation"` if not set).

#### **v1.3.0** Release (2016-11-23)

- <p><b>Docma</b> (Builder):</p>
    + Added case-sensitive routing option. `buildConfig.app.routing` accepts either a `String` (`"query"` or `"path"` as before) or now, an `Object`. e.g. `{ type: "query", caseSensitive: true }`. This also fixes [issue #3](https://github.com/onury/docma/issues/3).
    + Updated dependencies to their latest versions.
    + Minor code revisions.

- <p><b>Docma Web Core</b>:</p>
    + Extended support for parsing back-ticks in documentation. Added triple back-tick support for multiline code blocks (<code>&#x60;&#x60;&#x60;</code>).
    + Improved `docma.utils.normalizeTabs()` method. Deep indents in JSDoc comments/descriptions are also normalized.
    + Better `<pre></pre>` support within JSDoc descriptions.

- <p><b>Default Template</b>:</p>
    + Symbols with return type parameters (such as `Promise<Array>`) are now escaped and parsed properly. Fixes [issue #4](https://github.com/onury/docma/issues/4).
    + Boolean symbol parameters' default values are now parsed properly. Fixes [issue #5](https://github.com/onury/docma/issues/5).

#### **v1.2.0** Release (2016-10-31)

- <p><b>Docma CLI</b>:</p>
    + Added CLI (command-line interface). Supports `config`, `src`, `dest` and all `debug` options.

- <p><b>Default Template</b>:</p>
    + Updated (one-dark) highlighting styles.

#### **v1.1.1** Release (2016-08-13)

- Fixed an anchor/linking issue which prevented some browsers (such as Safari) to navigate properly.

#### **v1.1.0** Release (2016-08-12)

- <p><b>Docma</b> (Builder):</p>
    + Constructors would still show up in the documentation even though `@private` is set. Fixed by `jsdoc-x`.
    + Updated dependencies to their latest versions.
    + Minor revisions.

- <p><b>Default Template</b>:</p>
    + Fixed sidebar header/search position when sidebar is collapsed.
    + An access badge is shown next to symbol name, if symbol has `private` or `protected` access.
    + Clean up.

#### **v1.0.3** Release (2016-06-27)

- **Docma** (Builder): Added HTML source file support. You can include HTML files together with JS and markdown files while building your documentation.
- **Default Template**: Removed YAML syntax highlighting support because of incorrect auto-detection. Opened an issue [here](https://github.com/isagalaev/highlight.js/issues/1213).

#### **v1.0.1** Release (2016-06-11)

- Fixed missing web components.
- David considers [marked][marked] as [insecure dependency][docma-david]. This is [already](https://nodesecurity.io/advisories/marked_content-injection) [reported](https://github.com/chjj/marked/pull/592).

#### **v1.0.0** Release (2016-06-11)

- <p><b>Docma</b> (Builder):</p>
    + Convert markdown files to HTML. See documentation.
    + Added `.markdown:Object` build configuration options. (Same as `marked` module options).
    + Added `.markdown.tasks:Boolean` option for parsing GitHub-like markdown tasks.
    + Added emoji (twemoji) support for converted markdown files. Added `.markdown.emoji:Boolean` option.
    + Improved GFM parsing.  
    + Added `.app.server` build option that defines the server/host type for generating server config file(s) for the SPA. e.g., setting to `"apache"` generates an `.htaccess` file within the root of the generated output. Supports `"apache"` and `"github"`.
    + Added `.app.base:String` build option that sets the base path for the SPA.
    + Added `.app.entrance:String` build option that sets the initial content to be displayed.
    + Added `.debug:Boolean` build option.
    + Dropped `.dump` config option in favor of `.debug` option.
    + Moved `.template.document` configuration to `.app`.
    + Group `.js` files into multiple, separate documentation. See `.src` build option.
    + Rename routes generated markdown files (names). See `.src` build option.
    + Added negated glob support (that excludes the paths) for the `src` build option.

- <p><b>Docma Web Core</b>:</p>
    + Added client-side routing support for the SPA with paths (e.g. `/api`) or query-strings (e.g. `?content=api`). Configured via `.app.routing:String` option. Set to `"path"` or `"query"`. Uses page.js internally.
    + Implemented `EventEmitter`.
    + _BREAKING CHANGE_: Dropped `docma.ready()` method. Use `docma.on('ready', listener)` that's only triggered once on every page load or `docma.on('render', listener)` triggered when each content is rendered. Also see `docma.on('route', listener)` triggered when SPA route is changed.
    + Docma web initializing errors are no longer passed to event listeners. They are now immediately thrown.
    + `docma.app:Object` and `docma.template.main:String` are exposed to the SPA.
    + The `docma` object accessible by the SPA is now `Object.freeze`d.
    + Fixed bookmark scrolling.
    + Added new methods to `docma.utils` such as `getCodeName(symbol)`, `getFullName(symbol)`, etc...
    + If `debug >= 3`, web app will also output logs.

- <p><b>Default Template</b>:</p>
    + Better layout for HTML files converted from markdown.
    + Fixed documentation of `@property` JSDoc tags.
    + Updated default template structure.
    + More supported languages for syntax highlighting (Javascript, JSON, CSS, HTML, XML, CoffeeScript, TypeScript, Bash, HTTP, Markdown, Dust and YAML).
    + Auto-language detection is enabled for syntax highlighting.
    + Style tables in HTML generated from markdown.
    + Style code blocks in HTML generated from markdown.
    + Better font display for code and summary/descriptions.
    + Font size of sidebar items are auto-adjusted to fit the sidebar, if they exceed the width.
    + Fixed incorrect symbols sort issue when symbol(s) have aliases.
    + Improved various API documentation styles.

- <p>Other:</p>
    + Manage web-component dependency packages via Bower.
    + Updated project structure.
    + Various minor revisions and clean-up.
    + Improved Docma source code documentation.

---

#### **v0.5.4** Pre-Release (2016-05-22)

- `docma.template.json` is no more copied over to the output.
- Added default template option `badges:Boolean`.

---

#### **v0.5.3** Pre-Release (2016-05-22)

- Fixed docma-web file paths.

---

#### **v0.5.2** Pre-Release (2016-05-20)

- Updated default template.
- Updated dependencies.
- Clean-up.

---

#### **v0.5.0** Pre-Release (2016-05-11)

- Initial (pre) release.
- Parse JSDoc documentation.
- Created default template.

[marked]:https://github.com/chjj/marked
[docma-david]:https://david-dm.org/onury/docma
