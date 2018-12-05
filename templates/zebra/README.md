<h1 align="center">
    <a href="https://github.com/onury/docma"><img width="200" height="200" src="https://raw.github.com/onury/docma/master/templates/zebra/zebra-logo.png" alt="Zebra — Template for Docma" /></a>
</h1>

This is the default **template** for [Docma][docma-repo]; with a side-bar symbols menu, search and navigation features; and a beautiful layout.
<br /><br />
<p align="center">
<a href="https://onury.io/docma"><img width="100%" src="https://raw.github.com/onury/docma/master/docma-screen.jpg" alt="Built with Docma using Zebra Template" /></a>
<br />
<a href="https://onury.io/docma">click to view live</a>
</p>

## Usage

1. Make sure you have the latest [Docma][docma-repo] installed.
2. Although Zebra is installed together with Docma, you can still install/update this template via **npm**: `npm i docma-template-zebra -D`
3. Set `template.path` to `"default"` or `"zebra"` or omit it in your build configuration (docma.json).
4. Configure and set `template.options` as described below.

## Template Options

Template specific options that can be used when building your documentation with **Zebra**.

<table>
    <thead>
        <tr>
            <th>Option</th>
            <th>Type</th>
            <th>Description</th>
        </tr>
    </thead>
    <tbody>
        <tr>
            <td><code><b>title</b></code></td>
            <td><code>String|Object</code></td>
            <td>
                Title to be set both on the navbar and sidebar. If you want to set a link for these titles, pass an object. Default: <code>""</code> <br /> <i>Note: Don't confuse this with document title (tag) which is set via <code>app.title</code> in the build configuration.</i>
            </td>
        </tr>
        <tr>
            <td>↳&nbsp;<code>title<b>.label</b></code></td>
            <td><code>String</code></td>
            <td>
                Title to be set both on navbar and sidebar. Default: <code>""</code>
            </td>
        </tr>
        <tr>
            <td>↳&nbsp;<code>title<b>.href</b></code></td>
            <td><code>String</code></td>
            <td>
                Link to be set for both navbar and sidebar titles. Default: <code>"#"</code>
            </td>
        </tr>
        <tr>
            <td><code><b>logo</b></code></td>
            <td><code>String|Object</code></td>
            <td>
                URL of your logo to be used both in the sidebar and navbar, on the left of the title. If you need to set separate logos for dark (sidebar) and light (navbar) backgrounds, set this to an object. <i>Recommended size of a logo image is 120 x 120 pixels.</i> Default: <code>null</code>
            </td>
        </tr>
        <tr>
            <td>↳&nbsp;<code>logo<b>.dark</b></code></td>
            <td><code>String</code></td>
            <td>
                URL for dark logo. Default: <code>null</code>
            </td>
        </tr>
        <tr>
            <td>↳&nbsp;<code>logo<b>.light</b></code></td>
            <td><code>String</code></td>
            <td>
                URL for light logo. Default: <code>null</code>
            </td>
        </tr>
        <tr>
            <td><code><b>sidebar</b></code></td>
            <td><code>Object|Boolean</code></td>
            <td>
                Contains settings for the sidebar that lists the documentation symbols; as an outline menu. To simply toggle this with default settings, pass a boolean. For detailed configuration pass an object. Default: <code>true</code>
            </td>
        </tr>
        <tr>
            <td>↳&nbsp;<code>sidebar<b>.enabled</b></code></td>
            <td><code>Boolean</code></td>
            <td>
                Whether to the sidebar should be visible/enabled... Default: <code>true</code>
            </td>
        </tr>
        <tr>
            <td>↳&nbsp;<code>sidebar<b>.collapsed</b></code></td>
            <td><code>Boolean</code></td>
            <td>
                Whether to collapse the sidebar initially by default, on document load. Default: <code>false</code>
            </td>
        </tr>
        <tr>
            <td>↳&nbsp;<code>sidebar<b>.outline</b></code></td>
            <td><code>String</code></td>
            <td>
                Indicates the outline style for the sidebar symbols. If set to <code>"flat"</code> symbols are listed with their long names. If set to <code>"tree"</code>, symbols are listed with their short names; as an indented tree, depending on their hierarchical position. Default: <code>"tree"</code>
            </td>
        </tr>
        <tr>
            <td>↳&nbsp;<code>sidebar<b>.toolbar</b></code></td>
            <td><code>Boolean</code></td>
            <td>
                Whether the toolbar below the sidebar search-box should be shown. This toolbar provides buttons for switching between outlines, quick-filtering symbols by symbol-kind, etc... Default: <code>true</code>
            </td>
        </tr>
        <tr>
            <td>↳&nbsp;<code>sidebar<b>.itemsFolded</b></code></td>
            <td><code>Boolean</code></td>
            <td>
                Indicates whether to initially fold symbol items with child members, in the sidebar. Default: <code>false</code>
            </td>
        </tr>
        <tr>
            <td>↳&nbsp;<code>sidebar<b>.itemsOverflow</b></code></td>
            <td><code>String</code></td>
            <td>
                Specifies how to fit overflowing sidebar items. Either set to <code>"crop"</code> (crops the item and reveals on hover), or <code>"shrink"</code> (decreases font-size until it fits). Default: <code>"crop"</code>
            </td>
        </tr>
        <tr>
            <td>↳&nbsp;<code>sidebar<b>.animations</b></code></td>
            <td><code>Boolean</code></td>
            <td>
                Whether CSS transitions and animations are enabled for sidebar and listed symbols. Default: <code>true</code>
            </td>
        </tr>
        <tr>
            <td>↳&nbsp;<code>sidebar<b>.badges</b></code></td>
            <td><code>Boolean|String</code></td>
            <td>
                Whether to show symbol badges (that indicate member type and symbol scope) within the sidebar. If set to false, <code>•</code> will be used as bullets, instead of badges. Or you can set a string for custom bullets. Default: <code>true</code>
            </td>
        </tr>
        <tr>
            <td>↳&nbsp;<code>sidebar<b>.search</b></code></td>
            <td><code>Boolean</code></td>
            <td>
                Whether to enable the search box within the sidebar. For this to be visible, sidebar should be enabled. Default: <code>true</code>
            </td>
        </tr>
        <tr>
            <td><code><b>symbols</b></code></td>
            <td><code>Object</code></td>
            <td>
                Contains settings for symbol definition documentation. Default: <code>{}</code>
            </td>
        </tr>
        <tr>
            <td>↳&nbsp;<code>symbols<b>.autoLink</b></code></td>
            <td><code>Boolean|String</code></td>
            <td>
                Specifies whether documented types should be auto-linked to their sources. Set to <code>"internal"</code> paths (i.e. Docma route if type/object definition is within the generated docs) or <code>"external"</code> (MDN docs if it's a JS or Web-API built-in type/object); or <code>true</code> for both. Default: <code>true</code>
            </td>
        </tr>
        <tr>
            <td>↳&nbsp;<code>symbols<b>.meta</b></code></td>
            <td><code>Boolean</code></td>
            <td>
                Whether to add meta information at the end of each symbol documentation such as code file name and line number. Default: <code>false</code>
            </td>
        </tr>
        <tr>
            <td>↳&nbsp;<code>symbols<b>.params</b></code></td>
            <td><code>String</code></td>
            <td>
                Specifies the layout style for documented parameters of a symbol. Possible values are <code>"list"</code> or <code>"table"</code>. Default: <code>"list"</code>
            </td>
        </tr>
        <tr>
            <td>↳&nbsp;<code>symbols<b>.props</b></code></td>
            <td><code>String</code></td>
            <td>
                Specifies the layout style for documented properties of a symbol. Possible values are <code>"list"</code> or <code>"table"</code>. Default: <code>"list"</code>
            </td>
        </tr>
        <tr>
            <td>↳&nbsp;<code>symbols<b>.enums</b></code></td>
            <td><code>String</code></td>
            <td>
                Specifies the layout style for documented properties of an enumeration symbol. Possible values are <code>"list"</code> or <code>"table"</code>. Default: <code>"list"</code>
            </td>
        </tr>
        <tr>
            <td><code><b>contentView</b></code></td>
            <td><code>Object</code></td>
            <td>
                Contains settings for content view, which is generated from markdown or HTML files.
            </td>
        </tr>
        <tr>
            <td>↳&nbsp;<code>contentView<b>.bookmarks</b></code></td>
            <td><code>Boolean|String</code></td>
            <td>
                Whether to automatically add bookmark links for headings. In order to customize the list of heading tags, set to a comma separated tag name list. e.g. <code>"h1,h2"</code>. Default: <code>false</code>
            </td>
        </tr>
        <tr>
            <td>↳&nbsp;<code>contentView<b>.faLibs</b></code></td>
            <td><code>String|Array</code></td>
            <td>
                <a href="https://fontawesome.com" target="_blank" rel="noopener noreferrer">FontAwesome</a> icon libraries to be included with the generated output. Set to <code>"all"</code> to include all libraries. To include an individual library; set to <code>"solid"</code>, <code>"regular"</code> or <code>"brands"</code>. Or you can set to a combination of libraries. e.g. <code>"solid,brands"</code>. Set to <code>null</code> to exclude FontAwesome from the output. Default: <code>"all"</code>
            </td>
        </tr>
        <tr>
            <td>↳&nbsp;<code>contentView<b>.faVersion</b></code></td>
            <td><code>String</code></td>
            <td>
                FontAwesome icon library version to be used. Default: <code>"5.5.0"</code>
            </td>
        </tr>
        <tr>
            <td><code><b>navbar</b></code></td>
            <td><code>Object|Boolean</code></td>
            <td>
                Contains settings for the navigation bar on top of the main document. This is useful if you have extra views to navigate to. To simply toggle this with default settings, pass a boolean. For detailed configuration pass an object. Default: <code>{}</code>
            </td>
        </tr>
        <tr>
            <td>↳&nbsp;<code>navbar<b>.enabled</b></code></td>
            <td><code>Boolean</code></td>
            <td>
                Whether to the navbar should be visible/enabled... Default: <code>true</code>
            </td>
        </tr>
        <tr>
            <td>↳&nbsp;<code>navbar<b>.fixed</b></code></td>
            <td><code>Boolean</code></td>
            <td>
                Whether navbar should be fixed to top of the page. Default: <code>true</code>
            </td>
        </tr>
        <tr>
            <td>↳&nbsp;<code>navbar<b>.dark</b></code></td>
            <td><code>Boolean</code></td>
            <td>
                Whether to enable dark theme on navbar. Default: <code>false</code> <i>Note: If this is enabled, you don't need to set path for a dark logo.</i> 
            </td>
        </tr>
        <tr>
            <td>↳&nbsp;<code>navbar<b>.animations</b></code></td>
            <td><code>Boolean</code></td>
            <td>
                Whether CSS transitions and animations are enabled for navbar and listed symbols. Default: <code>true</code>
            </td>
        </tr>
        <tr>
            <td>↳&nbsp;<code>navbar<b>.menu</b></code></td>
            <td><code>Array</code></td>
            <td>
                List of navigation menu items that builds the navbar and submenu items. See <a href="#navigation-menu">Navigation Menu</a> below. Default: <code>[]</code>
            </td>
        </tr>
    </tbody>
</table>

### Navigation Menu

Linked labels that build the navigation menu on the top bar of the document. Each item is an arbitrary <code>Object</code> with the following properties.

<table>
    <thead>
        <tr>
            <th>Property</th>
            <th>Type</th>
            <th>Description</th>
        </tr>
    </thead>
    <tbody>
        <tr>
            <td><code><b>label</b></code></td>
            <td><code>String</code></td>
            <td>
                Label of the navigation item. Try keeping this short. Default: <code>""</code>
            </td>
        </tr>
        <tr>
            <td><code><b>href</b></code></td>
            <td><code>String</code></td>
            <td>
                Sets the link of the navigation item. Either a bookmark, a relative or external link. Default: <code>"#"</code>
            </td>
        </tr>
        <tr>
            <td><code><b>target</b></code></td>
            <td><code>String</code></td>
            <td>
                Sets the anchor target option. e.g. <code>"&#x5F;blank"</code> to open the link in new/blank page. Default: <code>undefined</code>
            </td>
        </tr>
        <tr>
            <td><code><b>iconClass</b></code></td>
            <td><code>String</code></td>
            <td>
                One of FontAwsome (v5) Free icon CSS classes. e.g. <code>"fab fa-github"</code>. You can combine this with a class that define the size of the icon such as <code>"fab fa-github fa-w-16"</code>. See <a target="_blank" rel="noopener noreferrer" href="https://fontawesome.com/how-to-use/svg-with-js">this</a> on how to use FontAwsome v5 icons for details. Default: <code>undefined</code>
            </td>
        </tr>
        <tr>
            <td><code><b>chevron</b></code></td>
            <td><code>Boolean</code></td>
            <td>
                Toggles the visibility of the dropdown arrow for the corresponding item. Default: <code>true</code>
            </td>
        </tr>
        <tr>
            <td><code><b>items</b></code></td>
            <td><code>Array</code></td>
            <td>
                Sub-items for this navigation item. You can use <code>label</code>, <code>href</code> and <code>target</code> options. You can also use an additional <code>separator</code> option, which places a horizontal line within the submenu. e.g. <code>{ separator: true }</code>. Default: <code>undefined</code>
            </td>
        </tr>
    </tbody>
</table>

## Usage with Docma

Template options are defined within the [build configuration][build-conf]. i.e. in a `docma.json` file.

```js
{
    "template": {
        // Docma Template to be used. 
        // Either a path, module name or "default"
        "path": "zebra",
        // Zebra template-specific options
        "options": {
            "title": {
                "label": "My Library",
                "href": "/base/"
            },
            "logo": {
                "dark": "img/dark-logo.png",
                "light": "img/light-logo.png"
            },
            "sidebar": {
                "enabled": true,
                "outline": "tree",
                "collapsed": false,
                "toolbar": true,
                "itemsFolded": false,
                "itemsOverflow": "crop",
                "badges": true,
                "search": true,
                "animations": true
            },
            "symbols": {
                "autoLink": true,
                "params": "list",
                "enums": "list",
                "props": "list",
                "meta": false
            },
            "contentView": {
                "bookmarks": "h1,h2,h3",
                "faLibs": "solid,regular,brands"
            },
            "navbar": {
                "enabled": true,
                "dark": false,
                "animations": true,
                "menu": [
                    {
                        "label": "Docs",
                        "iconClass": "fas fa-book",
                        "href": "./"
                    },
                    {
                        "label": "Demos",
                        "iconClass": "fas fa-mouse-pointer",
                        "href": "?content=demos"
                    },
                    {
                        "label": "Download",
                        "iconClass": "fas fa-cloud-download-alt",
                        "items": [
                            {
                                "label": "v0.5.0-pre",
                                "href": "https://github.com/user/repo/archive/v0.7.0-pre.zip"
                            },
                            { "separator": true },
                            {
                                "label": "v1.0.0",
                                "href": "https://github.com/user/repo/archive/v1.0.0.zip"
                            }
                        ]
                    },
                    {
                        "label": "GitHub",
                        "iconClass": "fab fa-github",
                        "href": "https://github.com/user/repo",
                        "target": "_blank"
                    }
                ]
            }
        }
    },
    // other build configuration options
    // src, dest, app, jsdoc, markdown, debug, etc...
}
```
Then you can build your documentation with these customized template options.

```js
Docma.create()
    .build('path/to/docma.json')
    .then(() => {
        console.log('Documentation is built successfully.');
    })
    .catch(err => {
        console.log(err);
    });
```

...or build via CLI:

```sh
docma -c path/to/docma.json
```

## Changelog

See [**CHANGELOG**][changelog].  
_Note: If you're upgrading from Zebra v1.x to v2.x, there are some [**breaking changes**][changelog]._

## License

[**MIT**][license]. 

Emoji shortcuts used in source markdown files are parsed into [twemoji][twemoji]. Graphics and icons licensed under [CC-BY 4.0][cc-by-4]. See FontAwesome [license][fa-license].

[docma-repo]:https://github.com/onury/docma
[build-conf]:https://onury.io/docma/api/#Docma~BuildConfiguration
[license]:https://github.com/onury/docma/blob/master/templates/zebra/LICENSE
[changelog]:https://github.com/onury/docma/blob/master/templates/zebra/CHANGELOG.md
[twemoji]:https://github.com/twitter/twemoji
[cc-by-4]:https://creativecommons.org/licenses/by/4.0
[fa-license]:https://github.com/FortAwesome/Font-Awesome/blob/master/LICENSE.txt
