/* global app, docma */
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
        if (!match) return '<span class="fw-medium">' + name + '</span>';
        if (forSidebar) {
            var cls = templateOpts.animations ? ' trans-all-ease-fast' : '';
            return '<span class="color-gray symbol-memberof' + cls + '">' + app.helper.colorOperators(match[1]) + '</span><span>' + app.helper.colorOperators(match[2]) + '</span>';
        }
        return '<span class="color-gray">' + app.helper.colorOperators(match[1]) + '</span><span class="fw-medium">' + app.helper.colorOperators(match[2]) + '</span>';
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
            if (docma.utils.isConstructor(symbol)) return '';
            var opts = {
                links: templateOpts.typeLinks
            };
            if (symbol.kind === 'function') {
                var returnTypes = docma.utils.getReturnTypes(symbol, opts);
                return returnTypes ? returnTypes : '';
            }
            var types = docma.utils.getTypes(symbol, opts);
            return types ? types : '';
        })
        .addFilter('$type_sep', function (symbol) {
            if (docma.utils.isConstructor(symbol)) return '';
            if (symbol.kind === 'function') return '⇒';
            if (symbol.kind === 'event' && symbol.type) return '⇢';
            if (symbol.kind === 'class') return ':';
            if (!symbol.type && !symbol.returns) return '';
            return ':';
        })
        .addFilter('$param_desc', function (param) {
            return docma.utils.parse(param.description);
        })
        .addFilter('$longname', function (symbol) {
            if (typeof symbol === 'string') return symbol;
            var nw = docma.utils.isConstructor(symbol) ? 'new ' : '';
            return nw + symbol.$longname; // docma.utils.getFullName(symbol);
        })
        .addFilter('$longname_params', function (symbol) {
            var isCon = docma.utils.isConstructor(symbol),
                longName = app.helper.colorOperators(symbol.$longname); // docma.utils.getFullName(symbol);
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
            return docma.utils.getCodeTags(ext, {
                delimeter: ', ',
                links: templateOpts.typeLinks
            });
        })
        .addFilter('$returns', function (symbol) {
            var returns = Array.isArray(symbol) ? symbol : symbol.returns;
            return docma.utils.getFormattedTypeList(returns, {
                delimeter: '|',
                descriptions: true,
                links: templateOpts.typeLinks
            });
        })
        .addFilter('$yields', function (symbol) {
            var yields = Array.isArray(symbol) ? symbol : symbol.yields;
            return docma.utils.getFormattedTypeList(yields, {
                delimeter: '|',
                descriptions: true,
                links: templateOpts.typeLinks
            });
        })
        .addFilter('$emits', function (symbol) {
            var emits = Array.isArray(symbol) ? symbol : symbol.fires;
            return docma.utils.getEmittedEvents(emits, {
                delimeter: ', ',
                links: templateOpts.typeLinks
            });
        })
        .addFilter('$exceptions', function (symbol) {
            var exceptions = Array.isArray(symbol) ? symbol : symbol.exceptions;
            return docma.utils.getFormattedTypeList(exceptions, {
                delimeter: '|',
                descriptions: true,
                links: templateOpts.typeLinks
            });
        })
        // non-standard JSDoc directives are stored in `.tags` property of a
        // symbol. We also add other properties such as .access (if not public),
        // `.readonly` or `.kind=namespace` as tags.
        .addFilter('$tags', function (symbol) {
            var open = '<span class="boxed vertical-middle bg-ice opacity-full">',
                open2 = '<span class="boxed vertical-middle bg-ice-mid opacity-full">',
                open3 = '<span class="boxed vertical-middle">',
                open4 = '<span class="boxed vertical-middle bg-ice-dark opacity-full">',
                open5 = '<span class="boxed vertical-middle bg-blue opacity-full">',
                open6 = '<span class="boxed vertical-middle bg-yellow color-brown opacity-full">',
                open7 = '<span class="boxed vertical-middle bg-purple color-white opacity-full">',
                open8 = '<span class="boxed vertical-middle bg-green color-white opacity-full">',
                close = '</span>',
                tagBoxes = [];

            if (docma.utils.isDeprecated(symbol)) {
                tagBoxes.push(open6 + 'deprecated' + close);
            }
            if (docma.utils.isGlobal(symbol) && !docma.utils.isConstructor(symbol)) {
                tagBoxes.push(open7 + 'global' + close);
            }
            if (docma.utils.isConstructor(symbol)) {
                tagBoxes.push(open + 'constructor' + close);
            }
            if (docma.utils.isStatic(symbol)) {
                tagBoxes.push(open5 + 'static' + close);
            }
            if (docma.utils.isPublic(symbol) === false) {
                tagBoxes.push(open4 + symbol.access + close);
            }
            if (docma.utils.isNamespace(symbol)) {
                tagBoxes.push(open + 'namespace' + close);
            }
            if (docma.utils.isReadOnly(symbol)) {
                tagBoxes.push(open3 + 'readonly' + close);
            }
            if (docma.utils.isGenerator(symbol)) {
                tagBoxes.push(open8 + 'generator' + close);
            }

            var tags = Array.isArray(symbol) ? symbol : symbol.tags || [],
                tagTitles = tags.map(function (tag) {
                    return open2 + tag.originalTitle + close;
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
            return (m && m[1] ? ' — <i>' + docma.utils.parseTicks(m[1]) + '</i>' : '');
        })
        .addFilter('$remove_caption', function (example) {
            return (example || '').replace(app.RE_EXAMPLE_CAPTION, '');
        });

})();
