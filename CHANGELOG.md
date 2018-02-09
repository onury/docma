# Docma Changelog

## v2.0.0 (NOT RELEASED YET - v2 branch)

_This is a WIP. New items will be added to the changes below._

### Docma (Builder)

#### Added
- Support for documenting code with **ES2015** syntax. (JSDoc and jsdoc-x dep. update.) Fixes [#18](https://github.com/onury/docma/issues/18) and [#21](https://github.com/onury/docma/issues/21).
- `assets` build configuration which provides ability to copy defined asset files/directories to build directory; so you can use/link to non-source, static asset files (such as images, PDFs, etc). See [build configuration][build-config]. Fixes [#29](https://github.com/onury/docma/issues/29).
- `config.markdown.bookmarks` option (`Boolean|String`) which automatically adds bookmark links to headings to content generated from markdown files. Default: `false`.
- Pre-build and post-build process support for Docma templates. See [Docma Templates documentation](https://onury.io/docma/?content=templates).
- Docma version compatibility check for Docma templates.
- Build statistics logs to console output. Now, displaying gzipped size of generated (docma-web) script, in addition to minified size; and more detailed summary of routes configured.

#### Fixed
- An issue where the builder would not check for duplicate route names with the same route type (and silently overwrite the generated content file).
- An issue where compiled template scripts were altered when full-debug is enabled.
- An issue with redirecting a page when the routing method is set to `"path"`.
- An issue with images in HTML (generated from markdown) that would overflow out of page. Now, limiting the image width to `100%` of parent container while keeping the aspect ratio.

#### Changed
- **BREAKING**: Due to several upgrades (such as `jsdom`), Docma v2+ requires Node.js v6 or newer.
- Improved markdown parser. Both `<h1 />` and `<h2 />` tags are now followed with a `<hr/>`, like on GitHub.
- Updated core dependencies to their latest versions.
- Migrated all code to ES2015.
- **BREAKING**: Docma templates are now npm modules. Docma still comes with an updated, built-in default template. But templates designed for Docma v1.x will not work with Docma v2.x.

#### Removed
- **For template authors only**: 
    + **BREAKING**: `docma.template.json` file that defines the template build and configuration options is dropped in favor of template module main (JS) file or `package.json`. There are several other improvements. See updated documentation on [Creating Docma Templates](http://onury.io/docma/?content=templates).
    + **BREAKING**: `compile` property of template configuration is removed. Now, scripts or less/sass files of the template should be pre-compiled. This is logical and speeds up the documentation build process of Docma.

### Docma CLI

#### Added
- Command `docma serve` for starting a static server for serving / testing the generated SPA.
- Command `docma template doctor` for diagnosing a Docma template. Useful for template authors.

#### Changed
- Dropped default configuration file **name** `docma.config.json` in favor of `docma.json` (shorter) and `.docma.json` if you need to hide it. This does not break anything, you can still use the former if you want.
- CLI will now auto-check for a `docma.json` (or `.docma.json`) file in the current working directory if `-c` option is omitted.

See [CLI documentation][docma-cli] for detailed information on updated CLI.

### Docma Web Core

#### Added
- Utility methods `docma.utils.getCodeTags()`, `docma.utils.getFormattedTypeList()`. Fixes [#33](https://github.com/onury/docma/issues/33). 
- Utility method `docma.utils.trimNewLines()`. This also has a dust filter `$tnl`.
- Each symbol in `docma.apis[name].documentation` instances, now has a `.$docmaLink` property.
- Utility methods `docma.utils.type()`, `docma.utils.getSymbolLink()`, `docma.utils.isEvent()`, `docma.utils.isGenerator()` and `docma.utils.isCallback()`.

#### Fixed
- Broken bookmark links due to URI encoded characters after hash (`#`). e.g. when navigated to `#MyClass%7EInnerObject` instead of `#MyClass~InnerObject`.
- An issue with `docma.utils.getLongName()`, occured after JSDoc core upgrade.

#### Changed
- `docma.utils.getSymbolByName()` signature is changed.
- Updated web-core dependencies.

### Docma Template API

#### Changed
- Docma templates are now npm modules. This is the initial Template API. See updated documentation on [Creating Docma Templates](http://onury.io/docma/?content=templates).

### Default Template - Zebra `v2.0.0`

#### Added
- Support for `@example <caption>Title</caption>`. Fixes [issue #14](https://github.com/onury/docma/issues/14). 
- Template option `toolbar` (`boolean`) that toggles a tiny toolbar below the search box, for switching symbol list outline or quick-filtering symbols by symbol-kind. Enabled by default.
- Template option `logo` (`String|Object`) specifies the URL of your logo. If you need separate logos for dark and light backgrounds set this to an object. i.e. `{ dark: String, light: String }`. Recommended size of a logo image is 120 x 120 pixels.
- Template option `typeLinks` (`Boolean|String`) specifies whether documented types should be auto-linked to `internal` paths (i.e. Docma route if type/object definition is within the generated documentation) or `external` URLs (MDN docs if it's a JS or Web-API built-in type/object such as `String`). Thanks to [@warpdesign](https://github.com/warpdesign) for the [idea](https://github.com/onury/docma/issues/30#issuecomment-353888926).
- Template option `animations` (`Boolean`) specifies whether animations are enabled for sidebar and listed symbols.
- Support for `@hideconstructor` tag. Fixes [issue #21](https://github.com/onury/docma/issues/21).
- Support for `@event`, `@emits` (and alias `@fires`) tags. Fixes [issue #35](https://github.com/onury/docma/issues/35).
- Support for `@generator` and `@yields` tags.
- Support for folding child members of parent symbols. Added `foldSymbols` (`boolean`) template option for initial state. Fixes [issue #26](https://github.com/onury/docma/issues/26). 
- `generator` badge for generator functions.

#### Fixed
- Some spacing issues with class descriptions. Empty tables are auto-removed now.
- A JSDoc issue where the constructor would be incorrectly marked as alias.
- An anchor/bookmark issue with multiple symbols having the same id.
- Sub-symbols that are listed in a table, will not wrap to new line anymore.
- An issue where the (heading) title would be hidden under the nav-bar when navigated via a local bookmark on a page, generated from a markdown file. Also improved spacing for headings.
- An issue where the page would not scroll/jump to the bookmark on initial load; when the URL has a location hash.
- Pre/code controls not to wrap content. Now, horizontally scrollable (like on GitHub).
- Sidebar scrollbars that were not fully visible.
- Some issues with navbar margins when sidebar is disabled.

#### Changed
- Default template finally has a name :) - Zebra.
- **BREAKING**: You need Docma v2+ for latest Zebra template to work.
- Improved symbol listing. Also; when search is active, outline is temporarily set to `"flat"` so that you see the parent of the symbol. When search box is cleaned, it's set back to the initial template setting. (e.g. `"tree"` if set).
- Improved `@example` outputs. If there are multiple examples for a symbol, they will be numbered now.
- Improved nested bullet list spacing, for better readability.
- Improved UI and responsive layout. On small screens, sidebar auto-collapses; top navbar turns into hamburger menu. Also, truely printable.
- Improved template option `.badges` (default: `true`) to also accept a string value for custom bullets instead of badges.
- Improved template option `.title` to accept HTML tags (i.e. you can place the title in `<a />` to link it).
- Various other improvements and clean up.

#### Removed
- **BREAKING**: icomoon selection of icons (and `ico-` prefix) in favor of FontAwsome (v5) and SVG icons support.
- Bootstrap and its dependencies (css and js) which dramatically reduces the size of the generated SPA. Also, cleaned up all unused styles.

## v1.5.3 `2017-12-21`

### Docma Web Core

#### Fixed
- A parser issue where carriage return (CR) of Windows newlines (CRLF) were removed. Fixes [#28](https://github.com/onury/docma/issues/28).

## v1.5.2 `2017-12-09`

### Docma Web Core

#### Fixed
- `$ is not a function` error on Windows. PR [#23](https://github.com/onury/docma/pull/23) by [@warpdesign](https://github.com/warpdesign).
- Some typos in documentation. PRs [#13](https://github.com/onury/docma/pull/13), [#17](https://github.com/onury/docma/pull/17).

> _**Note**: For this release, some dependencies (such as `jsdoc-x`, `jsdom`) are NOT updated on purpose 'cause they introduce breaking changes. In **v2** (WIP, to be released) these will be updated and many things will be improved._

## v1.5.1 `2017-03-11`

### Docma Web Core

#### Fixed
- `slice` error for non-string default value.

## v1.5.0 `2017-03-10`

### Docma (Builder)

#### Added
- `config.jsdoc.ignored:Boolean` option which specifies whether to include documentation symbols marked with `@ignore` tag.

### Docma Web Core

#### Fixed
- An issue where empty lines would be stripped out from `@example` content.

#### Changed
- Improved auto-indention for code in comments.
- Improved `$val` filter.

### Default Template

#### Added
- Template option `outline`, which determines the outline style of the sidebar symbols list. (`"flat"` or `"tree"`). See [documentation](https://onury.github.io/docma/?content=default-template) and [this example](https://onury.github.io/accesscontrol/?api=ac) for `outline` set to `"tree"`.
- Template option `symbolMeta` which specifies whether to add meta information at the end of each symbol documentation such as code file name and line number. Default is `false`.
- `static` badge for static members, `deprecated` badge for deprecated symbols.

#### Changed
- Improved sidebar design.
- `Type.<T>` is now represented as `Type<T>`.
- Default string values are now represented in quotes.

## v1.4.7 `2017-03-09`

### Docma (Builder)

#### Fixed
- An issue where build config `config.jsdoc.includePattern` would not be respected when filtering files.
- An issue where sorting would change when `config.jsdoc.hierarchy` option is enabled.

## v1.4.5 `2017-03-05`

### Docma (Builder)

#### Added
- Build config options: `config.jsdoc.allowUnknownTags`, `config.jsdoc.dictionaries`, `config.jsdoc.includePattern`, `config.jsdoc.excludePattern` (`jsdoc-x` feature).
- [JSDoc plugin](http://usejsdoc.org/about-plugins.html) support via the new `config.jsdoc.plugins` option (`jsdoc-x` feature).

## v1.4.0 `2017-02-13`

### Docma (Builder)

#### Fixed
- Incorrect routing when routing method is set to `"path"`.

#### Changed
- If `config.app.entrance` is not set in build configuration, it now defaults to `"api"`.
- If `config.app.server` is not set in build configuration, it now defaults to `"static"`. (`"static"` is similar to `"github"` which generates static HTML files.)

### Docma CLI

#### Changed
- Respecting debug option in config file. If no debug options are set in the command-line arguments (such as `--debug`, `--quite`, `--nomin`, `--jd-out`, `--verbose`, `--web-logs`); the bitwise debug value from the config file is used, if set.

### Docma Web Core

#### Fixed
- `.split()` error for `null` (404) routes.

#### Changed
- Updated web dependencies to latest versions.

### Default Template

#### Fixed
- A style issue where sidebar would not scroll all the way to the bottom in Firefox. Fixes [issue #8](https://github.com/onury/docma/issues/8).
#### Changed
- If `config.template.title` is omitted, `config.app.title` is used. (Defaults to `"Documentation"` if not set).

## v1.3.0 `2016-11-23`

### Docma (Builder)

#### Added
- Case-sensitive routing option. `config.app.routing` accepts either a `String` (`"query"` or `"path"` as before) or now, an `Object`. e.g. `{ type: "query", caseSensitive: true }`. This also fixes [issue #3](https://github.com/onury/docma/issues/3).

#### Changed
- Updated dependencies to their latest versions.
- Minor code revisions.

### Docma Web Core

#### Added
- Extended support for parsing back-ticks in documentation. Added triple back-tick support for multiline code blocks (<code>&#x60;&#x60;&#x60;</code>).

#### Changed
- Improved `docma.utils.normalizeTabs()` method. Deep indents in JSDoc comments/descriptions are also normalized.
- Improved support for `<pre></pre>` tags within JSDoc descriptions.

### Default Template

#### Fixed
- An issue where symbols with return type parameters (such as `Promise<Array>`) would not be escaped and parsed properly. Fixes [issue #4](https://github.com/onury/docma/issues/4).
- An issue where boolean symbol parameters' default values would not be parsed properly. Fixes [issue #5](https://github.com/onury/docma/issues/5).

## v1.2.0 `2016-10-31`

### Docma CLI

#### Added
- CLI (command-line interface). Supports `config`, `src`, `dest` and all `debug` options.

### Default Template

#### Changed
- Updated (one-dark) highlighting styles.

## v1.1.1 `2016-08-13`

### Default Template

#### Fixed
- An anchor/linking issue which prevented some browsers (such as Safari) to navigate properly.

## v1.1.0 `2016-08-12`

### Docma (Builder)

#### Fixed
- An issue where constructors would still show up in the documentation even though `@private` is set. Fixed by `jsdoc-x`.

#### Changed
- Updated dependencies to their latest versions.
- Minor revisions.

### Default Template

#### Fixed
- Fixed sidebar header/search position when sidebar is collapsed.

#### Changed
- An access badge is shown next to symbol name, if symbol has `private` or `protected` access.
    + Clean up.

## v1.0.3 `2016-06-27`

- **Docma** (Builder): Added HTML source file support. You can include HTML files together with JS and markdown files while building your documentation.
- **Default Template**: Removed YAML syntax highlighting support because of incorrect auto-detection. Opened an issue [here](https://github.com/isagalaev/highlight.js/issues/1213).

## v1.0.1 `2016-06-11`

- **Fixed** missing web components.
- David considers [marked][marked] as [insecure dependency][docma-david]. This is [already](https://nodesecurity.io/advisories/marked_content-injection) [reported](https://github.com/chjj/marked/pull/592).

## v1.0.0 `2016-06-11`

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

## v0.5.4 Pre-Release `2016-05-22`

- `docma.template.json` is no more copied over to the output.
- **Added** default template option `badges:Boolean`.

---

## v0.5.3 Pre-Release `2016-05-22`

- **Fixed** docma-web file paths.

---

## v0.5.2 Pre-Release `2016-05-20`

- **Updated** default template.
- **Updated** dependencies.
- Clean-up.

---

## v0.5.0 Pre-Release `2016-05-11`

- Initial (pre) release.
- **Added** ability to parse JSDoc documentation.
- **Created** default template.

[marked]:https://github.com/chjj/marked
[docma-david]:https://david-dm.org/onury/docma
[docma-cli]:https://onury.io/docma/?content=docma-cli
[build-config]:https://onury.io/docma/?api=docma#Docma~BuildConfiguration
