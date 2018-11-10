/* global app, docma, DocmaWeb */
/* eslint camelcase:0, no-nested-ternary:0, max-depth:0, no-var:0, prefer-template:0, prefer-arrow-callback:0, prefer-spread:0, object-shorthand:0 */

(function () {
    'use strict';

    var templateOpts = docma.template.options;

    // ---------------------------
    // CUSTOM DUST FILTERS
    // ---------------------------

    function dotProp(name, forSidebar) {
        var re = /(.*)([.#~][\w:]+)/g,
            match = re.exec(name);
        if (!match) return '<span class="fw-bold">' + name + '</span>';
        if (forSidebar) {
            var cls = templateOpts.sidebar.animations ? ' trans-all-ease-fast' : '';
            return '<span class="color-gray symbol-memberof' + cls + '">' + app.helper.colorOperators(match[1]) + '</span><span>' + app.helper.colorOperators(match[2]) + '</span>';
        }
        return '<span class="color-gray">' + app.helper.colorOperators(match[1]) + '</span><span class="fw-bold">' + app.helper.colorOperators(match[2]) + '</span>';
    }

    docma
        .addFilter('$color_ops', function (name) {
            return app.helper.colorOperators(name);
        })
        .addFilter('$dot_prop_sb', function (name) {
            return dotProp(name, true);
        })
        .addFilter('$dot_prop', function (name) {
            return dotProp(name, false);
        })
        .addFilter('$author', function (symbol) {
            var authors = Array.isArray(symbol) ? symbol : (symbol.author || []);
            return authors.join(', ');
        })
        .addFilter('$type', function (symbol) {
            if (DocmaWeb.Utils.isConstructor(symbol)) return '';
            var opts = {
                links: templateOpts.symbols.autoLink
            };
            if (symbol.kind === 'function') {
                var returnTypes = DocmaWeb.Utils.getReturnTypes(docma.apis, symbol, opts);
                return returnTypes ? returnTypes : '';
            }
            var types = DocmaWeb.Utils.getTypes(docma.apis, symbol, opts);
            return types ? types : '';
        })
        .addFilter('$type_sep', function (symbol) {
            if (DocmaWeb.Utils.isConstructor(symbol)) return '';
            if (symbol.kind === 'function') return '⇒';
            if (symbol.kind === 'event' && symbol.type) return '⇢';
            if (symbol.kind === 'class') return ':';
            if (!symbol.type && !symbol.returns) return '';
            return ':';
        })
        .addFilter('$param_desc', function (param) {
            return DocmaWeb.Utils.parse(param.description || '');
        })
        .addFilter('$longname', function (symbol) {
            if (typeof symbol === 'string') return symbol;
            var nw = DocmaWeb.Utils.isConstructor(symbol) ? 'new ' : '';
            return nw + symbol.$longname; // DocmaWeb.Utils.getFullName(symbol);
        })
        .addFilter('$longname_params', function (symbol) {
            var isCon = DocmaWeb.Utils.isConstructor(symbol),
                longName = app.helper.colorOperators(symbol.$longname); // DocmaWeb.Utils.getFullName(symbol);
            if (symbol.kind === 'function' || isCon) {
                var defVal,
                    defValHtml = '',
                    nw = isCon ? 'new ' : '',
                    name = nw + longName + '(';
                if (Array.isArray(symbol.params)) {
                    var params = symbol.params.reduce(function (memo, param) {
                        // ignore params such as options.<property>
                        if (param && param.name.indexOf('.') === -1) {
                            defVal = param.hasOwnProperty('defaultvalue') ? String(param.defaultvalue) : 'undefined';
                            defValHtml = param.optional
                                ? '<span class="def-val">=' + defVal + '</span>'
                                : '';
                            var rest = param.variable ? '...' : '';
                            memo.push(rest + param.name + defValHtml);
                        }
                        return memo;
                    }, []).join(', ');
                    name += params;
                }
                return name + ')';
            }
            return longName;
        })
        .addFilter('$extends', function (symbol) {
            var ext = Array.isArray(symbol) ? symbol : symbol.augments;
            return DocmaWeb.Utils.getCodeTags(docma.apis, ext, {
                delimeter: ', ',
                links: templateOpts.symbols.autoLink
            });
        })
        .addFilter('$returns', function (symbol) {
            var returns = Array.isArray(symbol) ? symbol : symbol.returns;
            return DocmaWeb.Utils.getFormattedTypeList(docma.apis, returns, {
                delimeter: '|',
                descriptions: true,
                links: templateOpts.symbols.autoLink
            });
        })
        .addFilter('$yields', function (symbol) {
            var yields = Array.isArray(symbol) ? symbol : symbol.yields;
            return DocmaWeb.Utils.getFormattedTypeList(docma.apis, yields, {
                delimeter: '|',
                descriptions: true,
                links: templateOpts.symbols.autoLink
            });
        })
        .addFilter('$emits', function (symbol) {
            var emits = Array.isArray(symbol) ? symbol : symbol.fires;
            return DocmaWeb.Utils.getEmittedEvents(docma.apis, emits, {
                delimeter: ', ',
                links: templateOpts.symbols.autoLink
            });
        })
        .addFilter('$exceptions', function (symbol) {
            var exceptions = Array.isArray(symbol) ? symbol : symbol.exceptions;
            return DocmaWeb.Utils.getFormattedTypeList(docma.apis, exceptions, {
                delimeter: '|',
                descriptions: true,
                links: templateOpts.symbols.autoLink
            });
        })
        // non-standard JSDoc directives are stored in `.tags` property of a
        // symbol. We also add other properties such as .access (if not public),
        // `.readonly` or `.kind=namespace` as tags.
        .addFilter('$tags', function (symbol) {
            var // open = '<span class="boxed vertical-middle">',
                openIce = '<span class="boxed vertical-middle bg-ice opacity-full">',
                openIceDark = '<span class="boxed vertical-middle bg-ice-dark opacity-full">',
                openBlue = '<span class="boxed vertical-middle bg-blue opacity-full">',
                // openGreen = '<span class="boxed vertical-middle bg-green color-white opacity-full">',
                openGreenPale = '<span class="boxed vertical-middle bg-green-pale color-white opacity-full">',
                openYellow = '<span class="boxed vertical-middle bg-yellow color-brown opacity-full">',
                openPurple = '<span class="boxed vertical-middle bg-purple color-white opacity-full">',
                openRed = '<span class="boxed vertical-middle bg-red color-white opacity-full">',
                openPink = '<span class="boxed vertical-middle bg-pink color-white opacity-full">',
                openBrown = '<span class="boxed vertical-middle bg-brown color-white opacity-full">',
                close = '</span>',
                tagBoxes = [];

            if (DocmaWeb.Utils.isDeprecated(symbol)) {
                tagBoxes.push(openYellow + 'deprecated' + close);
            }

            if (DocmaWeb.Utils.isGlobal(symbol) && !DocmaWeb.Utils.isConstructor(symbol)) {
                tagBoxes.push(openPurple + 'global' + close);
            }
            if (DocmaWeb.Utils.isStatic(symbol)) {
                tagBoxes.push(openBlue + 'static' + close);
            }
            if (DocmaWeb.Utils.isInner(symbol)) {
                tagBoxes.push(openIceDark + 'inner' + close);
            }

            if (DocmaWeb.Utils.isModule(symbol)) {
                tagBoxes.push(openRed + 'module' + close);
            }
            // if (DocmaWeb.Utils.isClass(symbol)) {
            //     tagBoxes.push(openGreen + 'class' + close);
            // }
            if (DocmaWeb.Utils.isConstructor(symbol)) {
                tagBoxes.push(openGreenPale + 'constructor' + close);
            }
            if (DocmaWeb.Utils.isNamespace(symbol)) {
                tagBoxes.push(openPink + 'namespace' + close);
            }
            if (DocmaWeb.Utils.isGenerator(symbol)) {
                tagBoxes.push(openBlue + 'generator' + close);
            }

            if (DocmaWeb.Utils.isPublic(symbol) === false) {
                tagBoxes.push(openIceDark + symbol.access + close);
            }
            if (DocmaWeb.Utils.isReadOnly(symbol)) {
                tagBoxes.push(openIceDark + 'readonly' + close);
            }
            if (DocmaWeb.Utils.isConstant(symbol)) {
                tagBoxes.push(openBrown + 'constant' + close);
            }

            var tags = Array.isArray(symbol) ? symbol : symbol.tags || [];
            var tagTitles = tags.map(function (tag) {
                return openIce + tag.originalTitle + close;
            });
            tagBoxes = tagBoxes.concat(tagTitles);
            if (tagBoxes.length) return '&nbsp;&nbsp;' + tagBoxes.join('&nbsp;');
            return '';
        })
        .addFilter('$navnodes', function (symbolNames) {
            return app.helper.buildSidebarNodes(symbolNames).join('');
        })
        .addFilter('$get_caption', function (example) {
            var m = app.RE_EXAMPLE_CAPTION.exec(example || '');
            return (m && m[1] ? ' — <i>' + DocmaWeb.Utils.parseTicks(m[1]) + '</i>' : '');
        })
        .addFilter('$remove_caption', function (example) {
            return (example || '').replace(app.RE_EXAMPLE_CAPTION, '');
        });

})();
