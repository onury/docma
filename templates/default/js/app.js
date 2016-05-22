/* global docma, dust, hljs, $ */
/* eslint camelcase:0 */

(function () {
    'use strict';

    // ---------------------------
    // HELPER METHODS
    // ---------------------------

    function _getSymbolBadge(symbol) {
        if (!symbol) return '';

        if (docma.utils.isClass(symbol)) {
            return '<span class="symbol-badge bg-green" title="Class">C</span>';
        }
        if (docma.utils.isNamespace(symbol)) {
            return '<span class="symbol-badge bg-red" title="Namespace">N</span>';
        }
        if (docma.utils.isModule(symbol)) {
            return '<span class="symbol-badge bg-pink" title="Module">M</span>';
        }
        if (docma.utils.isEnum(symbol)) {
            return '<span class="symbol-badge bg-purple" title="Enum">E</span>';
        }
        if (docma.utils.isGlobal(symbol)) {
            if (docma.utils.isMethod(symbol)) {
                return '<span class="symbol-badge bg-accent" title="Global Function">G</span>';
            }
            return '<span class="symbol-badge bg-orange" title="Global Object">G</span>';
        }
        if (docma.utils.isStaticMethod(symbol)) {
            return '<span class="symbol-badge bg-accent" title="Static Method">M</span>';
        }
        if (docma.utils.isInstanceMethod(symbol)) {
            return '<span class="symbol-badge bg-cyan" title="Instance Method">M</span>';
        }
        if (docma.utils.isStaticProperty(symbol)) {
            return '<span class="symbol-badge bg-orange" title="Static Property">P</span>';
        }
        if (docma.utils.isInstanceProperty(symbol)) {
            return '<span class="symbol-badge bg-yellow" title="Instance Property">P</span>';
        }
        return '';
    }

    // ---------------------------
    // CUSTOM DUST FILTERS
    // ---------------------------

    dust.filters.$dot_prop = function (name) {
        var re = /(.*)([\.#~]\w+)/g,
            match = re.exec(name);
        if (!match) {
            return '<b>' + name + '</b>';
        }
        return '<span class="color-gray">' + match[1] + '</span>' + match[2];
    };

    dust.filters.$author = function (symbol) {
        var authors = Array.isArray(symbol) ? symbol : (symbol.author || []);
        return authors.join(', ');
    };

    dust.filters.$type = function (symbol) {
        if (docma.utils.isConstructor(symbol)) return '';
        if (symbol.kind === 'function') {
            var returnTypes = docma.utils.getReturnTypes(symbol);
            return returnTypes ? returnTypes : '';
        }
        var types = docma.utils.getTypes(symbol);
        return types ? types : '';
    };

    dust.filters.$type_sep = function (symbol) {
        if (docma.utils.isConstructor(symbol)) return '';
        if (symbol.kind === 'function') return '⇒';
        if (symbol.kind === 'class') return ':';
        if (!symbol.type && !symbol.returns) return '';
        return ':';
    };

    // dust.filters.$param_type = function (param) {
    //     var types = docma.utils.getTypes(param);
    //     return types ? types : '';
    // };

    dust.filters.$param_desc = function (param) {
        var str = !param.optional
            ? '<span class="boxed bg-red">Required</span>&nbsp;'
            : '';
        str += param.description;
        return docma.utils.parse(str);
    };

    dust.filters.$longname = function (symbol) {
        if (typeof symbol === 'string') return symbol;
        var nw = docma.utils.isConstructor(symbol) ? 'new ' : '';
        return nw + docma.utils.getFullName(symbol);
    };

    dust.filters.$longname_params = function (symbol) {
        var isCon = docma.utils.isConstructor(symbol),
            longName = docma.utils.getFullName(symbol);
        if (symbol.kind === 'function' || isCon) {
            var defVal = '',
                nw = isCon ? 'new ' : '',
                name = nw + longName + '(';
            if (Array.isArray(symbol.params)) {
                var params = symbol.params.reduce(function (memo, param) {
                    // ignore params such as options.property
                    if (param.name.indexOf('.') === -1) {
                        defVal = param.optional // param.hasOwnProperty('defaultvalue')
                            ? '<span class="def-val">=' + (param.defaultvalue || 'undefined') + '</span>'
                            : '';
                        memo.push(param.name + defVal);
                    }
                    return memo;
                }, []).join(', ');
                name += params;
            }
            return name + ')';
        }
        return longName;
    };

    dust.filters.$extends = function (symbol) {
        var ext = Array.isArray(symbol) ? symbol : symbol.augments;
        return docma.utils.listType(ext);
    };

    dust.filters.$returns = function (symbol) {
        var returns = Array.isArray(symbol) ? symbol : symbol.returns;
        return docma.utils.listTypeDesc(returns);
    };

    dust.filters.$exceptions = function (symbol) {
        var exceptions = Array.isArray(symbol) ? symbol : symbol.exceptions;
        return docma.utils.listTypeDesc(exceptions);
    };

    // non-standard JSDoc directives are stored in .tags property of a
    // symbol. We also add other properties such as .readonly or
    // kind=namespace as tags.
    dust.filters.$tags = function (symbol) {
        var open = '<span class="boxed vertical-middle bg-ice opacity-xl">',
            open2 = '<span class="boxed vertical-middle">',
            close = '</span>',
            tagBoxes = [];

        if (docma.utils.isNamespace(symbol)) {
            tagBoxes.push(open + 'namespace' + close);
        }
        if (docma.utils.isReadOnly(symbol)) {
            tagBoxes.push(open2 + 'readonly' + close);
        }

        var tags = Array.isArray(symbol) ? symbol : symbol.tags || [],
            tagTitles = tags.map(function (tag) {
                return open + tag.originalTitle + close;
            });
        tagBoxes = tagBoxes.concat(tagTitles);
        if (tagBoxes.length) return '&nbsp;&nbsp;' + tagBoxes.join('&nbsp;');
        return '';
    };

    dust.filters.$menuitem = function (symbolName) {
        var docs = docma.documentation,
            symbol = docma.utils.getSymbolByName(docs, symbolName);
        if (!symbol) return symbolName;
        var id = dust.filters.$id(symbol),
            keywords = docma.utils.getKeywords(symbol),
            badge = docma.template.options.badges
                ? _getSymbolBadge(symbol)
                : '• ',
            name = dust.filters.$dot_prop(symbolName);
        return '<a href="#' + id + '" class="sidebar-item" data-keywords="' + keywords + '">' + badge + name + '</a>';
    };

    // ---------------------------
    // INITIALIZATION
    // ---------------------------

    // http://highlightjs.readthedocs.org/en/latest/api.html#configure-options
    hljs.configure({
        tabReplace: '    ',
        useBR: false
    });

    docma.ready(function (err) {
        if (err) console.log(err);

        $('[data-toggle="tooltip"]').tooltip({
            container: 'body',
            placement: 'bottom'
        });

        var menuItems, btnClean, txtSearch;

        function filterMenuItems() {
            var search = txtSearch.val().trim().toLowerCase();
            if (search === '') {
                menuItems.show();
                btnClean.hide();
                return;
            }
            btnClean.show();
            var keywords;
            menuItems.each(function () {
                keywords = $(this).attr('data-keywords');
                if (keywords.indexOf(search) < 0) {
                    $(this).hide();
                } else {
                    $(this).show();
                }
            });
        }

        if (docma.template.options.search) {
            menuItems = $('ul.sidebar-nav .sidebar-item');
            btnClean = $('.sidebar-search-clean');
            txtSearch = $('#txt-search');

            btnClean.hide();
            txtSearch.on('keyup', filterMenuItems);
            txtSearch.on('change', filterMenuItems);

            btnClean.on('click', function () {
                txtSearch.val('').focus();
                menuItems.show();
                btnClean.hide();
            });
        } else {
            $('.sidebar-nav').css('top', '65px');
        }

        if (!docma.template.options.navbar) {
            // remove the gap created for navbar
            $('body, html').css('padding', 0);
            // remove sidbar top spacing
            $('#sidebar-wrapper').css('margin-top', 0);
            // since navbar is disabled, also remove the spacing set for
            // preventing navbar overlap with bookmark'ed symbol title.
            $('.symbol-container').css({
                'padding-top': 0,
                'margin-top': 0
            });
        }

        var contentRow = $('#page-content-wrapper').find('.row').first();
        if (docma.template.options.sidebar) {
            if (docma.template.options.collapsed) {
                $('#wrapper').addClass("toggled");
            }
            $(".sidebar-toggle").click(function (event) {
                event.preventDefault();
                $('#wrapper').toggleClass('toggled');
                // add some extra spacing if navbar is disabled; to prevent top
                // left toggle button to overlap with content.
                if (!docma.template.options.navbar) {
                    var marginLeft = $('#wrapper').hasClass('toggled')
                        ? '+=30px' : '-=30px';
                    // contentRow.css('margin-left', marginLeft);
                    contentRow.animate({
                        'margin-left': marginLeft
                    }, 300);
                }
            });
        } else {
            // collapse the sidebar since it's disabled
            $('#wrapper').addClass("toggled");
        }

        // Syntax-Highlight code examples
        var examples = $('#docma-main pre > code');
        examples.each(function (i, block) {
            hljs.highlightBlock(block);
        });
    });

})();
