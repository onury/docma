# Zebra - Docma Template
<img align="left" width="200" height="200" style="margin-right:30px" src="https://raw.github.com/onury/docma/v2/templates/zebra/zebra-logo.png" />

This is the default template for [Docma][docma]; with a side-bar symbols menu, search and navigation features; and a beautiful layout.

Although Zebra is installed together with Docma, you can still install/update via NPM:
```sh
npm i docma-template-zebra -g
```

Using Zebra template is straight-forward. Just set `template.path` to `"default"` or `"zebra"` or omit it in your build configuration (docma.json).

## Template Options

Template specific options that can be used when building your documentation with this default template.

<table>
    <thead>
        <tr>
            <th>Option</th>
            <th>Type</th>
            <th>Default</th>
            <th>Description</th>
        </tr>
    </thead>
    <tbody>
        <tr>
            <td><code><b>title</b></code></td>
            <td><code>String</code></td>
            <td><code>""</code></td>
            <td>
                Title to be set both on the navbar and sidebar. HTML is allowed. <i>Don't confuse this with document title (tag).</i>
            </td>
        </tr>
        <tr>
            <td><code><b>logo</b></code></td>
            <td><code>String|Object</code></td>
            <td><code>null</code></td>
            <td>
                URL of your logo to be used both in the sidebar and navbar, on the left of the title. If you need to set separate logos for dark and light backgrounds, set this to an object. i.e. <code>{ dark: String, light: String }</code>. Recommended size of a logo image is 120 x 120 pixels.
            </td>
        </tr>
        <tr>
            <td><code><b>sidebar</b></code></td>
            <td><code>Boolean</code></td>
            <td><code>true</code></td>
            <td>
                Whether to enable sidebar that lists the documentation symbols; as an outline menu.
            </td>
        </tr>
        <tr>
            <td><code><b>collapsed</b></code></td>
            <td><code>Boolean</code></td>
            <td><code>false</code></td>
            <td>
                Whether to collapse the sidebar initially by default, on document load.
            </td>
        </tr>
        <tr>
            <td><code><b>outline</b></code></td>
            <td><code>String</code></td>
            <td><code>"flat"</code></td>
            <td>
                Indicates the outline style for the sidebar symbols. If set to `"flat"` symbols are listed with their long names. If set to `"tree"`, symbols are listed with their short names; indented depending on their hierarchical position.
            </td>
        </tr>
        <tr>
            <td><code><b>toolbar</b></code></td>
            <td><code>Boolean</code></td>
            <td><code>true</code></td>
            <td>
                Whether the toolbar below the sidebar search box should be shown. This toolbar provides buttons for switching between outlines, quick-filtering symbols by symbol-kind, etc...
            </td>
        </tr>
        <tr>
            <td><code><b>foldSymbols</b></code></td>
            <td><code>Boolean</code></td>
            <td><code>false</code></td>
            <td>
                Indicates whether to initially fold symbols with child members, in the sidebar.
            </td>
        </tr>
        <tr>
            <td><code><b>animations</b></code></td>
            <td><code>Boolean</code></td>
            <td><code>true</code></td>
            <td>
                Whether animations & transitions are enabled for sidebar and listed symbols.
            </td>
        </tr>
        <tr>
            <td><code><b>badges</b></code></td>
            <td><code>Boolean|String</code></td>
            <td><code>true</code></td>
            <td>
                Whether to show symbol badges (that indicate member type and symbol scope) within the sidebar. If set to false, <code>•</code> will be used as bullets, instead of badges. Or you can set a string for custom bullets.
            </td>
        </tr>
        <tr>
            <td><code><b>symbolMeta</b></code></td>
            <td><code>Boolean</code></td>
            <td><code>false</code></td>
            <td>
                Whether to add meta information at the end of each symbol documentation such as code file name and line number.
            </td>
        </tr>
        <tr>
            <td><code><b>bookmarks</b></code></td>
            <td><code>Boolean|String</code></td>
            <td><code>false</code></td>
            <td>
                Whether to automatically add bookmark links for headings. In order to customize the list of heading tags, set to a comma separated tag name list. e.g. `"h1,h2"`.
            </td>
        </tr>
        <tr>
            <td><code><b>search</b></code></td>
            <td><code>Boolean</code></td>
            <td><code>true</code></td>
            <td>
                Whether to enable the search box within the sidebar. For this to be visible, <code>sidebar</code> should be enabled.
            </td>
        </tr>
        <tr>
            <td><code><b>navbar</b></code></td>
            <td><code>Boolean</code></td>
            <td><code>true</code></td>
            <td>
                Whether to enable the navigation bar on top of the main document. This is useful if you have extra views to navigate to; such as a bookmark on the same document, an external guide, demo or a repository page...
            </td>
        </tr>
        <tr>
            <td><code><b>navItems</b></code></td>
            <td><code>Array</code></td>
            <td><code>[]</code></td>
            <td>
                List of navigation items that builds the navbar and submenu items. See <a href="#navigation-items">Navigation Items</a> below.
            </td>
        </tr>
    </tbody>
