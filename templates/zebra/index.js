'use strict';

/**
 *  Zebra - Docma Default Template
 *  @author Onur Yıldırım <onur@cutepilot.com>
 *  @license MIT
 *  @since Docma 2.0.0
 */

module.exports = (template, modules) => {

    // modules: _, Promise, fs, dust, HtmlParser, utils
    const { HtmlParser, utils } = modules;

    const helper = require('./helper')(template, modules);

    // Template main HTML file
    template.mainHTML = 'index.html';

    // Template default options.
    template.defaultOptions = {
        title: 'Documentation',     // String or { label:String, href:String }
        logo: null,                 // URL String or { dark:String, light:String }
        sidebar: {
            enabled: true,
            outline: 'tree',        // "flat" | "tree"
            collapsed: false,
            toolbar: true,
            itemsFolded: false,
            itemsOverflow: 'crop',  // "crop" | "shrink"
            badges: true,           // true | false | <string>
            search: true,
            animations: true
        },
        symbols: {
            autoLink: true,         // "internal" | "external" | true (both)
            params: 'list',         // "list" | "table"
            enums: 'list',          // "list" | "table"
            props: 'list',          // "list" | "table"
            meta: false
        },
        contentView: {
            bookmarks: false,       // Boolean | String (e.g. 'h1,h2,h3')
            faVersion: '5.5.0',
            faLibs: 'all'           // "all" | one or multiple of "solid"|"regular"|"brands" comma separated
        },
        navbar: {
            enabled: true,
            fixed: true,
            dark: false,
            animations: true,
            menu: []
        }
    };

    // ignore files relative to /template directory. other files in the root of
    // th module directory are already ignored.
    // template.ignore = [];

    template.preBuild(() => {

        if (helper.isOldStructureOptions) {
            helper.convertOptionsToNewStructure();
        }

        // else — options provided by the end-user is not in old-structure so we
        // leave the rest to Docma.

        helper.setTitle();
        helper.setDarkLightLogos();
        helper.configNavMenu();
    });

    function logOptsDeprecated() {
        // Display deprecated message at the end if needed
        if (helper.isOldStructureOptions) {
            const optsDeprecated =
                'Zebra Template options structure is changed in v2.0.0. ' +
                'Please update your template options.\n' +
                'See documentation @ https://onury.io/docma/templates/zebra/#Template-Options';
            template.debug.log(); // empty line
            template.debug.warn(optsDeprecated);
        }
    }

    function getFontAwsomeList() {
        const defaults = template.defaultOptions.contentView;
        let version = defaults.faVersion;
        let libs = defaults.faLibs;
        const cv = template.options.contentView;
        if (utils.type(cv) === 'object') {
            version = (cv.faVersion || version).trim().replace(/^v/, '');
            libs = cv.faLibs || libs;
        } else if (cv.icons !== true) {
            return null;
        } // else defaults...

        const base = `//use.fontawesome.com/releases/v${version}/js/`;
        const getScriptObj = name => ({ src: base + name + '.js', defer: 'defer' });

        libs = Array.isArray(libs)
            ? libs.map(lib => String(lib).trim().toLowerCase())
            : (String(libs) || '').toLowerCase().split(/\s*,\s*/g);

        if (libs.indexOf('all') >= 0) return [getScriptObj('all')];

        const list = [];
        if (libs.indexOf('solid') >= 0) list.push(getScriptObj('solid'));
        if (libs.indexOf('regular') >= 0) list.push(getScriptObj('regular'));
        if (libs.indexOf('brands') >= 0) list.push(getScriptObj('brands'));
        if (list.length <= 0) return null;
        if (list.length === 3) return [getScriptObj('all')];
        list.push(getScriptObj('fontawesome')); // include core if not "all"
        return list.reverse();
    }

    template.postBuild(() => {
        const list = getFontAwsomeList();
        if (list && list.length > 0) {
            const destMainHTML = template.getDestPath(template.mainHTML);
            // <script defer src="//use.fontawesome.com/releases/v5.5.0/js/all.js"></script>
            return HtmlParser.fromFile(destMainHTML)
                .then(parser => {
                    return parser.edit((window, $) => {
                        // const head = $('head');
                        const DOM = HtmlParser.DOM;
                        // prepend scripts before any javascript file
                        list.forEach(attrs => {
                            DOM.insertAsFirst(window, 'script', attrs);
                        });
                    });
                })
                .then(parser => {
                    return parser.beautify().writeFile(destMainHTML);
                })
                .then(logOptsDeprecated);
        }
        // else
        logOptsDeprecated();
    });
};
