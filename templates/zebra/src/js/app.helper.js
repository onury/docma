/* global docma, dust, hljs, $ */
/* eslint camelcase:0, no-nested-ternary:0, max-depth:0, no-var:0, prefer-template:0, prefer-arrow-callback:0, prefer-spread:0, object-shorthand:0 */

/**
 *  @license
 *  Zebra Template for Docma - app.js
 *  Copyright © 2018, Onur Yıldırım
 */
var app = window.app || {};

(function () {
    'use strict';

    app.MIN_FONT_SIZE = 10;
    app.MAX_FONT_SIZE = 14;
    app.RE_EXAMPLE_CAPTION = /^\s*<caption>(.*?)<\/caption>\s*/gi;
    // CAUTION: if modifying these constants, also update less vars in
    // sidebar.less
    app.NAVBAR_HEIGHT = 50;
    app.SIDEBAR_WIDTH = 280; // change @sidebar-width in less if modified
    app.SIDEBAR_NODE_HEIGHT = 40;
    app.TOOLBAR_HEIGHT = 30;
    app.TREE_NODE_WIDTH = 24;

    /**
     *  Helper utilities for Zebra Template/App
     *  @private
     */
    app.helper = {};

    var templateOpts = docma.template.options;

    // ---------------------------
    // HELPER METHODS
    // ---------------------------

    app.helper.toggleBodyScroll = function (enable) {
        var overflow = enable ? 'auto' : 'hidden';
        $('body').css({
            'overflow': overflow
        });
    };

    // Returns a function, that, as long as it continues to be invoked, will not
    // be triggered. The function will be called after it stops being called for
    // N milliseconds. If `immediate` is passed, trigger the function on the
    // leading edge, instead of the trailing.
    app.helper.debounce = function (func, wait, immediate) {
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

    app.helper.getCssNumVal = function ($elem, styleName) {
        return parseInt($elem.css(styleName), 10) || 0;
    };

    // Adjusts font-size of each sidebar node's label so that they are not
    // cropped.
    app.helper.setFontSize = function ($el) {
        var f = app.MAX_FONT_SIZE;
        while ($el.width() > 215 && f >= app.MIN_FONT_SIZE) {
            f--;
            $el.css('font-size', f + 'px');
        }
    };

    app.helper.colorOperators = function (str) {
        return str.replace(/[.#~]/g, '<span class="color-blue">$&</span>')
            .replace(/:/g, '<span class="color-gray-dark">$&</span>');
    };

    app.helper.hasChildren = function (symbol) {
        return symbol.$members && !symbol.isEnum;
    };

    app.helper.getSymbolInfo = function (symbolKind, asButton) {
        var badge, char;
        var cls = asButton ? 'badge-btn' : '';

        switch (symbolKind) {
            case 'class':
                char = 'C';
                badge = app.svg.diamond(char, 'Class', 'green', cls);
                break;
            case 'constructor':
                char = 'C';
                badge = app.svg.circle(char, 'Constructor', 'green-pale', cls);
                break;
            case 'namespace':
                char = 'N';
                badge = app.svg.pentagonDown(char, 'Namespace', 'pink', cls);
                break;
            case 'module':
                char = 'M';
                badge = app.svg.diamond(char, 'Module', 'purple-dark', cls);
                break;
            case 'enum':
                char = 'E';
                badge = app.svg.pentagonUp(char, 'Enum', 'purple-pale', cls);
                break;
            case 'event':
                char = 'E';
                badge = app.svg.octagon(char, 'Event', 'blue-pale', cls);
                break;
            case 'global':
                char = 'G';
                badge = app.svg.hexagonV(char, 'Global', 'red', cls);
                break;
            case 'global-object':
                char = 'G';
                badge = app.svg.hexagonV(char, 'Global Object', 'red', cls);
                break;
            case 'global-function':
                char = 'G';
                badge = app.svg.hexagonV(char, 'Global Function', 'blue', cls);
                break;
            case 'inner':
                char = 'I';
                badge = app.svg.circle(char, 'Inner', 'gray-dark', cls);
                break;
            case 'inner-method':
                char = 'M';
                badge = app.svg.square(char, 'Inner Method', 'gray-dark', cls);
                break;
            case 'inner-property':
                char = 'M';
                badge = app.svg.circle(char, 'Inner Property', 'gray-dark', cls);
                break;
            case 'static-property':
                char = 'P';
                badge = app.svg.square(char, 'Static Property', 'orange', cls);
                break;
            case 'static-method':
                char = 'M';
                badge = app.svg.square(char, 'Static Method', 'accent', cls);
                break;
            case 'instance-property':
                char = 'P';
                badge = app.svg.circle(char, 'Instance Property', 'yellow', cls);
                break;
            case 'instance-method':
                char = 'M';
                badge = app.svg.circle(char, 'Instance Method', 'cyan', cls);
                break;
            case 'function':
                char = 'F';
                badge = app.svg.square(char, 'Function', 'accent', cls);
                break;
            default:
                char = '•';
                badge = app.svg.circle(char, '', 'black', cls);
        }
        return {
            kind: symbolKind,
            char: char,
            badge: badge
        };
    };

    function getSymbolData(symbol) {
        var none = {
            kind: '',
            char: '',
            badge: ''
        };
        if (!symbol) return none;

        if (docma.utils.isClass(symbol)) return app.helper.getSymbolInfo('class');
        if (docma.utils.isConstructor(symbol)) return app.helper.getSymbolInfo('constructor');
        if (docma.utils.isNamespace(symbol)) return app.helper.getSymbolInfo('namespace');
        if (docma.utils.isModule(symbol)) return app.helper.getSymbolInfo('module');
        if (docma.utils.isEnum(symbol)) return app.helper.getSymbolInfo('enum');
        if (docma.utils.isEvent(symbol)) return app.helper.getSymbolInfo('event');
        if (docma.utils.isGlobal(symbol)) {
            return docma.utils.isMethod(symbol)
                ? app.helper.getSymbolInfo('global-function')
                : app.helper.getSymbolInfo('global-object');
        }
        if (docma.utils.isInner(symbol)) {
            return docma.utils.isMethod(symbol)
                ? app.helper.getSymbolInfo('inner-method')
                : app.helper.getSymbolInfo('inner');
        }
        if (docma.utils.isStaticProperty(symbol)) return app.helper.getSymbolInfo('static-property');
        if (docma.utils.isInstanceProperty(symbol)) return app.helper.getSymbolInfo('instance-property');
        if (docma.utils.isStaticMethod(symbol)) return app.helper.getSymbolInfo('static-method');
        if (docma.utils.isInstanceMethod(symbol)) return app.helper.getSymbolInfo('instance-method');
        if (docma.utils.isMethod(symbol)) {
            return app.helper.getSymbolInfo('function');
        }
        return app.helper.getSymbolInfo();
        // return none;
    }

    function getTreeLine(treeNode, marginLeft, addClass) {
        marginLeft = marginLeft || 0;
        var cls = 'item-tree-line';
        if (addClass) cls += ' ' + addClass;
        if (treeNode === 'parent') cls += ' item-tree-parent';
        return '<img class="' + cls + '" src="img/tree-' + treeNode + '.png" width="' + app.TREE_NODE_WIDTH + 'px" height="' + app.SIDEBAR_NODE_HEIGHT + 'px" style="margin-left:' + marginLeft + 'px;" />';
    }

    // treeNode: 'first'/'parent', 'last' or 'node' (or 'deep' which is calculated)
    function getTreeLineImgs(levels, treeNode, hasChildren) {
        var marginLeft = -app.TREE_NODE_WIDTH;
        // this will be checked and src might be changed to img/tree-last.png if
        // this is the last item of a tree node.

        var imgs = [];

        // if this has children, we'll add a tree-parent line but should be
        // absolutely positioned right below the badge.
        if (hasChildren) imgs = [getTreeLine('parent', 0, 'absolute')];

        if (treeNode === 'first') {
            // if first but level > 1, treat this as tree-node (not first).
            if (levels > 1) return getTreeLineImgs(levels, 'node', hasChildren);
        } else {
            // badge node
            imgs.unshift(getTreeLine(treeNode));
        }

        // deeper levels, if any...
        if (levels > 2) {
            var i, ml;
            for (i = 2; i < levels; i++) {
                ml = (i - 2) * marginLeft;
                imgs.unshift(getTreeLine('deep', ml));
            }
        }
        return imgs.join('');
    }

    function getSidebarNavItemInner(badge, symbolName, treeNode, hasChildren) {
        var levels = ((symbolName || '').split(/[.#~]/) || []).length;
        // colon (:) is not a level separator. JSDoc uses colon in cases like:
        // `obj~event:ready` or `module:someModule`

        var name = dust.filters.$dot_prop_sb(symbolName);
        return '<span class="item-inner" data-levels="' + levels + '" data-tree="' + treeNode + '" style="margin-left:0px">'
            + getTreeLineImgs(levels, treeNode, hasChildren)
            + badge
            + '<span class="item-label">' + name + '</span>'
            + '</span>';
    }

    function getSidebarNavItem(symbol, parentSymbol, isLast) {
        var treeNode = parentSymbol
            ? isLast ? 'last' : 'node'
            : 'first';
        var id = dust.filters.$id(symbol);
        var keywords = docma.utils.getKeywords(symbol);
        var symbolData = getSymbolData(symbol);
        // .badges also accepts string
        var badge = templateOpts.badges === true
            ? symbolData.badge || ''
            : (typeof templateOpts.badges === 'string' ? templateOpts.badges : '&nbsp;•&nbsp;');
        var hasChildren = app.helper.hasChildren(symbol);
        var innerHTML = getSidebarNavItemInner(badge, symbol.$longname, treeNode, hasChildren);
        var chevron = '';
        if (hasChildren) {
            chevron = '<div class="chevron"><i class="fas fa-lg fa-angle-right"></i></div>';
        }
        return chevron + '<a href="#' + id + '" class="sidebar-item" data-keywords="' + keywords + '" data-kind="' + symbolData.kind + '">'
            + innerHTML + '</a>';
    }

    app.helper.buildSidebarNodes = function (symbolNames, symbols, parentSymbol) {
        symbols = symbols || docma.documentation;
        var items = [];
        symbols.forEach(function (symbol, index) {
            // don't add nav item if symbol is not in symbolNames list
            if (symbolNames.indexOf(symbol.$longname) === -1) return;

            var navItem = getSidebarNavItem(symbol, parentSymbol, index === symbols.length - 1);
            var members = '';
            if (app.helper.hasChildren(symbol)) {
                members = '<ul class="item-members trans-all-ease">' + app.helper.buildSidebarNodes(symbolNames, symbol.$members, symbol).join('') + '</ul>';
            }
            items.push('<li>' + navItem + members + '</li>');
        });
        return items;
    };

    app.helper.setSidebarNodesOutline = function (outline) {
        outline = outline || templateOpts.outline;
        var isTree = outline === 'tree';

        if (isTree) {
            $('.sidebar-nav .item-tree-line').show();
        } else {
            $('.sidebar-nav .item-tree-line').hide();
        }

        var inners = $('.sidebar-nav .item-inner');
        if (isTree) {
            inners.find('.symbol-memberof').addClass('no-width'); // hide
        } else {
            inners.find('.symbol-memberof').removeClass('no-width'); // show
        }

        // moved this out here for performance
        // .badges also accepts string
        // inners.find('.item-label').css('margin-left', templateOpts.badges === true ? '12px' : '0');
        if (!templateOpts.badges) {
            inners.find('.item-label').css('margin-left', '0');
        }

        $('.sidebar-nav .item-inner').each(function () {
            var item = $(this);

            var memberof = item.find('.symbol-memberof');
            if (isTree) {
                memberof.addClass('no-width'); // .hide();
            } else {
                memberof.removeClass('no-width'); // .show();
            }

            var label = item.find('.item-label');
            // .badges also accepts string
            // label.css('margin-left', templateOpts.badges === true ? '12px' : '0');

            // css transition duration is .2s
            var delay = templateOpts.animations ? 210 : 0;
            setTimeout(function () {
                label.css('font-size', app.MAX_FONT_SIZE + 'px');
                app.helper.setFontSize(label);
            }, delay);
        });
    };

})();