</table>

### Navigation Items

Linked labels that build the navigation bar on the top of the document. Each item is an arbitrary <code>Object</code> with the following properties.

<table>
    <thead>
        <tr>
            <th>Property</th>
            <th>Type</th>
            <th>Default</th>
            <th>Description</th>
        </tr>
    </thead>
    <tbody>
        <tr>
            <td><code><b>label</b></code></td>
            <td><code>String</code></td>
            <td><code>""</code></td>
            <td>
                Label of the navigation item. Try keeping this short.
            </td>
        </tr>
        <tr>
            <td><code><b>href</b></code></td>
            <td><code>String</code></td>
            <td><code>"#"</code></td>
            <td>
                Sets the link of the navigation item. Either a bookmark, a relative or external link.
            </td>
        </tr>
        <tr>
            <td><code><b>target</b></code></td>
            <td><code>String</code></td>
            <td><code>undefined</code></td>
            <td>
                Sets the anchor target option. e.g. <code>"&#x5F;blank"</code> to open the link in new/blank page.
            </td>
        </tr>
        <tr>
            <td><code><b>iconClass</b></code></td>
            <td><code>String</code></td>
            <td><code>undefined</code></td>
            <td>
                One of FontAwsome (v5) Free icon CSS classes. e.g. <code>"fab fa-github"</code>. You can combine this with a class that define the size of the icon such as <code>"fab fa-github fa-w-16"</code>. See <a target="_blank" href="https://fontawesome.com/how-to-use/svg-with-js">this</a> on how to use FontAwsome v5 icons for details.
            </td>
        </tr>
        <tr>
            <td><code><b>items</b></code></td>
            <td><code>Array</code></td>
            <td><code>undefined</code></td>
            <td>
                Sub-items for this navigation item. You can use <code>label</code>, <code>href</code> and <code>target</code> options. You can also use an additional <code>separator</code> option, which places a horizontal line within the submenu. e.g. <code>{ separator: true }</code>.
            </td>
        </tr>
    </tbody>
</table>

## Usage with Docma

Template options are defined within the [build configuration](?api=docma#Docma~BuildConfiguration). i.e. in a `docma.json` file.

```js
{
    "template": {
        // Docma Template to be used. 
        // Either a path, module name or "default"
        "path": "zebra", 
        // Template-specific options
        "options": {
            "title": "My Library",
            "logo": {
                "dark": "img/dark-logo.png",
                "light": "img/light-logo.png"
            },
            "sidebar": true,
            "collapsed": false,
            "badges": true,
            "search": true,
            "toolbar": true,
            "symbolMeta": true,
            "outline": "tree",
            "animations": true,
            "navbar": true,
            "navItems": [
                {
                    "label": "Documentation",
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
                            "href": "https://github.com/user/repo/archive/v0.5.0-pre.zip"
                        },
                        {
                            "label": "v0.7.0-pre",
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



[docma]:https://github.com/onury/docma
