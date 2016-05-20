## Docma Default Template

> © 2016, Onur Yıldırım (@onury). MIT License.

The default template for [Docma][docma] documentation builder; with a side-bar symbols menu, search and navigation features; and a beautiful layout.

#### Template Options

Template specific options that can be used while building your documentation with this default template.

<table>
    <tr>
        <td><b>Option</b></td>
        <td><b>Type</b></td>
        <td><b>Default</b></td>
        <td><b>Description</b></td>
    </tr>
    <tr>
        <td><code><b>title</b></code></td>
        <td><code>String</code></td>
        <td><code>""</code></td>
        <td>
            Title to be set on the top left of the main document and on top of the sidebar. Don't confuse this with document title (tag).
        </td>
    </tr>
    <tr>
        <td><code><b>sidebar</b></code></td>
        <td><code>Boolean</code></td>
        <td><code>true</code></td>
        <td>
            Whether to enable sidebar that lists the documentation symbols; as a menu.
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
        <td><code><b>search</b></code></td>
        <td><code>Boolean</code></td>
        <td><code>true</code></td>
        <td>
            Whether to enable the search box within the sidebar. For this to be visible, `sidebar` should be enabled.
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
            List of navigation items. See [Navigation Items](#navigation-items) below.
        </td>
    </tr>
</table>

#### Navigation Items

Linked labels that build the navigation bar on the top of the document. Each item is an arbitrary <code>Object</code> with the following properties.

<table>
    <tr>
        <td><b>Property</b></td>
        <td><b>Type</b></td>
        <td><b>Default</b></td>
        <td><b>Description</b></td>
    </tr>
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
            One of the built-in icon CSS classes. e.g. <code>"ico-github"</code>. You can combine this with classes that define the size of the icon such as <code>"ico-md ico-github"</code>. See all icon and size classes in the <a href="https://github.com/onury/docma/blob/master/templates/default/less/icomoon.less">less file</a>.
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
</table>

#### Usage with Docma

Template options are defined within the [build configuration][build-config]. i.e. `buildConfig.template.options`.

```js
var buildConfig = {
    template: {
        // Template-specific options
        options: {
            title: "My Library",
            sidebar: true,
            collapsed: false,
            search: true,
            navbar: true,
            navItems: [
                {
                    label: "Documentation",
                    href: "#",
                    iconClass: "ico-book"
                },
                {
                    label: "Demos",
                    href: "demos.html",
                    iconClass: "ico-mouse-pointer"
                },
                {
                    label: "Download",
                    iconClass: "ico-md ico-download",
                    items: [
                        {
                            label: "v0.5.0-pre",
                            href: "https://github.com/<user>/<repo>/archive/v0.5.0-pre.zip"
                        },
                        {
                            label: "v0.7.0-pre",
                            href: "https://github.com/<user>/<repo>/archive/v0.7.0-pre.zip"
                        },
                        { separator: true },
                        {
                            label: "v1.0.0",
                            href: "https://github.com/<user>/<repo>/archive/v1.0.0.zip"
                        }
                    ]
                },
                {
                    label: "GitHub",
                    href: "https://github.com/<user>/<repo>",
                    target: "_blank",
                    iconClass: "ico-md ico-github"
                }
            ]
        },
        // Template main document settings
        document: {
            title: "My Library API Documentation",
            meta: [
                // list of meta objects
            ]
        }
    },
    // other build configuration options
    // src, dest, jsdoc, etc...
}
```
Then you can build your documentation with these customized template options.
```js
Docma.create(buildConfig)
    .build()
    .then(function() {
        console.log('Documentation is built successfully.');
    })
    .catch(function (err) {
        console.log(err);
    });
```

---

← [Docma documentation][docma].

[docma]:https://github.com/onury/docma
[build-config]:https://github.com/onury/docma#build-configuration
