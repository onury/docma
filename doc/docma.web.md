## Docma-Web API

### Dust.js

Docma also includes the `dust-core` in the generated output; and the `dust` object can be globally accessed within the template (web app).

See [Docma (Dust) Filters][docma-filters].

### Docma-Web Core
When you build the documentation with a template, `docma-web.js` will be generated (and linked in the main HTML); which is the core engine for the documentation web app. This will include everything the app needs such as the documentation data, compiled partials, dustjs engine, etc... (Note that the size of this script depends especially on the generated documentation data.)

Within the template (web app), a global **`docma`** object is available; that has the following members...

---

#### `docma.documentation : Array`

The JSDoc documentation output as an array of (symbol) objects.

---

#### `docma.symbols : Array`

A flat array of symbol (long) names. This is useful for building menus, etc...

---

#### `docma.template : Object`

Provides template specific data with the following properties:

<table>
    <tr>
        <td><b>Property</b></td>
        <td><b>Type</b></td>
        <td><b>Description</b></td>
    </tr>
    <tr>
        <td><code>template.<b>name</b></code></td>
        <td><code>String</code></td>
        <td>
            Name of the Docma template (which is originally set in the <code>docma.template.json</code> file).
        </td>
    </tr>
    <tr>
        <td><code>template.<b>version</b></code></td>
        <td><code>String</code></td>
        <td>
            Version of the Docma template (which is originally set in the <code>docma.template.json</code> file).
        </td>
    </tr>
    <tr>
        <td><code>template.<b>author</b></code></td>
        <td><code>String</code></td>
        <td>
            Author information for the Docma template (which is originally set in the <code>docma.template.json</code> file).
        </td>
    </tr>
    <tr>
        <td><code>template.<b>license</b></code></td>
        <td><code>String</code></td>
        <td>
            License information for the Docma template (which is originally set in the <code>docma.template.json</code> file).
        </td>
    </tr>
    <tr>
        <td><code>template.<b>document</b></code></td>
        <td><code>String</code></td>
        <td>
            Document configuration (which is originally set in the build process).
        </td>
    </tr>
    <tr>
        <td>↳<code>template.document.<b>title</b></code></td>
        <td><code>String</code></td>
        <td>
            Document title.
        </td>
    </tr>
    <tr>
        <td>↳<code>template.document.<b>meta</b></code></td>
        <td><code>Array</code></td>
        <td>
            Array of arbitrary objects set for document meta (tags).
        </td>
    </tr>
    <tr>
        <td><code>template.<b>options</b></code></td>
        <td><code>Object</code></td>
        <td>
            Docma template options (which is originally set in the build process).
        </td>
    </tr>
</table>

---

#### `docma.ready(callback) : void`

Sets a callback function to be invoked when Docma is ready. This is useful if you want to make sure that all compiled partials are rendered. Note that callback is always fired after `window` is loaded.

<table>
    <tr>
        <td><b>Param</b></td>
        <td><b>Type</b></td>
        <td><b>Description</b></td>
    </tr>
    <tr>
        <td><b><code><b>calback</b></code></b></td>
        <td><code>Function</code></td>
        <td>
            Function to be invoked with the following signature: <code>function (err) { ... }</code>. An <code>err</code> argument is passed if Docma could not process the template or documentation data.
        </td>
    </tr>
</table>

Example:

```js
docma.ready(function (err) {
    if (err) {
        console.log(err);
        return;
    }
    // initialize the template here
})
```

---

#### `docma.utils : Object`

Provides utility methods for validation and parsing documentation output and symbols.

