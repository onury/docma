/* global docma, dust, $ */
/* eslint camelcase:0, no-nested-ternary:0, max-depth:0, no-var:0, prefer-template:0, prefer-arrow-callback:0, prefer-spread:0, object-shorthand:0 */

/**
 *  @license
 *  Zebra Template for Docma - app.js
 *  Copyright © 2018, Onur Yıldırım
 */
var app = window.app || {};

(function () {
    'use strict';

    app.NODE_MIN_FONT_SIZE = 9;
    app.NODE_MAX_FONT_SIZE = 13; // this should match .item-label span font-size in CSS
    app.NODE_LABEL_MAX_WIDTH = 190; // this should match .item-label max-width in CSS
    app.RE_EXAMPLE_CAPTION = /^\s*<caption>(.*?)<\/caption>\s*/gi;
    // CAUTION: if modifying these constants, also update less vars in
    // sidebar.less
    app.NAVBAR_HEIGHT = 50;
    app.SIDEBAR_WIDTH = 280; // change @sidebar-width in less if modified
    app.SIDEBAR_NODE_HEIGHT = 36;
    app.TOOLBAR_HEIGHT = 30;
    app.TREE_NODE_WIDTH = 25;

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

    app.helper.getScrollWidth = function ($elem) {
        return $elem.get(0).scrollWidth || $elem.outerWidth() || 0;
    };

    // Adjusts font-size of each sidebar node's label so that they are not
    // cropped.
    app.helper.fitSidebarNavItems = function ($el, outline) {
        outline = outline || templateOpts.sidebar.outline;

        var cropToFit = templateOpts.sidebar.fitItems === 'crop';

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
                var marginLeft = Math.round(app.NODE_LABEL_MAX_WIDTH - app.helper.getScrollWidth($inner));
                if (marginLeft >= 0) marginLeft = 0;
                // this value will be used to set margin-left on hover via JS.
                $inner.attr(dMarginLeft, marginLeft + 'px');
            }
            return;
        }

        // templateOpts.sidebar.fitItems === 'shrink'

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
        if (!symbol) {
            return {
                kind: 'Unknown',
                char: '',
                badge: app.svg.error()
            };
        }

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

    function getTreeLine(treeNode, addClass) {
        var cls = 'item-tree-line';
        if (addClass) cls += ' ' + addClass;
        if (treeNode === 'parent') cls += ' item-tree-parent';
        return '<img class="' + cls + '" src="img/tree-' + treeNode + '.png" width="' + app.TREE_NODE_WIDTH + '" height="' + app.SIDEBAR_NODE_HEIGHT + '" />';
    }

    // treeNode: 'first'/'parent', 'last' or 'node' (or 'deep' which is calculated)
    function getTreeLineImgs(levels, treeNode, hasChildren) {
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
        if (levels > 2) {
            var i;
            for (i = 2; i < levels; i++) {
                imgs.unshift(getTreeLine('deep'));
            }
        }
        return imgs.join('');
    }

    function getSidebarNavItemInner(badge, symbolName, treeNode, hasChildren) {
        var levels = docma.utils.getLevels(symbolName);

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
        // means the symbol has no parent in the documentation. Which is wrong.
        // So we'll visually show this via "!" (string or SVG).
        if (treeNode === 'first' && levels > 1) {
            errMessage = 'Warning: This symbol does not have a documented parent. '
                + 'Expected `' + docma.utils.getParentName(symbolName) + '` to be documented.';
            if (badgeIsStr || noBadge) {
                badge = '<div class="symbol-badge badge-str" title="' + errMessage + '"><span class="color-red">!</span></div>';
                labelMargin = 25;
            } else {
                badge = app.svg.warn(errMessage);
                labelMargin = 31;
            }
        } else {
            treeImages = getTreeLineImgs(levels, treeNode, hasChildren);
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
        }

        var labelStyle = ' style="margin-left: ' + labelMargin + 'px !important; "';
        var itemTitle = errMessage ? ' title="' + errMessage + '"' : '';

        return '<div class="item-inner" data-levels="' + levels + '" data-tree="' + treeNode + '" style="margin-left:0px">'
            + treeImages
            + badge
            + '<div class="item-label"' + itemTitle + labelStyle + '><div class="inner">' + name + '</div></div>'
            + '</div>';
    }

    function getSidebarNavItem(symbol, parentSymbol, isLast) {
        var treeNode = parentSymbol
            ? isLast ? 'last' : 'node'
            : 'first';
        var id = dust.filters.$id(symbol);
        var keywords = docma.utils.getKeywords(symbol);
        var symbolData = getSymbolData(symbol);
        // .badges also accepts string
        var badge = templateOpts.sidebar.badges === true
            ? symbolData.badge || ''
            : (typeof templateOpts.sidebar.badges === 'string' ? templateOpts.sidebar.badges : '&nbsp;•&nbsp;');
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

})();
