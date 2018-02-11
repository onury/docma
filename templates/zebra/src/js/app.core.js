/* global docma, hljs, $ */
/* eslint camelcase:0, no-nested-ternary:0, max-depth:0, no-var:0, prefer-template:0, prefer-arrow-callback:0, prefer-spread:0, object-shorthand:0 */

var app = window.app || {};

(function () {
    'use strict';

    var helper = app.helper;

    var templateOpts = docma.template.options;

    var $window = $(window);
    var $sidebarNodes, $btnClean, $txtSearch;
    var $wrapper, $sidebarWrapper, $pageContentWrapper, $sidebarToggle;
    var $nbmBtn, $navOverlay, $navbarMenu, $navbarBrand, $navbarInner, $navbarList;
    var $btnSwitchFold, $btnSwitchOutline;
    var navbarMenuActuallWidth;
    var isFilterActive = false;
    var isApiRoute = false;

    // ---------------------------
    // HELPER METHODS
    // ---------------------------

    /**
     *  Cleans the search filter.
     *  @private
     */
    function cleanFilter() {
        if (!templateOpts.sidebar) return;

        $('.badge-btn').removeClass('active');
        if ($txtSearch) $txtSearch.val('').focus();
        $sidebarNodes.removeClass('hidden');
        if ($btnClean) $btnClean.hide();
        $('.toolbar-buttons > span').css('color', '#fff');
        // show back the chevrons within the sidebar symbols.
        $('.chevron').show();
        // reset outline back to initial value
        setTimeout(function () {
            helper.setSidebarNodesOutline(templateOpts.outline);
        }, 100); // with a little delay
        isFilterActive = false;
    }

    /**
     *  Filters the symbol nodes in the API sidebar by the given search string.
     *
     *  Prefix `kind:` will filter by symbol kind rather than searching for the
     *  given text. e.g. `kind: instance-method`. Following kinds can be used:
     *  `global`, `namespace`, `class`, `method`, `instance-method`,
     *  `static-method`, `property`, `instance-property`, `static-property`,
     *  `enum`.
     *  @private
     *
     *  @param {*} strSearch - String to be searched for.
     */
    function filterSidebarNodes(strSearch) {
        if (!templateOpts.sidebar) return;

        var search = (strSearch || '').trim().toLowerCase();
        if (search === '') {
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
        helper.setSidebarNodesOutline('flat');

        // e.g. search filter » "kind: instance-method"
        var reSym = /^\s*kind\s*:\s*/i;
        var filterByKind = reSym.test(search)
            ? search.replace(reSym, '').replace(/[ \t]+/g, '-')
            : null;

        $('.badge-btn').removeClass('active');

        var data;
        var attr = filterByKind ? 'data-kind' : 'data-keywords';
        var find = filterByKind ? filterByKind : search;
        $sidebarNodes.each(function () {
            // get the data to be searched from each node's target attribute.
            data = $(this).attr(attr);
            if (data.indexOf(find) < 0) {
                $(this).addClass('hidden');
            } else {
                $(this).removeClass('hidden');
            }
        });

        $('.toolbar-buttons > span').css('color', '#7b8395');
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
        templateOpts.foldSymbols = folded;
        $btni.addClass(newCls);
    }

    /**
     *  Toggles the hamburger menu for the navbar list.
     *  @private
     *  @param {Boolean} show
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

    docma.on('navigate', function (currentRoute) { // eslint-disable-line
        isApiRoute = currentRoute && currentRoute.type === 'api';
        // when navigated to a #hash / bookmark, make sure navbar does not overlap.
        if (templateOpts.navbar && !isApiRoute) {
            setTimeout(function () {
                $window.scrollTop($window.scrollTop() - (app.NAVBAR_HEIGHT + 20));
            }, 30);
        }
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
        $pageContentWrapper = $('#page-content-wrapper');
        $sidebarToggle = $('#sidebar-toggle');

        if (templateOpts.animations) {
            $wrapper.addClass('trans-all-ease');
            $sidebarWrapper.addClass('trans-all-ease');
        } else {
            $wrapper.removeClass('trans-all-ease');
            $sidebarWrapper.removeClass('trans-all-ease');
        }

        if (!templateOpts.navbar) {
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

            if (!templateOpts.animations) {
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
                // $(window).on('resize', breakNavbarMenu);
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
            if (templateOpts.bookmarks) {
                var bmSelector = typeof templateOpts.bookmarks === 'string'
                    ? templateOpts.bookmarks
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

        function searchEvent() {
            if (!$txtSearch) return;
            // filter nodes for matched items
            filterSidebarNodes($txtSearch.val());
        }

        // CAUTION: if modifying this, also update less vars in sidebar.less
        var sidebarHeaderHeight = templateOpts.search ? 130 : app.NAVBAR_HEIGHT;
        if (templateOpts.toolbar) sidebarHeaderHeight += app.TOOLBAR_HEIGHT;
        $('.sidebar-nav-container').css('top', sidebarHeaderHeight);
        $('.sidebar-header').css('height', sidebarHeaderHeight);

        if (templateOpts.search) {
            $btnClean = $('.sidebar-search-clean');
            $txtSearch = $('#txt-search');

            if ($btnClean) {
                $btnClean.hide();
                $btnClean.on('click', cleanFilter);
            }

            if ($txtSearch) {
                $txtSearch.on('keyup', searchEvent);
                $txtSearch.on('change', searchEvent);
                $('.sidebar-search-icon').on('click', function () {
                    $txtSearch.focus();
                });
            }

        } else {
            $('.sidebar-nav').css('top', '0px');
        }

        var pageContentRow = $pageContentWrapper.find('.row').first();
        if (templateOpts.sidebar) {
            $sidebarNodes = $('ul.sidebar-nav .sidebar-item');

            if (templateOpts.animations) {
                $sidebarNodes.addClass('trans-height-ease');
            }

            helper.setSidebarNodesOutline();

            $btnSwitchOutline = $('.toolbar-buttons .btn-switch-outline');
            $btnSwitchFold = $('.toolbar-buttons .btn-switch-fold');
            toggleAllSubTrees(templateOpts.foldSymbols);

            if (!templateOpts.collapsed) {
                $wrapper.addClass('toggled');
                $sidebarToggle.addClass('toggled');
            }

            $sidebarToggle.on('click', function (event) {
                event.preventDefault();
                $wrapper.toggleClass('toggled');
                $sidebarToggle.toggleClass('toggled');
                // add some extra spacing if navbar is disabled; to prevent top
                // left toggle button to overlap with content.
                if (!templateOpts.navbar) {
                    var hasToggled = $wrapper.hasClass('toggled');
                    var marginLeft = hasToggled ? '+=30px' : '-=30px';
                    if (templateOpts.animations) {
                        pageContentRow.animate({
                            'margin-left': marginLeft
                        }, 300);
                    } else {
                        pageContentRow.css('margin-left', marginLeft);
                    }
                }
            });

            $('.chevron').on('click', function () {
                toggleSubTree($(this));
            });

            if (templateOpts.toolbar) {

                var filterButtons = helper.getSymbolInfo('global', true).badge
                    + helper.getSymbolInfo('namespace', true).badge
                    + helper.getSymbolInfo('class', true).badge
                    + helper.getSymbolInfo('instance-method', true).badge
                    + helper.getSymbolInfo('static-method', true).badge
                    + helper.getSymbolInfo('instance-property', true).badge
                    + helper.getSymbolInfo('static-property', true).badge
                    + helper.getSymbolInfo('enum', true).badge;
                    // + helper.getSymbolInfo('inner', true).badge;

                $('.toolbar-filters')
                    .html(filterButtons)
                    .find('.badge-btn')
                    .on('click', function () {
                        var btn = $(this);
                        if (btn.hasClass('active')) {
                            cleanFilter();
                            return;
                        }
                        var strSearch = ($(this).attr('title') || '').toLowerCase().replace(/[ ]+/g, '-');
                        strSearch = 'kind: ' + strSearch;
                        if ($txtSearch) {
                            $txtSearch.val(strSearch).focus();
                            if ($btnClean) $btnClean.show();
                        }
                        filterSidebarNodes(strSearch);
                        btn.addClass('active');
                    });

                $btnSwitchFold.on('click', function () {
                    // disable if search is active
                    if (isFilterActive) return;
                    setFoldState(!templateOpts.foldSymbols);
                    toggleAllSubTrees(templateOpts.foldSymbols);
                });

                $btnSwitchOutline.on('click', function () {
                    // disable if search is active
                    // if ($txtSearch && $txtSearch.val() !== '') return;
                    if (isFilterActive) return;

                    var $btn = $(this);
                    var $btni = $btn.find('[data-fa-i2svg]').removeClass('fa-outdent fa-indent');

                    var newOutline, newCls;
                    if (templateOpts.outline === 'flat') {
                        newOutline = 'tree';
                        newCls = 'fa-indent';
                    } else {
                        newOutline = 'flat';
                        newCls = 'fa-outdent';
                    }
                    templateOpts.outline = newOutline;
                    $btni.addClass(newCls);
                    helper.setSidebarNodesOutline(newOutline);
                });
            }
        } else { // if (templateOpts.sidebar === false)
            // collapse the sidebar since it's disabled
            $wrapper.removeClass('toggled');
            $sidebarToggle.removeClass('toggled');
        }

    });

})();
