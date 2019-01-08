# Docma Changelog

All notable changes to this project will be documented in this file. The format is based on [Keep a Changelog](http://keepachangelog.com/en/1.0.0/) and this project adheres to [Semantic Versioning](http://semver.org).

## [3.2.2](https://github.com/onury/docma/compare/v3.1.0...v3.2.2) (2019-01-08)

### Fixed
- An issue where enumeration value would be incorrectly displayed as `undefined` in docs parsed from ES5 code.
- An issue where `jsdoc.predicate` (or `jsdoc.filter`) option would not be taken into account.
- An issue where favicon would not be copied over to the output dir.
- (Zebra Template) An issue where some special characters within the location hash would cause an error.
- `Invalid assignment` error due to ES2015 syntax.

### Added
- Support for handling notation with multiple sub-types. e.g. `Map<String, Object>`. (PR [#65](https://github.com/onury/docma/pull/65) by [@MaienM](https://github.com/MaienM))

### Changed
- Improved / cleaner symbol names and long names. This also fixes a JSDoc bug that unnecessarily and incorrectly wraps the last level of the notation in quotes and brackets.
- Updated dependencies to their latest versions.

## [3.1.0](https://github.com/onury/docma/compare/v3.0.0...v3.1.0) (2018-12-04)

### Fixed
- An issue with `"path"` routing which led to 404 page, occurred when a (deep) route was refreshed or loaded directly. (Due to a bug in core dependency.) Fixes [#62](https://github.com/onury/docma/issues/62).
- An issue where a (harmless) `TypeError` was thrown when `debug` is enabled.
- An issue with `$docmaLink` due to missing trailing slash, when routing method is `"path"`.

### Added
- (Zebra Template) Added JSDoc `@default` tag support for symbols. Fixes [#60](https://github.com/onury/docma/issues/60).
- (Zebra Template) Added option `contentView.faLibs` that defines FontAwesome libraries to be included, such as `solid`, `regular`, `brands`. Set to `null` to completely exclude FontAwesome from the output. See Zebra documentation. Fixes [#63](https://github.com/onury/docma/issues/63).
- (Zebra Template) Added option `contentView.faVersion` that defines FontAwesome icon library version to be included. 

### Changed
- Improved SPA route handling.
- Updated dependencies to latest versions.

## [3.0.0](https://github.com/onury/docma/compare/v2.1.0...v3.0.0) (2018-11-18)

#### Changed
- **BREAKING**: Dropped support for Node.js versions 6 & 7. Requires Node.js v8 and later. This change is due to updates to the core dependencies such as `fs-extra`, `jsdoc-x` and `jsdom`.
- Improved path/query routing.
- **BREAKING**: Linking logic has [some changes](https://onury.io/docma/faq/#linking).
- (Zebra template) Improved support for constant symbols.

#### Added
- Ability to force parser type on defined files/paths; by appending a suffix. For Markdown, append `:md` or `:markdown`. For HTML, append `:htm` or `html`. For example, `LICENSE:md` will force-parse `LICENSE` file as markdown. `file.partial:html` will force-parse `file.partial` as HTML. 
- Ability to create deeper paths for named groups/routes. e.g. `mylib/latest`
- Support for favicon. Set `app.favicon` to your ICO file's local path.
- Support for collapsable markdown (i.e. with `<details>` and `<summary>` tags). This is great for generating styled collapsable lists (such as F.A.Q.) from your markdown files. If a bookmark (id) is passed in the location hash, that item will auto-expand. See [Docma F.A.Q.][faq] for an example. *Note that Edge [does not support](https://developer.microsoft.com/en-us/microsoft-edge/platform/status/detailssummary/) details/summary tags yet. All other modern browsers have support.*
- Ability to hide or remove specific, partial content from Docma output. For example if you want some **part** of your README to be visible in GitHub repo but not in your Docma generated documentation... See [this](https://onury.io/docma/faq#hide-remove) for details.
- New CLI option (`-b` or `--base`) for `docma serve` command to override/set the base path.
- (Zebra Template) Added support for collapsable markdown (i.e. with `<details>` and `<summary>` tags).

#### Fixed
- An issue where documentation build would fail due to a symbol name being a non-string value. Fixes [#54](https://github.com/onury/docma/issues/54).
- An issue where the web app would throw `Uncaught TypeError` when invalid JSDoc type specified for `@returns`. Fixes [#55](https://github.com/onury/docma/issues/55).
- Fixed ["Reverse Tabnabbing" vulnerability][tabnabbing] with generated documentation links. (This is also fixed for Zebra template.)
- An issue where `base` tag would not be added to the head of main document.
- An issue where Docma would not set default `app.base` path to `/` as expected. Fixes [#59](https://github.com/onury/docma/issues/59).
- An issue where symbol link would be parsed as absolute path rather than relative. Fixes [#50](https://github.com/onury/docma/issues/50).
- (Zebra template) Fixed an issue where tags such as `@constant` and `@module` would cause an `Uncaught TypeError`. Fixes [#41](https://github.com/onury/docma/issues/50) and [#45](https://github.com/onury/docma/issues/45).


## [2.1.0](https://github.com/onury/docma/compare/v2.0.0...v2.1.0) (2018-04-29)

### Docma CLI
> Thanks to [@feugy](https://github.com/feugy) for this PR.

#### Added
- `serve` command now takes `conf.app.base` parameter into consideration, and will redirect `http://localhost:9000/` to it.

#### Fixed
- `serve` command can handle `conf.app.dest` relative path, and resolves them against current working directory. 
- A file name issue that produces `cannot find module` error in case-sensitive systems. Fixes [#38](https://github.com/onury/docma/issues/38).

#### Changed
- Renamed the `--quite` option to `--quiet`. Alias `-q` remains the same.

### Default Template - Zebra `v2.1.0`

#### Added
- Partial support for TypeScript-style type notation. e.g. `Promise<Number>` or `Number[]`, etc...

#### Fixed
- An issue where deeper levels of tree nodes were not properly aligned, when `sidebar.outline` is set to `"tree"`.
- An issue where some symbol names were unnecessarily scroll-animated on hover. Firefox was affected.
- An issue where multiple return types were listed out of style.

#### Changed
- When `sidebar.itemsOverflow` is set to `"crop"` (default); symbol names are faded-out on their edges, instead of using ellipsis (which behaves differently on browsers).

## [2.0.0](https://github.com/onury/docma/compare/v1.5.3...v2.0.0) (2018-04-12)
> _This is a big release with some breaking changes._  
> _Please read this changelog thoroughly before updating your Docma configuration._

### Docma (Builder)

#### Added
- Support for documenting code with **ES2015** syntax. (JSDoc and jsdoc-x dep. update.) Fixes [#18](https://github.com/onury/docma/issues/18) and [#21](https://github.com/onury/docma/issues/21).
- `assets` build configuration which provides ability to copy defined asset files/directories to build directory; so you can use/link to non-source, static asset files (such as images, PDFs, etc). See [build configuration][build-config]. Fixes [#29](https://github.com/onury/docma/issues/29).
- Pre-build and post-build process support for Docma templates. See [Docma Templates documentation](https://onury.io/docma/templates/guide).
- `markdown.xhtml` option for build configuration.
- Docma version compatibility check for Docma templates.
- `clean` option that specifies whether to empty destination directory before the build. Default is `false`.
- Build statistics logs to console output. Now, displaying gzipped size of generated (docma-web) script, in addition to minified size; and more detailed summary of routes configured.

#### Fixed
- An issue where the builder would not check for duplicate route names with the same route type (and silently overwrite the generated content file).
- An issue where compiled template scripts were altered when full-debug is enabled.
- An issue with redirecting a page when the routing method is set to `"path"`.
- An issue with images in HTML (generated from markdown) that would overflow out of page. Now, limiting the image width to `100%` of parent container while keeping the aspect ratio.
- An issue with generated heading ids when building docs from markdown. Other HTML tags contained within the heading were not ignored, resulting in too complex ids (bookmarks).

#### Changed
- **BREAKING**: Due to several upgrades (such as `jsdom`), Docma v2+ requires Node.js v6 or newer.
- Greatly improved the symbol sorting logic ([jsdoc-x][jsdoc-x]). You can now sort by `scope`, by `access` type, by `kind`, `grouped` or `alphabetic` (default). See `jsdoc.sort` option in [build configuration][build-config].
- The destination directory is not auto-cleaned anymore before the build. Use `clean` option for the old behavior. Fixes [#34](https://github.com/onury/docma/issues/34).
- Improved markdown parser. Both `<h1 />` and `<h2 />` tags are now followed with a `<hr/>`, like on GitHub.
- Updated core dependencies to their latest versions.
- Migrated all code to ES2015.
- **BREAKING**: Docma templates are now node modules. Docma still comes with an updated, built-in default template (Zebra). But templates designed for Docma v1.x will not work with Docma v2.x.

#### Removed
- **For template authors only**: 
    + **BREAKING**: `docma.template.json` file that defines the template build and configuration options is dropped in favor of template module main (JS) file or `package.json`. There are several other improvements. See updated documentation on [Creating Docma Templates](http://onury.io/docma/templates/guide).
    + **BREAKING**: `compile` property of template configuration is removed. Now, scripts or less/sass files of the template should be pre-compiled. This is logical and speeds up the documentation build process of Docma.

### Docma CLI

#### Added
- Option `--clean` to empty destination directory before the build.
- Command `docma serve` for starting a static server for serving / testing the generated SPA.
- Command `docma template init` for initializing a new Docma template project.
- Command `docma template doctor` for diagnosing a Docma template. Useful for template authors.

#### Changed
- Dropped default configuration file **name** `docma.config.json` in favor of `docma.json` (shorter) and `.docma.json` if you need to hide it. This does not break anything, you can still use the former if you want.
- CLI will now auto-check for a `docma.json` (or `.docma.json`) file in the current working directory if `-c` option is omitted.
- Options `-v` (lowercase) and `-V` (uppercase) are swapped. `-v` gets the Docma version now (alias `--version`). And `-V` is `--verbose`.

See [CLI documentation][cli] for detailed information on updated CLI.

### Docma Web Core

#### Added
- Event `navigate` that's triggered either when route is changed or on hash-change.
- Each symbol in `docma.apis[name].documentation` instances, now has a `.$docmaLink` property.
- New utility methods to `DocmaWeb.Utils`: `.type()`, `.getSymbolLink()`, `.getLevels()`, `.getParentName()`, `.getParent()`, `.isPackagePrivate()`, `.isEvent()`, `.isGenerator()`, `.isCallback()`, `.isConstant()`, `.isInterface()`, `.isExternal()` and `.isMixin()`.
- Utility methods `.getCodeTags()`, `.getFormattedTypeList()`. Fixes [#33](https://github.com/onury/docma/issues/33). 
- Utility method `.trimNewLines()`. This also has a dust filter `$tnl`.

#### Fixed
- Broken bookmark links due to URI encoded characters after hash (`#`). e.g. when navigated to `#MyClass%7EInnerObject` instead of `#MyClass~InnerObject`.
- An issue with `DocmaWeb.Utils.getLongName()`, occured after JSDoc core upgrade.
- `currentRoute` parameter of the `route` event. Passing `null` instead of empty route object when route does not exist.
- An issue with `DocmaWeb.Utils.isClass()` utility method where `meta.code.type` is not set to `ClassDeclaration`.
- `DocmaWeb.Utils.isProperty()` utility method. It'll now return `false` if symbol is a method/function. This also affects the following methods: `.isStaticProperty()`, `.isInstanceProperty()`.

#### Changed
- **BREAKING**: Docma utility methods are moved to `DocmaWeb.Utils` static namespace (formerly under `docma.utils`).
- `DocmaWeb.Utils.getSymbolByName()` signature is changed.
- Updated web-core dependencies.

### Docma Template API

#### Changed
- Docma templates are now node modules. This is the initial Template API. See updated documentation on [Creating Docma Templates](http://onury.io/docma/templates/guide).

### Default Template - Zebra `v2.0.0`

#### Added
- Support for `@example <caption>Title</caption>`. Fixes [issue #14](https://github.com/onury/docma/issues/14). 
- Support for `@hideconstructor` tag. Fixes [issue #21](https://github.com/onury/docma/issues/21).
- Support for `@event`, `@emits` (and alias `@fires`) tags. Fixes [issue #35](https://github.com/onury/docma/issues/35).
- Support for `@generator` and `@yields` tags.
- Support for rest parameters (i.e. `...args`).
- Support for `@since` tag.
- Support for folding child members of parent symbols. Added template option `sidebar.itemsFolded` (`boolean`) for setting the initial state. Fixes [issue #26](https://github.com/onury/docma/issues/26). 
- Template option `sidebar.toolbar` (`boolean`) that toggles a tiny toolbar below the search box, for switching symbol list outline or quick-filtering symbols by symbol-kind. Enabled by default.
- Template option `logo` (`String|Object`) specifies the URL of your logo. If you need separate logos for dark and light backgrounds set this to an object. i.e. `{ dark: String, light: String }`. Recommended size of a logo image is 120 x 120 pixels.
- Template option `symbols.autoLink` (`Boolean|String`) specifies whether documented types should be auto-linked to `internal` paths (i.e. Docma route if type/object definition is within the generated documentation) or `external` URLs (MDN docs if it's a JS or Web-API built-in type/object such as `String`); or both. Thanks to [@warpdesign](https://github.com/warpdesign) for the [idea](https://github.com/onury/docma/issues/30#issuecomment-353888926).
- Template options `symbols.params`, `symbols.props` and `symbols.enums` all taking a string value, either `"list"` (default) or `"table"`; defining the layout style for parameters, properties and enumerations. If you like the design in previous versions, set these to `"table"`.
- Template option `sidebar.animations` and `navbar.animations` (`Boolean`) specifies whether CSS transitions and animations should be enabled for navbar, sidebar and listed symbols.
- Template option `contentView.bookmarks` option (`Boolean|String`) which automatically adds bookmark links to headings to content generated from markdown files. Default: `false`.
- `generator` badge for generator functions.

#### Fixed
- Some spacing issues with class descriptions. Empty tables are auto-removed now.
- A JSDoc issue where the constructor would be incorrectly marked as alias.
- An anchor/bookmark issue with multiple symbols having the same id.
- Sub-symbols that are listed in a table, will not wrap to new line anymore.
- An issue where the (heading) title would be hidden under the nav-bar when navigated via a local bookmark on a page, generated from a markdown file. Also improved spacing for headings.
- An issue where the page would not scroll/jump to the bookmark on initial load; when the URL has a location hash.
- Pre/code elements not to wrap content. Now, horizontally scrollable (like on GitHub).
- An issue with sidebar symbol names auto-resizing incorrectly in some cases. Also improved performance by caching font-size for each item.
- hidden meta issue. If symbol had no class description, tags such as `@author`, `@version` and `@copyright` would not be shown.
- Sidebar scrollbars that were not fully visible.
- Some issues with navbar margins when sidebar is disabled.
- Sidebar and navbar title so that they allow longer strings without breaking.

#### Changed
- Default template finally has a name :) - Zebra.
- **BREAKING**: You need Docma v2+ for latest Zebra template to work.
- Improved symbol listing styles and performance. Using CSS transitions instead of JS manipulation. Also; when search is active, outline is temporarily set to `"flat"` so that you see the parent of the symbol. When search box is cleaned, it's set back to the initial template setting. (e.g. `"tree"` if set).
- Improved `@example` outputs. If there are multiple examples for a symbol, they will be numbered now.
- Improved nested bullet list spacing, for better readability.
- Improved UI and responsive layout. On small screens, sidebar auto-collapses; top navbar turns into hamburger menu. Also, truly printable.
- Improved template option `.badges` (default: `true`) to also accept a string value for custom bullets instead of badges.
- Improved template option `.title` to also accept an object `{ label:String, href:String }` so you can link it.
- Various other improvements and clean up.

#### Deprecated
- The template options object structure is changed and a couple of options are renamed. Old structure is still supported and it won't break anything but this support will be removed in future versions. See documentation for the new & improved structure.

#### Removed
- **BREAKING**: icomoon selection of icons (and `ico-` CSS prefix) in favor of FontAwsome (v5) and SVG icons support.
- Bootstrap and its dependencies (css and js). Also, cleaned up all unused styles.

<br />

## [1.5.3](https://github.com/onury/docma/compare/v1.5.2...v1.5.3) (2017-12-21)

### Docma Web Core

#### Fixed
- A parser issue where carriage return (CR) of Windows newlines (CRLF) were removed. Fixes [#28](https://github.com/onury/docma/issues/28).

<br />

## [1.5.2](https://github.com/onury/docma/compare/v1.5.1...v1.5.2) (2017-12-09)

### Docma Web Core

#### Fixed
- `$ is not a function` error on Windows. PR [#23](https://github.com/onury/docma/pull/23) by [@warpdesign](https://github.com/warpdesign).
- Some typos in documentation. PRs [#13](https://github.com/onury/docma/pull/13), [#17](https://github.com/onury/docma/pull/17).

> _**Note**: For this release, some dependencies (such as `jsdoc-x`, `jsdom`) are NOT updated on purpose 'cause they introduce breaking changes. In **v2** (WIP, to be released) these will be updated and many things will be improved._

<br />

## [1.5.1](https://github.com/onury/docma/compare/v1.5.0...v1.5.1) (2017-03-11)

### Docma Web Core

#### Fixed
- `slice` error for non-string default value.

<br />

## [1.5.0](https://github.com/onury/docma/compare/v1.4.7...v1.5.0) (2017-03-10)

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
- Template option `outline`, which determines the outline style of the sidebar symbols list. (`"flat"` or `"tree"`). See [documentation](https://onury.github.io/docma/templates/zebra) and [this example](https://onury.github.io/accesscontrol/?api=ac) for `outline` set to `"tree"`.
- Template option `symbolMeta` which specifies whether to add meta information at the end of each symbol documentation such as code file name and line number. Default is `false`.
- `static` badge for static members, `deprecated` badge for deprecated symbols.

#### Changed
- Improved sidebar design.
- `Type.<T>` is now represented as `Type<T>`.
- Default string values are now represented in quotes.

<br />

## [1.4.7](https://github.com/onury/docma/compare/v1.4.5...v1.4.7) (2017-03-09)

### Docma (Builder)

#### Fixed
- An issue where build config `config.jsdoc.includePattern` would not be respected when filtering files.
- An issue where sorting would change when `config.jsdoc.hierarchy` option is enabled.

<br />

## [1.4.5](https://github.com/onury/docma/compare/v1.4.0...v1.4.5) (2017-03-05)

### Docma (Builder)

#### Added
- Build config options: `config.jsdoc.allowUnknownTags`, `config.jsdoc.dictionaries`, `config.jsdoc.includePattern`, `config.jsdoc.excludePattern` (`jsdoc-x` feature).
- [JSDoc plugin](http://usejsdoc.org/about-plugins.html) support via the new `config.jsdoc.plugins` option (`jsdoc-x` feature).

<br />

## [1.4.0](https://github.com/onury/docma/compare/v1.3.0...v1.4.0) (2017-02-13)

### Docma (Builder)

#### Fixed
- Incorrect routing when routing method is set to `"path"`.

#### Changed
- If `config.app.entrance` is not set in build configuration, it now defaults to `"api"`.
- If `config.app.server` is not set in build configuration, it now defaults to `"static"`. (`"static"` is similar to `"github"` which generates static HTML files.)

### Docma CLI

#### Changed
- Respecting debug option in config file. If no debug options are set in the command-line arguments (such as `--debug`, `--quiet`, `--nomin`, `--jd-out`, `--verbose`, `--web-logs`); the bitwise debug value from the config file is used, if set.

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

<br />

## [1.3.0](https://github.com/onury/docma/compare/v1.2.0...v1.3.0) (2016-11-23)

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

<br />

## [1.2.0](https://github.com/onury/docma/compare/v1.1.1...v1.2.0) (2016-10-31)

### Docma CLI

#### Added
- CLI (command-line interface). Supports `config`, `src`, `dest` and all `debug` options.

### Default Template

#### Changed
- Updated (one-dark) highlighting styles.

<br />

## [1.1.1](https://github.com/onury/docma/compare/v1.1.1...v1.2.0) (2016-08-13)

### Default Template

#### Fixed
- An anchor/linking issue which prevented some browsers (such as Safari) to navigate properly.

<br />

## [1.1.0](https://github.com/onury/docma/compare/v1.1.0...v1.1.1) (2016-08-12)

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

<br />

## [1.0.3](https://github.com/onury/docma/compare/v1.0.1...v1.0.3) (2016-06-27)

### Docma (Builder)

#### Added
- HTML source file support. You can include HTML files together with JS and markdown files while building your documentation.

### Default Template

#### Changed
- Removed YAML syntax highlighting support because of incorrect auto-detection. Opened an issue [here](https://github.com/isagalaev/highlight.js/issues/1213).

<br />

## [1.0.1](https://github.com/onury/docma/compare/v1.0.0...v1.0.1) (2016-06-11)

### Docma Web Core

> [David][david] considers [marked][marked] as [insecure dependency][docma-david]. This is [already](https://nodesecurity.io/advisories/marked_content-injection) [reported](https://github.com/chjj/marked/pull/592).

#### Fixed
- Missing web components.

<br />

## [1.0.0](https://github.com/onury/docma/compare/v0.5.4...v1.0.0) (2016-06-11)

### Docma (Builder)

#### Added
- Ability to convert markdown files to HTML. See documentation.
- `.markdown:Object` build configuration options. (Same as `marked` module options).
- `.markdown.tasks:Boolean` option for parsing GitHub-like markdown tasks.
- Emoji (twemoji) support for converted markdown files. Added `.markdown.emoji:Boolean` option.
- `.app.server` build option that defines the server/host type for generating server config file(s) for the SPA. e.g., setting to `"apache"` generates an `.htaccess` file within the root of the generated output. Supports `"apache"` and `"github"`.
- `.app.base:String` build option that sets the base path for the SPA.
- `.app.entrance:String` build option that sets the initial content to be displayed.
- `.debug:Boolean` build option.
- Ability to group `.js` files into multiple, separate documentation. See `.src` build option.
- Ability to rename routes for generated markdown files. See `.src` build option.
- Negated glob support (that excludes the paths) for the `src` build option.

#### Changed
- Improved GFM parsing.  
- Dropped `.dump` config option in favor of `.debug` option.
- Moved `.template.document` configuration to `.app`.

### Docma Web Core

#### Added
- Client-side routing support for the SPA with paths (e.g. `/api/mylib`) or query-strings (e.g. `?api=mylib`). Configured via `.app.routing:String` option. Set to `"path"` or `"query"`. Uses page.js internally.
- Implemented `EventEmitter`.
- New methods to `docma.utils` such as `getCodeName(symbol)`, `getFullName(symbol)`, etc...

#### Changed
- **BREAKING**: Dropped `docma.ready()` method. Use `docma.on('ready', listener)` that's only triggered once on every page load or `docma.on('render', listener)` triggered when each content is rendered. Also see `docma.on('route', listener)` triggered when SPA route is changed.
- Docma web initializing errors are no longer passed to event listeners. They are now immediately thrown.
- `docma.app:Object` and `docma.template.main:String` are now exposed to the SPA.
- `docma` object accessible by the SPA is now `Object.freeze`d.
- If `debug >= 3`, web app will now also output logs.

#### Fixed
- Bookmark scrolling.

### Default Template

#### Added
- More supported languages for syntax highlighting (Javascript, JSON, CSS, HTML, XML, CoffeeScript, TypeScript, Bash, HTTP, Markdown, Dust and YAML).
- Ability to auto-detect language for syntax highlighting.
- Ability to style tables in HTML generated from markdown.
- Ability to style code blocks in HTML generated from markdown.

#### Fixed
- Documentation of `@property` JSDoc tags.
- Incorrect symbols sort issue when symbol(s) have aliases.

#### Changed
- Updated default template structure.
- Improved layout for HTML files converted from markdown.
- Improved font display for code and summary/descriptions.
- Improved UX by auto-adjusting font size of sidebar items to fit the sidebar, if they exceed the width.
- Improved various API documentation styles.

#### Other

- **(Dev)**: Manage web-component dependency packages via Bower.
- Updated project structure.
- Various minor revisions and clean-up.
- Improved Docma source code documentation.

<br />

## Pre-Releases

<br />

## 0.5.4 (2016-05-22)

#### Added
- Default template option `badges:Boolean`.

#### Changed
- `docma.template.json` is no more copied over to the output.

<br />

## 0.5.3 (2016-05-22)

#### Fixed
- Docma Web file paths.

<br />

## 0.5.2 (2016-05-20)

#### Changed
- Updated default template.
- Updated dependencies.
- Clean-up.

<br />

## 0.5.0 (2016-05-11)

- Initial (pre) release.

[jsdoc-x]:https://github.com/onury/jsdoc-x
[marked]:https://github.com/chjj/marked
[docma-david]:https://david-dm.org/onury/docma
[cli]:https://onury.io/docma/cli
[faq]:https://onury.io/docma/faq
[build-config]:https://onury.io/docma/api/#Docma~BuildConfiguration
[david]:https://david-dm.org
[tabnabbing]:https://www.owasp.org/index.php/Reverse_Tabnabbing
