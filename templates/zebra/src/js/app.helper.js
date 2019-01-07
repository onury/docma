/* global docma, DocmaWeb, dust, $ */
/* eslint camelcase:0, no-nested-ternary:0, max-depth:0, no-var:0, prefer-template:0, prefer-arrow-callback:0, prefer-spread:0, object-shorthand:0, complexity:0, max-params:0 */

/**
 *  @license
 *  Zebra Template for Docma - app.js
 *  Copyright © 2019, Onur Yıldırım
 */
var app = window.app || {};

(function () {
    'use strict';

    app.NODE_MIN_FONT_SIZE = 9;
    app.NODE_MAX_FONT_SIZE = 13; // this should match .item-label span font-size in CSS
    app.NODE_LABEL_MAX_WIDTH = 210; // this should match .item-label max-width in CSS
    app.RE_EXAMPLE_CAPTION = /^\s*<caption>(.*?)<\/caption>\s*/gi;
    // CAUTION: if modifying these constants, also update less vars in
    // sidebar.less
    app.NAVBAR_HEIGHT = 50;
    app.SIDEBAR_WIDTH = 300; // change @sidebar-width in less if modified
    app.SIDEBAR_NODE_HEIGHT = 36;
    app.TOOLBAR_HEIGHT = 30;
    app.TREE_NODE_WIDTH = 25;

    /**
     *  Helper utilities for Zebra Template/App
     *  @private
     */
    var helper = {};

    var templateOpts = docma.template.options;

    // ---------------------------
    // HELPER METHODS
    // ---------------------------

    helper.toggleBodyScroll = function (enable) {
        var overflow = enable ? 'auto' : 'hidden';
        $('body').css({
            'overflow': overflow
        });
    };

    helper.capitalize = function (str) {
        return str.split(/[ \t]+/g).map(function (word) {
            return word.charAt(0).toUpperCase() + word.slice(1);
        }).join(' ');
    };

    helper.removeFromArray = function (arr, value) {
        var index = arr.indexOf(value);
        if (index !== -1) arr.splice(index, 1);
    };

    helper.addToArray = function (arr, value) {
        var index = arr.indexOf(value);
        if (index === -1) arr.push(value); // no duplicates
    };

    // Returns a function, that, as long as it continues to be invoked, will not
    // be triggered. The function will be called after it stops being called for
    // N milliseconds. If `immediate` is passed, trigger the function on the
    // leading edge, instead of the trailing.
    helper.debounce = function (func, wait, immediate) {
        var timeout;
        return function () {
            var context = this;
            var args = arguments;
            var later = function () {
                timeout = null;
                if (!immediate) func.apply(context, args);
            };
            var callNow = immediate && !timeout;
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
            if (callNow) func.apply(context, args);
        };
    };

    helper.getCssNumVal = function ($elem, styleName) {
        return parseInt($elem.css(styleName), 10) || 0;
    };

    helper.getScrollWidth = function ($elem) {
        return $elem.get(0).scrollWidth || $elem.outerWidth() || 0;
    };

    // Adjusts font-size of each sidebar node's label so that they are not
    // cropped.
    helper.fitSidebarNavItems = function ($el, outline) {
        outline = outline || templateOpts.sidebar.outline;

        var cropToFit = templateOpts.sidebar.itemsOverflow === 'crop';

        if (cropToFit) {
            // we'll store the difference between .inner scrollWidth and outer
            // (label) width in a data attribute, for each outline style
            // flat/tree. On hover, we'll apply this value as margin-left so
            // that the cropped part of the .item-label > .inner is revealed.
            var dMarginLeft = 'data-margin-' + outline;
            var $inner = $el.find('.inner');
            var savedMargin = $inner.attr(dMarginLeft);
            // only save once, for each outline style
            if (!savedMargin) {
                // round this so we don't trigger transition for tiny
                // differences.
                var marginLeft = Math.round(app.NODE_LABEL_MAX_WIDTH - helper.getScrollWidth($inner));
                if (marginLeft >= 0) marginLeft = 0;
                // this value will be used to set margin-left on hover via JS.
                $inner.attr(dMarginLeft, marginLeft + 'px');
            }
            return;
        }

        // templateOpts.sidebar.itemsOverflow === 'shrink'

        // we're storing each symbol's font-size for each outline (tree and
        // flat). so we'll initially check for the current outline's font-size
        // for this element.
        var dFontSize = 'data-font-' + outline;
        var savedSize = $el.attr(dFontSize);

        // if previously saved, restore font size now and return.
        if (savedSize) {
            $el.css('font-size', savedSize);
            return;
        }

        // css transition duration is .2s
        var delay = templateOpts.sidebar.animations ? 210 : 0;
        setTimeout(function () {
            // disable transitions, otherwise it'll measure wrong
            var spans = $el.find('span').addClass('no-trans');
            // start from the normal/max font-size
            var f = app.NODE_MAX_FONT_SIZE;
            while ($el.width() > app.NODE_LABEL_MAX_WIDTH && f >= app.NODE_MIN_FONT_SIZE) {
                $el.css('font-size', f + 'px');
                f -= 0.2; // small steps
            }
            // store shrinked font size for this outline to attribute
            $el.attr(dFontSize, f + 'px');
            // enable transitions back
            spans.removeClass('no-trans');
        }, delay);
    };

    helper.colorOperators = function (str) {
        return str.replace(/[.#~]/g, '<span class="color-blue">$&</span>')
            .replace(/:/g, '<span class="color-gray-dark">$&</span>');
    };

    helper.hasChildren = function (symbol) {
        return symbol.$members && !symbol.isEnum;
    };

    helper.getScopeInfo = function (scope) {
        var o = {};
        var top = 0;
        var left = 0;
        var m = 12; // should match badge-scope-btn size + some margin
        switch (scope) {
            case 'global':
                o.color = 'purple';
                break;
            case 'static':
                o.color = 'accent';
                top = m;
                break;
            case 'instance':
                o.color = 'green';
                left = m;
                break;
            case 'inner':
                o.color = 'gray-light';
                top = m;
                left = m;
                break;
            default:
                o.color = null;
        }
        var margin = top + 'px 0 0 ' + left + 'px';
        o.title = scope || '';
        o.badge = '<div class="badge-scope-btn bg-' + o.color + '" style="margin:' + margin + '" title="' + scope + '" data-scope="' + scope + '"></div>';
        return o;
    };

    helper.getSymbolInfo = function (kind, scope, asButton) {
        var title = scope || '';
        title += ' ' + String(kind || '').replace('typedef', 'type');
        title = DocmaWeb.Utils.trimLeft(helper.capitalize(title));
        var svgOpts = {
            title: title,
            addClass: asButton ? 'badge-btn' : '',
            circleColor: helper.getScopeInfo(scope).color,
            kind: kind,
            scope: scope
        };

        switch (kind) {
            case 'class':
                svgOpts.char = 'C';
                svgOpts.color = 'green';
                svgOpts.shape = 'diamond';
                break;
            case 'constructor':
                svgOpts.char = 'c';
                svgOpts.color = 'green-pale';
                svgOpts.shape = 'circle';
                break;
            case 'namespace':
                svgOpts.char = 'N';
                svgOpts.color = 'pink';
                svgOpts.shape = 'pentagonDown';
                break;
            case 'module':
                svgOpts.char = 'M';
                svgOpts.color = 'red';
                svgOpts.shape = 'hexagonH';
                break;

            case 'constant':
                svgOpts.char = 'c';
                svgOpts.color = 'brown';
                svgOpts.shape = 'hexagonV';
                break;
            case 'typedef':
                svgOpts.char = 'T';
                svgOpts.color = 'purple-dark';
                svgOpts.shape = 'hexagonV';
                break;

            case 'global':
                svgOpts.char = 'G';
                svgOpts.color = 'purple-dark';
                svgOpts.shape = 'hexagonV';
                break;
            case 'global-object':
                svgOpts.char = 'G';
                svgOpts.color = 'purple-dark';
                svgOpts.shape = 'hexagonV';
                break;

            case 'global-function':
                svgOpts.char = 'F';
                svgOpts.color = 'accent';
                svgOpts.shape = 'circle';
                break;
            case 'function':
                svgOpts.char = 'F';
                svgOpts.color = 'accent';
                svgOpts.shape = 'circle';
                break;
            case 'method':
                svgOpts.char = 'M';
                svgOpts.color = 'cyan';
                svgOpts.shape = 'circle';
                break;
            case 'property':
                svgOpts.char = 'P';
                svgOpts.color = 'yellow';
                svgOpts.shape = 'square';
                break;
            case 'enum':
                svgOpts.char = 'e';
                svgOpts.color = 'orange';
                svgOpts.shape = 'pentagonUp';
                break;

            case 'event':
                svgOpts.char = 'E';
                svgOpts.color = 'blue-pale';
                svgOpts.shape = 'octagon';
                break;
            case 'member':
                svgOpts.char = 'm';
                svgOpts.color = 'ice-blue';
                svgOpts.shape = 'square';
                break;

            default:
                svgOpts.title = '';
                svgOpts.char = '•';
                svgOpts.color = 'black';
                svgOpts.shape = 'square';
        }

        return {
            kind: kind,
            scope: scope || '',
            char: svgOpts.char,
            badge: app.svg.shape(svgOpts)
        };
    };

    function getSymbolData(symbol) {
        if (!symbol) {
            return {
                kind: 'Unknown',
                char: '',
                badge: app.svg.error()
            };
        }

        if (DocmaWeb.Utils.isClass(symbol)) return helper.getSymbolInfo('class', symbol.scope);
        if (DocmaWeb.Utils.isConstant(symbol)) return helper.getSymbolInfo('constant', symbol.scope);
        if (DocmaWeb.Utils.isTypeDef(symbol)) return helper.getSymbolInfo('typedef', symbol.scope);
        if (DocmaWeb.Utils.isConstructor(symbol)) return helper.getSymbolInfo('constructor', symbol.scope);
        if (DocmaWeb.Utils.isNamespace(symbol)) return helper.getSymbolInfo('namespace', symbol.scope);
        if (DocmaWeb.Utils.isModule(symbol)) return helper.getSymbolInfo('module', symbol.scope);
        if (DocmaWeb.Utils.isEnum(symbol)) return helper.getSymbolInfo('enum', symbol.scope);
        if (DocmaWeb.Utils.isEvent(symbol)) return helper.getSymbolInfo('event', symbol.scope);
        if (DocmaWeb.Utils.isProperty(symbol)) return helper.getSymbolInfo('property', symbol.scope);
        if (DocmaWeb.Utils.isMethod(symbol)) return helper.getSymbolInfo('method', symbol.scope);
        if (symbol.kind === 'member') return helper.getSymbolInfo('member', symbol.scope);

        return helper.getSymbolInfo();
    }

    // --------------------------------
    // TREE OUTLINE
    // --------------------------------

    // We get the number of levels for each symbol. (e.g. `DocmaWeb.Utils.DOM`
    // has 3 levels.) With each iteration, we keep track of the levels of the
    // latest node which is the "last" in its own branch. This allows us to
    // determine how many "deep" (│) nodes or "space" holders we need to set in
    // front of the corresponding symbols badge & name.

    //  ＊ (first / parent, levels: 1)
    //  ├─＊ (node / parent, levels: 2)
    //  │ └─＊ (last in its own branch, levels: 3)
    //  └─＊  (last, levels: 2)

    function getTreeLine(treeNode, addClass) {
        var cls = 'item-tree-line';
        if (addClass) cls += ' ' + addClass;
        if (treeNode === 'parent') cls += ' item-tree-parent';
        return '<img class="' + cls + '" src="img/tree-' + treeNode + '.png" width="' + app.TREE_NODE_WIDTH + '" height="' + app.SIDEBAR_NODE_HEIGHT + '" />';
    }

    /**
     *  Gets an array of image tags with tree-line images.
     *  This is added in front of the symbol badge and name in the symbols menu.
     *  @private
     *
     *  @param {Number} levels - Number of levels for the current node.
     *  @param {String} treeNode - Kind of tree node. (i.e. 'first'/'parent',
     *  'last' or 'node' (or 'deep' or 'space' which are calculated)).
     *  @param {Boolean} hasChildren - Whether this node has child nodes. (has
     *  its own branch).
     *  @param {Number} lastNodeLevels - The number of levels that the latest node
     *  that was "last" (└─*) in its own tree branch.
     *
     *  @returns {String} - HTML string.
     */
    function getTreeLineImgs(levels, treeNode, hasChildren, lastNodeLevels) {
        // this will be checked and src might be changed to img/tree-last.png if
        // this is the last item of a tree node.

        var imgs = [];

        // if this has children, we'll add a tree-parent line but should be
        // absolutely positioned right below the badge.
        if (hasChildren) imgs = [getTreeLine('parent', 'absolute')];

        if (treeNode === 'first') {
            // if first but level > 1, treat this as tree-node (not first).
            if (levels > 1) return getTreeLineImgs(levels, 'node', hasChildren);
        } else {
            // badge node
            imgs.unshift(getTreeLine(treeNode));
        }

        // deeper levels, if any...
        var deeps = [];
        if (levels > 2) {
            var i;
            for (i = 2; i < levels; i++) {
                // if parent symbol is the last in tree, we add space instead of
                // a deeper tree line.
                if (i <= lastNodeLevels) {
                    // add spaces to most-left with unshift
                    deeps.unshift(getTreeLine('space'));
                } else {
                    deeps.push(getTreeLine('deep'));
                }
            }
        }
        imgs = deeps.concat(imgs);
        return imgs.join('');
    }

    function getSidebarNavItemInner(badge, symbolName, treeNode, hasChildren, lastNodeLevels) {
        var levels = DocmaWeb.Utils.getLevels(symbolName);

        var badgeIsStr = typeof templateOpts.sidebar.badges === 'string';
        var noBadge = Boolean(templateOpts.sidebar.badges) === false;
        var name = dust.filters.$dot_prop_sb(symbolName);

        var treeImages = '';

        // svg badges should have margin-left=31px
        // if string badges, set this to 25px, otherwise 7px (for no badge)
        var labelMargin;

        // This message is set as element title if the symbol hierarchy has a
        // problem.
        var errMessage = '';

        // if this node is deeper than 1 level and node type is first, then it
        // means the symbol has no parent in the documentation.
        // So we'll visually show this via "!" (string or SVG).

        // Disabled this. Some docs might intentionally not include the top node/symbol ???

        // if (treeNode === 'first' && levels > 1) {
        //     errMessage = 'Warning: This symbol does not have a documented parent. '
        //         + 'Expected `' + DocmaWeb.Utils.getParentName(symbolName) + '` to be documented.';
        //     if (badgeIsStr || noBadge) {
        //         badge = '<div class="symbol-badge badge-str" title="' + errMessage + '"><span class="color-red">!</span></div>';
        //         labelMargin = 25;
        //     } else {
        //         badge = app.svg.warn(errMessage);
        //         labelMargin = 31;
        //     }
        // } else {

        treeImages = getTreeLineImgs(levels, treeNode, hasChildren, lastNodeLevels);
        if (noBadge) {
            badge = '';
            labelMargin = 7;
        } else if (badgeIsStr) {
            badge = '<div class="symbol-badge badge-str"><span>' + badge + '</span></div>';
            labelMargin = 25;
        } else {
            // badge = badge; // SVG badge
            labelMargin = 31;
        }

        // }

        var labelStyle = ' style="margin-left: ' + labelMargin + 'px !important; "';
        var itemTitle = errMessage ? ' title="' + errMessage + '"' : '';

        return '<div class="item-inner" data-levels="' + levels + '" data-tree="' + treeNode + '" style="margin-left:0px">'
            + treeImages
            + badge
            + '<div class="item-label"' + itemTitle + labelStyle + '>'
            + '<div class="edge-shadow"></div>'
            + '<div class="inner">' + name + '</div>'
            + '</div>'
            + '</div>';
    }

    function getSidebarNavItem(symbol, parentSymbol, isLast, lastNodeLevels) {
        var treeNode = parentSymbol
            ? (isLast ? 'last' : 'node')
            : 'first';
        var id = dust.filters.$id(symbol);
        var keywords = DocmaWeb.Utils.getKeywords(symbol);
        var symbolData = getSymbolData(symbol);
        // .badges also accepts string
        var badge = templateOpts.sidebar.badges === true
            ? symbolData.badge || ''
            : (typeof templateOpts.sidebar.badges === 'string' ? templateOpts.sidebar.badges : '&nbsp;•&nbsp;');
        var hasChildren = helper.hasChildren(symbol);
        var innerHTML = getSidebarNavItemInner(badge, symbol.$longname, treeNode, hasChildren, lastNodeLevels);
        var chevron = '';
        if (hasChildren) {
            chevron = '<div class="chevron"><i class="fas fa-lg fa-angle-right"></i></div>';
        }
        return chevron + '<a href="#' + id + '" class="sidebar-item" data-keywords="' + keywords + '" data-kind="' + symbolData.kind + '" data-scope="' + symbolData.scope + '">'
            + innerHTML + '</a>';
    }

    helper.buildSidebarNodes = function (symbolNames, symbols, parentSymbol, lastNodeLevels) {
        lastNodeLevels = lastNodeLevels || 0;
        symbols = symbols || docma.documentation;
        var items = [];
        symbols.forEach(function (symbol, index) {
            // don't add nav item if symbol is not in symbolNames list
            if (symbolNames.indexOf(symbol.$longname) === -1) return;
            // don't add nav item if symbol has hideconstructor = true and this
            // is a constructor
            if (DocmaWeb.Utils.isConstructor(symbol) && symbol.hideconstructor === true) {
                return;
            }

            var isLast = index === symbols.length - 1;
            var navItem = getSidebarNavItem(symbol, parentSymbol, isLast, lastNodeLevels);
            var currentLastLevel = isLast ? DocmaWeb.Utils.getLevels(symbol) : lastNodeLevels;
            var members = '';
            if (helper.hasChildren(symbol)) {
                members = '<ul class="item-members trans-all-ease">' + helper.buildSidebarNodes(symbolNames, symbol.$members, symbol, currentLastLevel).join('') + '</ul>';
            }
            items.push('<li>' + navItem + members + '</li>');
        });
        return items;
    };

    // --------------------------------
    // SIDEBAR SEARCH CLASS
    // --------------------------------

    // filter regexps
    // kind:method or kind:method,property etc.. or kind:*
    var RE_KIND = /(?:\bkind:\s*)([^, ]+(?:\s*,\s*[^, ]+)*)?/gi;
    // same for scope:..
    var RE_SCOPE = /(?:\bscope:\s*)([^, ]+(?:\s*,\s*[^, ]+)*)?/gi;

    function SidebarSearch() {
        this.reset();
    }

    SidebarSearch.prototype.reset = function () {
        this.scope = [];
        this.kind = [];
        this.keywords = [];
    };

    SidebarSearch.prototype.parseKeywords = function (string) {
        // remove kind:.. and scope:.. and get the rest in separate words.
        var kw = (string || '')
            .replace(RE_KIND, '')
            .replace(RE_SCOPE, '')
            .trim()
            .replace(/\s+/, ' ');
        this.keywords = kw ? kw.split(' ') : [];
        return this;
    };

    /**
     *  Parses the search text into `{ kind:Array, scope:Array, keywords:Array }`.
     *  @param {String} string - String to be parsed.
     *  @returns {SidebarSearch} -
     */
    SidebarSearch.prototype.parse = function (string) {
        if (!string) {
            this.kind = [];
            this.scope = [];
            this.keywords = [];
            return this;
        }

        var m = RE_KIND.exec(string);
        // `kind:*` means all kinds. It's redundant.
        if (!m || m.length < 2 || !m[1] || m.indexOf('*') >= 0) {
            this.kind = [];
        } else {
            this.kind = m[1].split(',').map(function (k) {
                return k.toLocaleLowerCase().trim();
            });
        }

        m = RE_SCOPE.exec(string);
        // `scope:*` means all scopes. It's redundant.
        if (!m || m.length < 2 || !m[1] || m.indexOf('*') >= 0) {
            this.scope = [];
        } else {
            this.scope = m[1].split(',').map(function (s) {
                return s.toLocaleLowerCase().trim();
            });
        }

        // reset after .exec called
        RE_KIND.lastIndex = 0;
        RE_SCOPE.lastIndex = 0;

        this.parseKeywords(string);
        return this;
    };

    SidebarSearch.prototype.hasScope = function (scope) {
        return this.scope.indexOf(scope) >= 0;
    };

    SidebarSearch.prototype.removeScope = function (scope) {
        helper.removeFromArray(this.scope, scope);
    };

    SidebarSearch.prototype.addScope = function (scope) {
        helper.addToArray(this.scope, scope); // no duplicates
    };

    SidebarSearch.prototype.hasKind = function (kind) {
        return this.kind.indexOf(kind) >= 0;
    };

    SidebarSearch.prototype.removeKind = function (kind) {
        helper.removeFromArray(this.kind, kind);
    };

    SidebarSearch.prototype.addKind = function (kind) {
        helper.addToArray(this.kind, kind); // no duplicates
    };

    SidebarSearch.prototype.matchesAnyKeyword = function (keywords) {
        return this.keywords.some(function (kw) {
            return keywords.indexOf(kw.toLocaleLowerCase()) >= 0;
        });
    };

    SidebarSearch.prototype.toObject = function () {
        return {
            scope: this.scope,
            kind: this.kind,
            keywords: this.keywords
        };
    };

    SidebarSearch.prototype.toString = function () {
        var s = '';
        if (Array.isArray(this.keywords) && this.keywords.length > 0) {
            s = this.keywords.join(' ') + ' ';
        }
        if (Array.isArray(this.scope) && this.scope.length > 0) {
            s += 'scope:' + this.scope.join(',') + ' ';
        }
        if (Array.isArray(this.kind) && this.kind.length > 0) {
            s += 'kind:' + this.kind.join(',');
        }
        return s.trim();
    };

    app.SidebarSearch = SidebarSearch;
    app.helper = helper;

})();