<table>
    <tr>
        <td><b>Method</b></td>
        <td><b>Params</b></td>
        <td><b>Returns</b></td>
        <td><b>Description</b></td>
    </tr>
    <tr>
        <td><b><code>getFullName(symbol)</code></b></td>
        <td><code>symbol:Object</code></td>
        <td><code>String</code></td>
        <td>
            Gets the full code-name of the given symbol.
        </td>
    </tr>
    <tr>
        <td><b><code>getKeywords(symbol)</code></b></td>
        <td><code>symbol:Object</code></td>
        <td><code>String</code></td>
        <td>
            Builds a string of keywords from the given symbol. This is useful for filter/search features of a template.
        </td>
    </tr>
    <tr>
        <td><b><code>getName(symbol)</code></b></td>
        <td><code>symbol:Object</code></td>
        <td><code>String</code></td>
        <td>
            Gets the (short) code-name of the given symbol.
        </td>
    </tr>
    <tr>
        <td><b><code>getReturnTypes(symbol)</code></b></td>
        <td><code>symbol:Object</code></td>
        <td><code>String</code></td>
        <td>
            Gets the return types of the symbol as a string (joined with pipes <code>|</code>).
        </td>
    </tr>
    <tr>
        <td><b><code>getSymbolByName(docs, name)</code></b></td>
        <td>
            <code>docs:Array</code>
            <code>name:String</code>
        </td>
        <td><code>Boolean</code></td>
        <td>
            Gets the first matching symbol by the given name.
        </td>
    </tr>
    <tr>
        <td><b><code>getTypes(symbol)</code></b></td>
        <td><code>symbol:Object</code></td>
        <td><code>String</code></td>
        <td>
            Gets the types of the symbol as a string (joined with pipes <code>|</code>).
        </td>
    </tr>
    <tr>
        <td><b><code>hasDescription(symbol)</code></b></td>
        <td><code>symbol:Object</code></td>
        <td><code>Boolean</code></td>
        <td>
            Checks whether the given symbol has description.
        </td>
    </tr>
    <tr>
        <td><b><code>isClass(symbol)</code></b></td>
        <td><code>symbol:Object</code></td>
        <td><code>Boolean</code></td>
        <td>
            Checks whether the given symbol is a class.
        </td>
    </tr>
    <tr>
        <td><b><code>isConstructor(symbol)</code></b></td>
        <td><code>symbol:Object</code></td>
        <td><code>Boolean</code></td>
        <td>
            Checks whether the given symbol is a constructor.
        </td>
    </tr>
    <tr>
        <td><b><code>isEnum(symbol)</code></b></td>
        <td><code>symbol:Object</code></td>
        <td><code>Boolean</code></td>
        <td>
            Checks whether the given symbol is an enumeration.
        </td>
    </tr>
    <tr>
        <td><b><code>isGlobal(symbol)</code></b></td>
        <td><code>symbol:Object</code></td>
        <td><code>Boolean</code></td>
        <td>
            Checks whether the given symbol has global scope.
        </td>
    </tr>
    <tr>
        <td><b><code>isInstanceMember(symbol)</code></b></td>
        <td><code>symbol:Object</code></td>
        <td><code>Boolean</code></td>
        <td>
            Checks whether the given symbol is an instance member.
        </td>
    </tr>
    <tr>
        <td><b><code>isInstanceMethod(symbol)</code></b></td>
        <td><code>symbol:Object</code></td>
        <td><code>Boolean</code></td>
        <td>
            Checks whether the given symbol is an instance method.
        </td>
    </tr>
    <tr>
        <td><b><code>isInstanceProperty(symbol)</code></b></td>
        <td><code>symbol:Object</code></td>
        <td><code>Boolean</code></td>
        <td>
            Checks whether the given symbol is an instance property.
        </td>
    </tr>
    <tr>
        <td><b><code>isMethod(symbol)</code></b></td>
        <td><code>symbol:Object</code></td>
        <td><code>Boolean</code></td>
        <td>
            Checks whether the given symbol is a method.
        </td>
    </tr>
    <tr>
        <td><b><code>isNamespace(symbol)</code></b></td>
        <td><code>symbol:Object</code></td>
        <td><code>Boolean</code></td>
        <td>
            Checks whether the given symbol is a namespace.
        </td>
    </tr>
    <tr>
        <td><b><code>isStaticMethod(symbol)</code></b></td>
        <td><code>symbol:Object</code></td>
        <td><code>Boolean</code></td>
        <td>
            Checks whether the given symbol is a static method.
        </td>
    </tr>
    <tr>
        <td><b><code>isStaticMember(symbol)</code></b></td>
        <td><code>symbol:Object</code></td>
        <td><code>Boolean</code></td>
        <td>
            Checks whether the given symbol is a static member.
        </td>
    </tr>
    <tr>
        <td><b><code>isStaticProperty(symbol)</code></b></td>
        <td><code>symbol:Object</code></td>
        <td><code>Boolean</code></td>
        <td>
            Checks whether the given symbol is a static property.
        </td>
    </tr>
    <tr>
        <td><b><code>isProperty(symbol)</code></b></td>
        <td><code>symbol:Object</code></td>
        <td><code>Boolean</code></td>
        <td>
            Checks whether the given symbol is a property.
        </td>
    </tr>
    <tr>
        <td><b><code>isReadOnly(symbol)</code></b></td>
        <td><code>symbol:Object</code></td>
        <td><code>Boolean</code></td>
        <td>
            Checks whether the given symbol is read-only.
        </td>
    </tr>
    <tr>
        <td><b><code>isUndocumented(symbol)</code></b></td>
        <td><code>symbol:Object</code></td>
        <td><code>Boolean</code></td>
        <td>
            Checks whether the given symbol is undocumented. This checks if the symbol has any comments.
        </td>
    </tr>
    <tr>
        <td><b><code>parse(str)</code></b></td>
        <td><code>str:String</code></td>
        <td><code>String</code></td>
        <td>
            Parses the given string. Removes leading whitespace, converts new lines to paragraphs, ticks to code tags and JSDoc links to anchors.
        </td>
    </tr>
    <tr>
        <td><b><code>normalizeTabs(str)</code></b></td>
        <td><code>str:String</code></td>
        <td><code>String</code></td>
        <td>
            Normalizes the number of spaces/tabs to multiples of 2 spaces, in the beginning of each line.
        </td>
    </tr>
    <tr>
        <td><b><code>notate(obj, notation)</code></b></td>
        <td>
            <code>obj:Object</code>
            <code>notation:String</code>
        </td>
        <td><code>\*</code></td>
        <td>
            Gets the value of the target property by the given dot <a href="https://github.com/onury/notation">notation</a>. e.g. <code>var symbol = { code: { meta: { type: "MethodDefinition" } } };</code> <code>notate(symbol, "code.meta.type")</code> will return <code>"MethodDefinition"</code>. If the given notation does not exist, safely returns <code>undefined</code>.
        </td>
    </tr>
    <tr>
        <td><b><code>parseLinks(str)</code></b></td>
        <td><code>str:String</code></td>
        <td><code>String</code></td>
        <td>
            Converts JSDoc <code>@link</code> directives to HTML anchor tags.
        </td>
    </tr>
    <tr>
        <td><b><code>parseNewlines(str)</code></b></td>
        <td><code>str:String</code></td>
        <td><code>String</code></td>
        <td>
            Converts new lines to HTML paragraphs.
        </td>
    </tr>
    <tr>
        <td><b><code>parseTicks(str)</code></b></td>
        <td><code>str:String</code></td>
        <td><code>String</code></td>
        <td>
            Converts ticks to HTML code tags.
        </td>
    </tr>
    <tr>
        <td><b><code>trimLeft(str)</code></b></td>
        <td><code>str:String</code></td>
        <td><code>String</code></td>
        <td>
            Removes leading spaces and dashes.
        </td>
    </tr>
</table>

---

← [Docma documentation][docma].

[docma]:https://github.com/onury/docma
[docma-filters]:https://github.com/onury/docma/blob/master/doc/docma.filters.md
