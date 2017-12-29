## Docma Change-Log

### v2.0.0 (NOT RELEASED YET - v2 branch)

_This is a WIP. New items will be added to the changes below._

- <p><b>Breaking Changes</b>:</p>

    + Due to `jsdom` dependency upgrade, Docma v2+ requires Node.js v6 or newer.

- <p><b>Docma</b> (Builder):</p>

    + **Added** support for documenting code with **ES2015** syntax. (JSDoc and jsdoc-x dep. update.) Fixes [#18](https://github.com/onury/docma/issues/18).
    + **Added** ability to copy defined asset files/directories to build directory; so you can use/link to non-source, static asset files (such as images, PDFs, favicons, etc). See [build configuration][build-config]. Fixes [#29](https://github.com/onury/docma/issues/29).
    + **Fixed** an issue where images in HTML (generated from markdown) would overflow out of page. Now, limiting the image width to `100%` of parent container while keeping the aspect ratio.
    + **Fixed** an issue where compiled template scripts were altered when full-debug is enabled.
    + **Fixed** an issue with redirecting a page when the routing method is set to `"path"`.
    + **Improved** markdown parser. Both `<h1 />` and `<h2 />` tags are now followed with a `<hr/>`, like on GitHub.
    + **Added** `config.markdown.bookmarks` option (`Boolean|String`) which automatically adds bookmark links to headings. Default: `false`.
    + **Updated** builder/core dependencies to their latest versions.
    + Now, displaying gzipped size of generated (docma-web) script, in addition to minified size.
    + **Migrated** all code to ES2015.

- <p><b>Docma CLI</b>:</p>

    + **Added** static mock server for serving / testing the generated SPA. i.e. `docma serve [spa-path]`.  
    See [CLI documentation][docma-cli] for detailed information.
    + **Revision**: CLI will now auto-check for `docma.config.json` file in the current working directory if `-c` option is omitted.

- <p><b>Docma Web Core</b>:</p>

    + **Fixed** an issue where URI encoded characters after hash (`#`) would break the bookmark link. e.g. when navigated to `#MyClass%7EInnerObject` instead of `#MyClass~InnerObject`.
    + **Fixed** an issue with `docma.utils.getLongName()`, occured after JSDoc core upgrade.
    + **Added** utility methods `docma.utils.getCodeTags()`, `docma.utils.getFormattedTypeList()`. Fixes [#33](https://github.com/onury/docma/issues/33). 
    + **Updated** web-core dependencies.

### v1.5.3 (2017-12-21)

- <p><b>Docma Web Core</b>:</p>

    + **Fixed** a parser issue where carriage return (CR) of Windows newlines (CRLF) were removed. Fixes [#28](https://github.com/onury/docma/issues/28).

### v1.5.2 (2017-12-09)

- <p><b>Docma Web Core</b>:</p>

    + **Fixed** `$ is not a function` error on Windows. PR [#23](https://github.com/onury/docma/pull/23) by [@warpdesign](https://github.com/warpdesign).
    + **Fixed** some typos in documentation. PRs [#13](https://github.com/onury/docma/pull/13), [#17](https://github.com/onury/docma/pull/17).

> _**Note**: For this release, some dependencies (such as `jsdoc-x`, `jsdom`) are NOT updated on purpose 'cause they introduce breaking changes. In **v2** (WIP, to be released) these will be updated and many things will be improved._

### v1.5.1 (2017-03-11)

- <p><b>Docma Web Core</b>:</p>

    + **Fixed** `slice` error for non-string default value.

### v1.5.0 (2017-03-10)

- <p><b>Docma</b> (Builder):</p>

    + **Added** `config.jsdoc.ignored:Boolean` option which specifies whether to include documentation symbols marked with `@ignore` tag.

- <p><b>Docma Web Core</b>:</p>

    + **Fixed** an issue where empty lines would be stripped out from `@example` content.
    + **Improved** auto-indention for code in comments.
    + **Improved** `$val` filter.

- <p><b>Default Template</b>:</p>

    + **Improved** sidebar design.
    + **Added** template option `outline`, which determines the outline style of the sidebar symbols list. (`"flat"` or `"tree"`). See [documentation](https://onury.github.io/docma/?content=default-template) and [this example](https://onury.github.io/accesscontrol/?api=ac) for `outline` set to `"tree"`.
    + **Added** template option `symbolMeta` which specifies whether to add meta information at the end of each symbol documentation such as code file name and line number. Default is `false`.
    + **Revision**: `Type.<T>` is now represented as `Type<T>`.
    + **Revision**: Default string values are now represented in quotes.
    + **Added** `static` badge for static members, `deprecated` badge for deprecated symbols.

### v1.4.7 (2017-03-09)

- <p><b>Docma</b> (Builder):</p>

    + **Fixed** an issue where build config `config.jsdoc.includePattern` would not be respected when filtering files.
    + **Fixed** an issue where sorting would change when `config.jsdoc.hierarchy` option is enabled.

### v1.4.5 (2017-03-05)

- <p><b>Docma</b> (Builder):</p>

    + **Added** build config options: `config.jsdoc.allowUnknownTags`, `config.jsdoc.dictionaries`, `config.jsdoc.includePattern`, `config.jsdoc.excludePattern` (`jsdoc-x` feature).
    + **Added** [JSDoc plugin](http://usejsdoc.org/about-plugins.html) support via the new `config.jsdoc.plugins` option (`jsdoc-x` feature).

### v1.4.0 (2017-02-13)

- <p><b>Docma</b> (Builder):</p>

    + **Fixed** incorrect routing when routing method is set to `"path"`.
    + If `config.app.entrance` is not set in build configuration, it now defaults to `"api"`.
    + If `config.app.server` is not set in build configuration, it now defaults to `"static"`. (`"static"` is similar to `"github"` which generates static HTML files.)

- <p><b>Docma CLI</b>:</p>

    + Respecting debug option in config file. If no debug options are set in the command-line arguments (such as `--debug`, `--quite`, `--nomin`, `--jd-out`, `--verbose`, `--web-logs`); the bitwise debug value from the config file is used, if set.

- <p><b>Docma Web Core</b>:</p>

    + **Fixed** `.split()` error for `null` (404) routes.
    + **Updated** web dependencies to latest versions.

- <p><b>Default Template</b>:</p>

    + **Fixed** a style issue where sidebar would not scroll all the way to the bottom in Firefox. Fixes [issue #8](https://github.com/onury/docma/issues/8).
    + If `config.template.title` is omitted, `config.app.title` is used. (Defaults to `"Documentation"` if not set).

### v1.3.0 (2016-11-23)

- <p><b>Docma</b> (Builder):</p>

    + **Added** case-sensitive routing option. `config.app.routing` accepts either a `String` (`"query"` or `"path"` as before) or now, an `Object`. e.g. `{ type: "query", caseSensitive: true }`. This also fixes [issue #3](https://github.com/onury/docma/issues/3).
    + **Updated** dependencies to their latest versions.
    + Minor code revisions.

- <p><b>Docma Web Core</b>:</p>

    + **Extended** support for parsing back-ticks in documentation. Added triple back-tick support for multiline code blocks (<code>&#x60;&#x60;&#x60;</code>).
    + **Improved** `docma.utils.normalizeTabs()` method. Deep indents in JSDoc comments/descriptions are also normalized.
    + **Improved** support for `<pre></pre>` tags within JSDoc descriptions.

- <p><b>Default Template</b>:</p>

    + **Fixed** an issue where symbols with return type parameters (such as `Promise<Array>`) would not be escaped and parsed properly. Fixes [issue #4](https://github.com/onury/docma/issues/4).
    + **Fixed** an issue where boolean symbol parameters' default values would not be parsed properly. Fixes [issue #5](https://github.com/onury/docma/issues/5).

### v1.2.0 (2016-10-31)

- <p><b>Docma CLI</b>:</p>

    + **Added** CLI (command-line interface). Supports `config`, `src`, `dest` and all `debug` options.

- <p><b>Default Template</b>:</p>

    + **Updated** (one-dark) highlighting styles.

### v1.1.1 (2016-08-13)

- **Fixed** an anchor/linking issue which prevented some browsers (such as Safari) to navigate properly.

### v1.1.0 (2016-08-12)

- <p><b>Docma</b> (Builder):</p>

    + **Fixed** an issue where constructors would still show up in the documentation even though `@private` is set. Fixed by `jsdoc-x`.
    + **Updated** dependencies to their latest versions.
    + Minor revisions.

- <p><b>Default Template</b>:</p>

    + **Fixed** sidebar header/search position when sidebar is collapsed.
    + An access badge is shown next to symbol name, if symbol has `private` or `protected` access.
    + Clean up.

### v1.0.3 (2016-06-27)

- **Docma** (Builder): Added HTML source file support. You can include HTML files together with JS and markdown files while building your documentation.
- **Default Template**: Removed YAML syntax highlighting support because of incorrect auto-detection. Opened an issue [here](https://github.com/isagalaev/highlight.js/issues/1213).

### v1.0.1 (2016-06-11)

- **Fixed** missing web components.
- David considers [marked][marked] as [insecure dependency][docma-david]. This is [already](https://nodesecurity.io/advisories/marked_content-injection) [reported](https://github.com/chjj/marked/pull/592).

### v1.0.0 (2016-06-11)

- <p><b>Docma</b> (Builder):</p>

    + **Added** ability to convert markdown files to HTML. See documentation.
    + **Added** `.markdown:Object` build configuration options. (Same as `marked` module options).
    + **Added** `.markdown.tasks:Boolean` option for parsing GitHub-like markdown tasks.
    + **Added** emoji (twemoji) support for converted markdown files. Added `.markdown.emoji:Boolean` option.
    + **Improved** GFM parsing.  
    + **Added** `.app.server` build option that defines the server/host type for generating server config file(s) for the SPA. e.g., setting to `"apache"` generates an `.htaccess` file within the root of the generated output. Supports `"apache"` and `"github"`.
    + **Added** `.app.base:String` build option that sets the base path for the SPA.
    + **Added** `.app.entrance:String` build option that sets the initial content to be displayed.
    + **Added** `.debug:Boolean` build option.
    + **Dropped** `.dump` config option in favor of `.debug` option.
    + **Moved** `.template.document` configuration to `.app`.
    + **Added** ability to group `.js` files into multiple, separate documentation. See `.src` build option.
    + **Added** ability to rename routes for generated markdown files. See `.src` build option.
    + **Added** negated glob support (that excludes the paths) for the `src` build option.

- <p><b>Docma Web Core</b>:</p>

    + **Added** client-side routing support for the SPA with paths (e.g. `/api`) or query-strings (e.g. `?content=api`). Configured via `.app.routing:String` option. Set to `"path"` or `"query"`. Uses page.js internally.
    + **Implemented** `EventEmitter`.
    + **BREAKING CHANGE**: Dropped `docma.ready()` method. Use `docma.on('ready', listener)` that's only triggered once on every page load or `docma.on('render', listener)` triggered when each content is rendered. Also see `docma.on('route', listener)` triggered when SPA route is changed.
    + Docma web initializing errors are no longer passed to event listeners. They are now immediately thrown.
    + **Revision**: `docma.app:Object` and `docma.template.main:String` are exposed to the SPA.
    + **Revision**: The `docma` object accessible by the SPA is now `Object.freeze`d.
    + **Fixed** bookmark scrolling.
    + **Added** new methods to `docma.utils` such as `getCodeName(symbol)`, `getFullName(symbol)`, etc...
    + **Revision**: If `debug >= 3`, web app will also output logs.

- <p><b>Default Template</b>:</p>

    + **Improved** layout for HTML files converted from markdown.
    + **Fixed** documentation of `@property` JSDoc tags.
    + **Updated** default template structure.
    + **Added** more supported languages for syntax highlighting (Javascript, JSON, CSS, HTML, XML, CoffeeScript, TypeScript, Bash, HTTP, Markdown, Dust and YAML).
    + **Added** ability to auto-detect language for syntax highlighting.
    + **Added** ability to style tables in HTML generated from markdown.
    + **Added** ability to style code blocks in HTML generated from markdown.
    + **Improved** font display for code and summary/descriptions.
    + **Improved** UX by auto-adjusting font size of sidebar items to fit the sidebar, if they exceed the width.
    + **Fixed** incorrect symbols sort issue when symbol(s) have aliases.
    + **Improved** various API documentation styles.

- <p>Other:</p>

    + **(Dev)** Manage web-component dependency packages via Bower.
    + **Updated** project structure.
    + Various minor revisions and clean-up.
    + **Improved** Docma source code documentation.

---

### v0.5.4 Pre-Release (2016-05-22)

- `docma.template.json` is no more copied over to the output.
- **Added** default template option `badges:Boolean`.

---

### v0.5.3 Pre-Release (2016-05-22)

- **Fixed** docma-web file paths.

---

### v0.5.2 Pre-Release (2016-05-20)

- **Updated** default template.
- **Updated** dependencies.
- Clean-up.

---

### v0.5.0 Pre-Release (2016-05-11)

- Initial (pre) release.
- **Added** ability to parse JSDoc documentation.
- **Created** default template.

[marked]:https://github.com/chjj/marked
[docma-david]:https://david-dm.org/onury/docma
[docma-cli]:https://onury.io/docma/?content=docma-cli
[build-config]:https://onury.io/docma/?api=docma#Docma~BuildConfiguration
