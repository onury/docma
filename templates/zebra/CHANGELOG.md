# Zebra Changelog

All notable changes to this project will be documented in this file. The format is based on [Keep a Changelog](http://keepachangelog.com/en/1.0.0/) and this project adheres to [Semantic Versioning](http://semver.org).

### 2.3.1 (2019-01-08)

#### Fixed
- An issue where some special characters within the location hash would cause an error.

### 2.3.0 (2018-12-04)

#### Added
- JSDoc `@default` tag support for symbols. Fixes [#60](https://github.com/onury/docma/issues/60).
- New option `contentView.faLibs` that defines FontAwesome libraries to be included, such as `solid`, `regular`, `brands`. Set to `null` to completely exclude FontAwesome from the output. See Zebra documentation. Fixes [#63](https://github.com/onury/docma/issues/63).
- New option `contentView.faVersion` that defines FontAwesome icon library version to be included. 

#### Changed
- Minor style revisions.
- Updated dependencies to latest versions.

### 2.2.0 (2018-11-18)
_This version of Zebra template still supports Docma `2.0.0` and later._

#### Added
- Support for collapsable markdown (i.e. with `<details>` and `<summary>` tags).

#### Changed
- Improved support for constant symbols.
- Default template title is now `"Documentation"`. Set `template.options.title` to empty string to remove.

#### Fixed
- An issue where tags such as `@constant` and `@module` would cause an `Uncaught TypeError`. Fixes [#41](https://github.com/onury/docma/issues/50) and [#45](https://github.com/onury/docma/issues/45).
- Fixed ["Reverse Tabnabbing" vulnerability][tabnabbing] with parsed documentation links.

## 2.1.0 (2018-04-14)

#### Added
- Partial support for TypeScript-style type notation. e.g. `Promise<Number>` or `Number[]`, etc...

#### Fixed
- An issue where deeper levels of tree nodes were not properly aligned, when `sidebar.outline` is set to `"tree"`.
- An issue where some symbol names were unnecessarily scroll-animated on hover. Firefox was affected.
- An issue where multiple return types were listed out of style.

#### Changed
- When `sidebar.itemsOverflow` is set to `"crop"` (default); symbol names are faded-out on their edges, instead of using ellipsis (which behaves differently on browsers).

## 2.0.0 (2018-04-12)
> _This is a big release with some breaking changes._  
> _Please read this changelog thoroughly before updating your template configuration._

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
- Template option `sidebar.itemsOverflow` (`String`) that specifies how to fit overflowing sidebar items. Either set to `"crop"` (default, crops the item and reveals on hover), or `"shrink"` (decreases font-size until it fits).
- Template option `sidebar.animations` and `navbar.animations` (`Boolean`) specifies whether CSS transitions and animations should be enabled for navbar, sidebar and listed symbols.
- Template option `navbar.fixed` (`Boolean`) toggles between fixed and static navbar.
- Template option `navbar.dark` (`Boolean`) enables dark theme for the navbar.
- `chevron` (`Boolean`) option for navbar menu items. Set this to false if you don't want the dropdown arrow to be visible for that item.
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
- An issue where it would throw if a symbol paramter with no description is parsed.
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


[tabnabbing]:https://www.owasp.org/index.php/Reverse_Tabnabbing
