# Zebra Changelog
(Docma Default Template Changelog)

## v2.0.0 (NOT RELEASED YET - v2 branch)

### Added
- Support for `@example <caption>Title</caption>`. Fixes [issue #14](https://github.com/onury/docma/issues/14). 
- Support for `@hideconstructor` tag. Fixes [issue #21](https://github.com/onury/docma/issues/21).
- Support for `@event`, `@emits` (and alias `@fires`) tags. Fixes [issue #35](https://github.com/onury/docma/issues/35).
- Support for `@generator` and `@yields` tags.
- Support for rest parameters (i.e. `...args`).
- Support for `@since` tag.
- Support for folding child members of parent symbols. Added `foldSymbols` (`boolean`) template option for initial state. Fixes [issue #26](https://github.com/onury/docma/issues/26). 
- Template option `toolbar` (`boolean`) that toggles a tiny toolbar below the search box, for switching symbol list outline or quick-filtering symbols by symbol-kind. Enabled by default.
- Template option `logo` (`String|Object`) specifies the URL of your logo. If you need separate logos for dark and light backgrounds set this to an object. i.e. `{ dark: String, light: String }`. Recommended size of a logo image is 120 x 120 pixels.
- Template option `typeLinks` (`Boolean|String`) specifies whether documented types should be auto-linked to `internal` paths (i.e. Docma route if type/object definition is within the generated documentation) or `external` URLs (MDN docs if it's a JS or Web-API built-in type/object such as `String`). Thanks to [@warpdesign](https://github.com/warpdesign) for the [idea](https://github.com/onury/docma/issues/30#issuecomment-353888926).
- Template option `animations` (`Boolean`) specifies whether animations are enabled for sidebar and listed symbols.
- Template option `bookmarks` option (`Boolean|String`) which automatically adds bookmark links to headings to content generated from markdown files. Default: `false`.
- Template options `params`, `props` and `enums` all taking a string value, either `"list"` (default) or `"table"`; defining the layout style for parameters, properties and enumerations. If you like the design in previous versions, set these to `"table"`.
- `generator` badge for generator functions.

### Fixed
- Some spacing issues with class descriptions. Empty tables are auto-removed now.
- A JSDoc issue where the constructor would be incorrectly marked as alias.
- An anchor/bookmark issue with multiple symbols having the same id.
- Sub-symbols that are listed in a table, will not wrap to new line anymore.
- An issue where the (heading) title would be hidden under the nav-bar when navigated via a local bookmark on a page, generated from a markdown file. Also improved spacing for headings.
- An issue where the page would not scroll/jump to the bookmark on initial load; when the URL has a location hash.
- Pre/code elements not to wrap content. Now, horizontally scrollable (like on GitHub).
- An issue with sidebar symbol names auto-resizing incorrectly in some cases. Also improved performance by caching font-size for each item.
- Sidebar scrollbars that were not fully visible.
- Some issues with navbar margins when sidebar is disabled.

### Changed
- Default template finally has a name :) - Zebra.
- **BREAKING**: You need Docma v2+ for latest Zebra template to work.
- Improved symbol listing. Also; when search is active, outline is temporarily set to `"flat"` so that you see the parent of the symbol. When search box is cleaned, it's set back to the initial template setting. (e.g. `"tree"` if set).
- Improved `@example` outputs. If there are multiple examples for a symbol, they will be numbered now.
- Improved nested bullet list spacing, for better readability.
- Improved UI and responsive layout. On small screens, sidebar auto-collapses; top navbar turns into hamburger menu. Also, truely printable.
- Improved template option `.badges` (default: `true`) to also accept a string value for custom bullets instead of badges.
- Improved template option `.title` to accept HTML tags (i.e. you can place the title in `<a />` to link it).
- Various other improvements and clean up.

### Removed
- **BREAKING**: icomoon selection of icons (and `ico-` prefix) in favor of FontAwsome (v5) and SVG icons support.
- Bootstrap and its dependencies (css and js) which dramatically reduces the size of the generated SPA. Also, cleaned up all unused styles.
