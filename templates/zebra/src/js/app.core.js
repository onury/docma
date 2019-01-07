/* global docma, hljs, tippy, $ */
/* eslint camelcase:0, no-nested-ternary:0, max-depth:0, no-var:0, prefer-template:0, prefer-arrow-callback:0, prefer-spread:0, object-shorthand:0, complexity:0 */

var app = window.app || {};

(function () {
    'use strict';

    var helper = app.helper;

    var templateOpts = docma.template.options;

    // var $window = $(window);
    var $sidebarNodes, $btnClean, $txtSearch;
    var $wrapper, $sidebarWrapper, $sidebarToggle;
    var $nbmBtn, $navOverlay, $navbarMenu, $navbarBrand, $navbarInner, $navbarList;
    var $btnSwitchFold, $btnSwitchOutline;
    var $scopeFilters, $scopeFilterBtns, $kindFilters, $kindFilterBtns;
    var navbarMenuActuallWidth;
    var isFilterActive = false;
    // current fold state
    var isItemsFolded = templateOpts.sidebar.itemsFolded; // initial fold state
    var isApiRoute = false;
    var SidebarSearch = app.SidebarSearch;
    var sbSearch = new SidebarSearch();

    // ---------------------------
    // HELPER METHODS
    // ---------------------------

    /**
     *  Checks whether the sidebar title has wrapped to the second line. If so,
     *  decreases the font-size of both sidebar and navbar titles.
     */
    function setTitleSize() {
        var sb = templateOpts.sidebar.enabled;
        var nb = templateOpts.navbar.enabled;
        if (!sb && !nb) return;
        var $a = sb
            ? $('.sidebar-title a')
            : $('.navbar-title a');
        // titles font-size is 18px
        if ($a.height() > 18) {
            var css = { 'font-size': '16px' };
            $a.parent().css(css);
            if (nb) {
                $('.navbar-title').css(css);
            }
        }
    }

    // if search filter is active, we force the outline to "flat".
    function getCurrentOutline() {
        return isFilterActive ? 'flat' : templateOpts.sidebar.outline;
    }

    function setSidebarNodesOutline(outline) {
        outline = outline || templateOpts.sidebar.outline;
        var isTree = outline === 'tree';
        var $labels = $sidebarNodes.find('.item-label');

        if (isTree) {
            $sidebarNodes.find('.item-tree-line').show();
            $labels.find('.symbol-memberof').addClass('no-width'); // hide
        } else {
            $sidebarNodes.find('.item-tree-line').hide();
            $labels.find('.symbol-memberof').removeClass('no-width'); // show
        }

        // itemsOverflow is "crop" or not, remove this first
        $labels.removeClass('crop-to-fit');

        // css transition duration is .2s
        // we'll delay so we get measurements after transitions end.
        var delay = templateOpts.sidebar.animations
            // we won't delay if it's "shrink" bec. transitions are not smooth
            // otherwise.
            ? templateOpts.sidebar.itemsOverflow === 'shrink' ? 0 : 240
            : 0;

        setTimeout(function () {
            $labels.each(function () {
                helper.fitSidebarNavItems($(this), outline);
            });
        // $labels.find('.inner').css('width', 'auto');
        }, delay);

        // add .crop-to-fit class after .fitSidebarNavItems() applied
        if (templateOpts.sidebar.itemsOverflow === 'crop') {
            $labels.addClass('crop-to-fit');

            // below is a hacky fix to refresh the ellipsis on Chrome
            var $inners = $labels.find('.inner');
            $inners.css('text-overflow', 'clip');

            // Firefox crops too much when ellipsis is enabled. Chrome does it
            // best but for cross-browser compat. disabling this.

            // setTimeout(function () {
            //     $inners.css('text-overflow', 'ellipsis');
            // }, 130);
        }
    }

    /**
     *  Cleans the search filter.
     *  @private
     */
    function cleanFilter() {
        sbSearch.reset();
        if (!templateOpts.sidebar.enabled || !$sidebarNodes) return;

        setFilterBtnStates();

        if ($txtSearch) $txtSearch.val('');
        $sidebarNodes.removeClass('hidden');
        if ($btnClean) $btnClean.hide();
        $('.toolbar-buttons > span').css('color', '#fff');
        // show back the chevrons within the sidebar symbols.
        $('.chevron').show();
        // reset outline back to initial value
        setTimeout(function () {
            setSidebarNodesOutline(templateOpts.sidebar.outline);
            if ($txtSearch) $txtSearch.focus();
        }, 100); // with a little delay
        isFilterActive = false;
    }

    function setFilterBtnStates() {
        if (!$scopeFilterBtns || !$kindFilterBtns) return;

        $scopeFilterBtns.removeClass('active');
        sbSearch.scope.forEach(function (s) {
            $scopeFilters.find('[data-scope="' + s + '"]').addClass('active');
        });

        $kindFilterBtns.removeClass('active');
        sbSearch.kind.forEach(function (s) {
            $kindFilters.find('[data-kind="' + s + '"]').addClass('active');
        });
    }

    /**
     *  Applies the search filter by showing/hiding corresponding nodes in the
     *  sidebar.
     *  @private
     *  @param {String} strSearch - String to search.
     */
    function applySearch(strSearch) {
        sbSearch.parse(strSearch);
        setFilterBtnStates();
        $sidebarNodes.each(function () {
            var node = $(this);
            var show = true;
            if (sbSearch.scope.length > 0) {
                show = sbSearch.hasScope(node.attr('data-scope'));
            }
            if (show && sbSearch.kind.length > 0) {
                show = sbSearch.hasKind(node.attr('data-kind'));
            }
            if (show && sbSearch.keywords.length > 0) {
                // get the data keywords to be searched from each node's target
                // attribute.
                show = sbSearch.matchesAnyKeyword(node.attr('data-keywords'));
            }
            if (show) {
                node.removeClass('hidden');
            } else {
                node.addClass('hidden');
            }
        });
    }

    /**
     *  Debounced version of `applySearch()`.
     *  @private
     */
    var debounceApplySearch = helper.debounce(applySearch, 100, false);

    /**
     *  Filters the symbol nodes in the API sidebar by the given search string.
     *
     *  Prefix `kind:` will filter by symbol kind rather than searching for the
     *  given text. e.g. `kind:method` or `kind:method,class`.
     *
     *  Additionally, prefix `scope:` will filter by symbol scope rather than
     *  searching for the given text. e.g. `scope:inner` or `scope:static,inner`.
     *  @private
     *
     *  @param {*} strSearch - String to be searched for.
     */
    function filterSidebarNodes(strSearch) {
        if (!templateOpts.sidebar.enabled) return;

        strSearch = (strSearch || '').trim().toLowerCase();
        if (!strSearch) {
            cleanFilter();
            return;
        }
        if ($btnClean) $btnClean.show();

        // expand all sub-trees, so any found item is visible
        toggleAllSubTrees(false);
        $('.chevron').hide();
        // set unfold state
        setFoldState(false);

        isFilterActive = true;

        // We set outline to "flat" bec. if outline is "tree", and some symbol
        // parent does not match the search/filter, the indents and tree lines
        // look weird.
        setSidebarNodesOutline('flat');

        debounceApplySearch(strSearch);

        $('.toolbar-buttons > span').css('color', '#3f4450'); // '#7b8395'
    }

    /**
     *  Toggles the sub-tree of the given root member.
     *  @private
     *
     *  @param {JQuery} elem - JQuery element (for the root memeber) whose
     *  sub-tree will be toggled.
     *  @param {Boolean} [fold] - If this value is defined, target element's
     *  sub-tree folded state will be set explicitly, instead of toggling the
     *  current state.
     */
    function toggleSubTree(elem, fold) {
        fold = typeof fold !== 'boolean'
            ? !elem.hasClass('members-folded') // reverse of current state
            : fold;

        var parent;
        if (fold) {
            parent = elem.addClass('members-folded').parent();
            parent.find('.item-members:first').addClass('no-height');
            parent.find('.item-inner > img.item-tree-parent').attr('src', 'img/tree-folded.png');
            // Even if only one is folded, set state as folded and visual state
            // for fold toolbar button.
            setFoldState(true);
        } else {
            parent = elem.removeClass('members-folded').parent();
            parent.find('.item-members:first').removeClass('no-height');
            parent.find('.item-inner > img.item-tree-parent').attr('src', 'img/tree-parent.png');
        }
    }

    /**
     *  Toggles all sub-trees of all root members.
     *  @private
     *
     *  @param {Boolean} fold - Whether sub-trees should be folded or
     *  expanded.
     */
    function toggleAllSubTrees(fold) {
        $('.chevron').each(function () {
            toggleSubTree($(this), fold);
        });
    }

    function setFoldState(folded) {
        var $btni = $btnSwitchFold.find('[data-fa-i2svg]').removeClass('fa-caret-square-right fa-caret-square-down');
        var newCls = !folded
            ? 'fa-caret-square-down'
            : 'fa-caret-square-right';
        isItemsFolded = folded;
        $btni.addClass(newCls);
    }

    /**
     *  Toggles the hamburger menu for the navbar list.
     *  @private
     *  @param {Boolean} show -
     */
    function toggleHamMenu(show) {
        if (!$nbmBtn) return;
        var fn = show ? 'addClass' : 'removeClass';
        $nbmBtn[fn]('toggled');
        $navOverlay[fn]('toggled'); // toggle overlay / backdrop
        $navbarMenu[fn]('toggled');
        // disable body scroll if menu is open
        helper.toggleBodyScroll(!show);

        if (show) {
            // scroll the contents of the responsive collapsed navbar menu to
            // top.
            $navbarMenu.scrollTop(0);
            // if showing responsive collapsed navbar menu, we'll close the
            // sidebar.
            if ($sidebarWrapper && $sidebarWrapper.length) {
                $wrapper.removeClass('toggled');
                $sidebarToggle.removeClass('toggled');
                // also hide the sidebar toggler, so user cannot re-open it
                // while navbar menu is shown. we use opacity instead of
                // display:none bec, it's used by a media query in sidebar.less
                // (the toggler is already hidden in small screens).
                $sidebarToggle.css('opacity', 0);
            }
        } else {
            // show sidebar toggler if responsive collapsed navbar menu is
            // closed.
            $sidebarToggle.css('opacity', 1);
        }
    }

    /**
     *  We'll determine the breakpoint by the navbar menu width. this menu can
     *  have any width since the end-user can add nav-items freely when he/she
     *  builds the documentation. So instead of media queries in CSS (which only
     *  watch for screen widths, not elements), we set the breakpoint here via
     *  JS.
     *  @private
     */
    function breakNavbarMenu() {
        // we set a reference to the actual width on first call.
        if (!navbarMenuActuallWidth) {
            navbarMenuActuallWidth = $navbarMenu.width() || 500;
        }

        // if we have a sidebar (API route), we'll check the difference with the
        // sidebar width, otherwise we'll check with the navbar brand with.
        var diff = $sidebarWrapper && $sidebarWrapper.length ? app.SIDEBAR_WIDTH : $navbarBrand.width();
        var breakMenu = ($navbarInner.width() || 0) - diff <= navbarMenuActuallWidth + 50;
        // console.log($navbarInner.width(), '-', $navbarBrand.width(), '<=', navbarMenuActuallWidth + 50, '»', breakMenu);
        if (breakMenu) {
            if ($nbmBtn.hasClass('break')) return;
            $nbmBtn.addClass('break');
            $navbarMenu.addClass('break');
            $navbarList.addClass('break');
        } else {
            toggleHamMenu(false);
            if (!$nbmBtn.hasClass('break')) return;
            $nbmBtn.removeClass('break');
            $navbarMenu.removeClass('break');
            $navbarList.removeClass('break');
        }
    }

    /**
     *  If location hash is set and we have <details/> element with a matching
     *  ID, we'll open/expand that node.
     *  @private
     */
    function checkOpenDetails() {
        if (docma.location.hash) {
            var elem = $('details#' + $.escapeSelector(docma.location.hash));
            if (elem && elem[0]) elem.attr('open', '');
        }
    }

    // ---------------------------
    // INITIALIZATION
    // ---------------------------

    // http://highlightjs.readthedocs.org/en/latest/api.html#configure-options
    hljs.configure({
        tabReplace: '    ',
        useBR: false
    });

    if (!templateOpts.title) {
        templateOpts.title = docma.app.title || 'Documentation';
    }

    docma.once('ready', function () {
        setTitleSize();
    });

    docma.on('render', function (currentRoute) {
        isApiRoute = currentRoute && currentRoute.type === 'api';

        // remove empty tables (especially for classdesc)
        // trim bec. jQuery treates whitespace as non-empty
        $('table').each(function () {
            $(this).html($.trim($(this).html()));
        });
        $('table:empty').remove();

        $wrapper = $('#wrapper');
        $sidebarWrapper = $('#sidebar-wrapper');
        // $pageContentWrapper = $('#page-content-wrapper');
        $sidebarToggle = $('#sidebar-toggle');

        if (templateOpts.sidebar.animations) {
            $wrapper.addClass('trans-all-ease');
            $sidebarWrapper.addClass('trans-all-ease');
        } else {
            $wrapper.removeClass('trans-all-ease');
            $sidebarWrapper.removeClass('trans-all-ease');
        }

        if (!templateOpts.navbar.enabled) {
            // remove the gap created for navbar
            $('body, html').css('padding-top', 0);
            // remove sidbar top spacing
            $sidebarWrapper.css('margin-top', 0);
            // since navbar is disabled, also remove the spacing set for
            // preventing navbar overlap with bookmark'ed symbol title.
            $('.symbol-container').css({
                'padding-top': 0,
                'margin-top': 0
            });
        } else {
            $navbarInner = $('.navbar-inner');
            $navbarList = $('.navbar-list');
            $navbarBrand = $('.navbar-brand');
            $nbmBtn = $('.navbar-menu-btn');
            $navOverlay = $('.nav-overlay');
            $navbarMenu = $('.navbar-menu');

            if (!templateOpts.navbar.animations) {
                $navOverlay.addClass('no-trans-force');
                $navbarMenu.addClass('no-trans-force');
                $navbarList.addClass('no-trans-force')
                    .find('ul').addClass('no-trans-force');
            }

            // navbar elements style / margin when route type is API.
            var navMargin = isApiRoute ? 55 : 0; // @page-padding-horizontal
            $('.navbar-brand').css({ 'margin-left': navMargin + 'px' });
            $('.navbar-menu').css({ 'margin-right': navMargin + 'px' });

            // toggle navbar menu when hamburger is clicked.
            $nbmBtn.on('click', function () {
                toggleHamMenu(!$navbarMenu.hasClass('toggled'));
            });

            // debounce/break navbar menu on window resize
            var deBreakNavbarMenu = helper.debounce(breakNavbarMenu, 50, false);
            setTimeout(function () {
                breakNavbarMenu(); // initial
                $(window).on('resize', deBreakNavbarMenu);
            }, 300); // need a bit delay to get proper navbarMenuActuallWidth

            // don't navigate to /#
            $navbarList.find('a[href="#"]').on('click', function (event) {
                event.preventDefault();
            });
        }

        // Syntax-Highlight code examples
        var examples = $('#docma-main pre > code');
        examples.each(function (i, block) {
            hljs.highlightBlock(block);
        });

        checkOpenDetails();

        if (isApiRoute === false) {

            // ----------------------------
            // CONTENT-ROUTE-ONLY SECTION
            // ----------------------------

            // For the JSDoc API documentation, our template partials already have
            // styles. So we'll style only some type of elements in other HTML
            // content.

            // We'll add the template's modified table classes
            $('table').addClass('table table-striped table-bordered');

            // set bookmarks for headings with id
            if (templateOpts.contentView.bookmarks) {
                var bmSelector = typeof templateOpts.contentView.bookmarks === 'string'
                    ? templateOpts.contentView.bookmarks
                    : ':header'; // all: "h1, h2, h3, h4, h5, h6"
                $(bmSelector).each(function () {
                    var bmHeading = $(this);
                    var bmId = bmHeading.attr('id');
                    if (bmId) {
                        // also add classes so can be re-styled
                        // easily via templates
                        bmHeading
                            .addClass('zebra-bookmark')
                            // prepend link icon to bookmarks
                            .prepend('<a href="#' + bmId + '"><i class="fas fa-link color-gray-light" aria-hidden="true"></i></a>');
                    }
                });
            }

            // code blocks in markdown files (e.g. ```js) are converted into
            // <code class="lang-js">. we'll add classes for hljs for proper
            // highlighting. e.g. for javascript, hljs requires class="js". So
            // this will be class="lang-js js".

            // this seems unnecessary. somehow, hljs detects it.
            // $("code[class^='lang-']").each(function () {
            //     var cls = $(this).attr('class'),
            //         m = cls.match(/lang\-([^ ]+)/)[1];
            //     if (m) $(this).addClass(m);
            // });

            return;
        }

        // ----------------------------
        // API-ROUTE-ONLY SECTION
        // ----------------------------

        function searchHandler() {
            if (!$txtSearch) return;
            // filter nodes for matched items
            filterSidebarNodes($txtSearch.val());
        }

        var debounceSearchHandler = helper.debounce(searchHandler, 200);

        // gets a click event handler for either scope filter buttons or kind
        // filter buttons.
        function getFilterClickHandler(filter) {
            var isKind = filter === 'kind';
            var has = isKind ? sbSearch.hasKind : sbSearch.hasScope;
            var add = isKind ? sbSearch.addKind : sbSearch.addScope;
            var remove = isKind ? sbSearch.removeKind : sbSearch.removeScope;

            return function (event) {
                var btn = $(this);
                // get scope or kind value from the data- attribute.
                // e.g. data-scope="instance" or data-kind="method"
                var value = (btn.attr('data-' + filter) || '*').toLowerCase();

                // if we already have this filter, we'll remove it
                if (has.call(sbSearch, value)) {
                    remove.call(sbSearch, value);
                } else if (event.shiftKey) {
                    // if shift is pressed, we'll add it (multiple filters, no
                    // duplicates)
                    add.call(sbSearch, value);
                } else {
                    // otherwise, we'll set it as the only filter (replace with
                    // previous)
                    sbSearch[filter] = [value];
                }

                var strSearch;
                if ($txtSearch) {
                    sbSearch.parseKeywords($txtSearch.val());
                    strSearch = sbSearch.toString();
                    $txtSearch.val(strSearch).focus();
                    if ($btnClean) $btnClean.show();
                } else {
                    sbSearch.keywords = [];
                    strSearch = sbSearch.toString();
                }
                filterSidebarNodes(strSearch);
            };
        }

        if (templateOpts.sidebar.enabled) {

            // CAUTION: if modifying this, also update less vars in sidebar.less
            var sidebarHeaderHeight;
            if (templateOpts.sidebar.search) {
                sidebarHeaderHeight = 130;
                if (templateOpts.sidebar.toolbar) sidebarHeaderHeight += app.TOOLBAR_HEIGHT;
            } else {
                sidebarHeaderHeight = app.NAVBAR_HEIGHT;
                if (templateOpts.sidebar.toolbar) sidebarHeaderHeight += (app.TOOLBAR_HEIGHT + 10);
            }

            $('.sidebar-nav-container').css('top', sidebarHeaderHeight);
            $('.sidebar-header').css('height', sidebarHeaderHeight);

            if (templateOpts.sidebar.search) {
                $btnClean = $('.sidebar-search-clean');
                $txtSearch = $('#txt-search');

                if ($btnClean) {
                    $btnClean.hide();
                    $btnClean.on('mousedown', cleanFilter);
                }

                if ($txtSearch) {
                    $txtSearch.on('keyup', debounceSearchHandler);
                    $txtSearch.on('change', searchHandler);
                    $('.sidebar-search-icon').on('click', function () {
                        $txtSearch.focus();
                    });
                    if (templateOpts.sidebar.animations) {
                        $txtSearch.addClass('trans-all-ease');
                    }
                }

            } else {
                $('.sidebar-nav').css('top', '0px');
            }

            $sidebarNodes = $('ul.sidebar-nav .sidebar-item');

            if (templateOpts.sidebar.animations) {
                $sidebarNodes.addClass('trans-height-ease');
            }

            setSidebarNodesOutline();

            $btnSwitchOutline = $('.toolbar-buttons .btn-switch-outline');
            $btnSwitchFold = $('.toolbar-buttons .btn-switch-fold');
            toggleAllSubTrees(isItemsFolded);

            if (!templateOpts.sidebar.collapsed) {
                $wrapper.addClass('toggled');
                $sidebarToggle.addClass('toggled');
            }

            $sidebarToggle.on('click', function (event) {
                event.preventDefault();
                $wrapper.toggleClass('toggled');
                $sidebarToggle.toggleClass('toggled');
            });

            $('.chevron').on('click', function () {
                toggleSubTree($(this));
            });

            if (templateOpts.sidebar.toolbar) {

                var kindButtons = // helper.getSymbolInfo('constant', null, true).badge +
                    helper.getSymbolInfo('namespace', null, true).badge
                    + helper.getSymbolInfo('module', null, true).badge
                    + helper.getSymbolInfo('typedef', null, true).badge
                    + helper.getSymbolInfo('class', null, true).badge
                    + helper.getSymbolInfo('method', null, true).badge
                    + helper.getSymbolInfo('property', null, true).badge
                    + helper.getSymbolInfo('enum', null, true).badge
                    + helper.getSymbolInfo('event', null, true).badge;

                $kindFilters = $('.toolbar-kind-filters').html(kindButtons);
                $kindFilterBtns = $kindFilters.find('.badge-btn')
                    .on('click', getFilterClickHandler('kind'));

                var scopeButtons =
                    helper.getScopeInfo('global').badge
                    + helper.getScopeInfo('static').badge
                    + helper.getScopeInfo('instance').badge
                    + helper.getScopeInfo('inner').badge;

                $scopeFilters = $('.toolbar-scope-filters').html(scopeButtons);
                $scopeFilterBtns = $scopeFilters.find('.badge-scope-btn')
                    .on('click', getFilterClickHandler('scope'));

                $btnSwitchFold.on('click', function () {
                    // disable if search is active
                    if (isFilterActive) return;
                    setFoldState(!isItemsFolded);
                    toggleAllSubTrees(isItemsFolded);
                });

                $btnSwitchOutline.on('click', function () {
                    // disable if search is active
                    // if ($txtSearch && $txtSearch.val() !== '') return;
                    if (isFilterActive) return;

                    var $btn = $(this);
                    var $btni = $btn.find('[data-fa-i2svg]').removeClass('fa-outdent fa-indent');

                    var newOutline, newCls;
                    if (templateOpts.sidebar.outline === 'flat') {
                        newOutline = 'tree';
                        newCls = 'fa-indent';
                    } else {
                        newOutline = 'flat';
                        newCls = 'fa-outdent';
                    }
                    templateOpts.sidebar.outline = newOutline;
                    $btni.addClass(newCls);
                    setSidebarNodesOutline(newOutline);
                });
            }

            if (templateOpts.sidebar.itemsOverflow === 'crop') {
                $sidebarNodes.hover(
                    function () {
                        setInnerMarginLeft($(this));
                    },
                    function () {
                        setInnerMarginLeft($(this), true);
                    }
                );
            }

        } else { // if (templateOpts.sidebar.enabled === false)
            // collapse the sidebar since it's disabled
            $wrapper.removeClass('toggled');
            $sidebarToggle.removeClass('toggled');
        }

        tippy('[title]', {
            placement: 'bottom',
            animation: 'scale',
            duration: 200,
            arrow: true,
            appendTo: document.body,
            zIndex: 9999999,
            theme: 'zebra'
        });

    });

    function setInnerMarginLeft($elem, reset) {
        var $inner = $elem.find('.crop-to-fit > .inner');
        var dMarginLeft = 'data-margin-' + getCurrentOutline();
        var m = parseInt($inner.attr(dMarginLeft), 0) || 0;
        $inner.css('margin-left', reset ? 0 : m);
    }

})();
