'use strict';

// core modules
const path = require('path');

// dep modules
// const fs = require('fs-extra');

// own modules
const Docma = require('../index');

function getNavItems(routing) {
    function route(name, type) {
        name = name || '';
        type = type || 'content';
        if (routing === 'path') {
            if (type === 'api') return './api' + (name ? '/' + name : '');
            return './' + name;
        }
        return './?' + type + (name ? '=' + name : '');
    }
    return [
        {
            iconClass: 'ico-mouse-pointer',
            label: 'Guide',
            items: [
                { label: 'Home', href: './' },
                { label: 'Guide', href: route('guide') },
                // { label: 'Building Documentation', href: './' },
                // { label: 'Build Configuration', href: './' },
                { separator: true },
                { label: 'Docma Default Template', href: route('default-template') },
                { separator: true },
                { label: 'Creating Docma Templates', href: route('templates') },
                { label: 'Docma Web Core', href: route('web') },
                { label: 'Docma Filters', href: route('docma-filters') },
                { separator: true },
                { label: 'HTML Page', href: route('page') },
                { label: 'iFrame Page', href: route('iframe') }
            ]
        },
        {
            iconClass: 'ico-book',
            label: 'API Reference',
            items: [
                { label: 'Docma (Builder) API', href: route('docma', 'api') },
                { label: 'Docma (Web) API', href: route('web', 'api') },
                { label: 'Docma Web Utils', href: route('web-utils', 'api') },
                { label: 'Test (src)', href: route('src', 'api') },
                { separator: true },
                { label: 'Test (re)', href: route('re', 'api') },
                { separator: true },
                { label: 'API Not Found', href: route('foo', 'api') },
                { separator: true },
                { label: 'Default', href: route('', 'api') },
                { label: '_def_', href: route('_def_', 'api') }
            ]
        },
        {
            iconClass: 'ico-md ico-download',
            label: 'Download',
            items: [
                { label: 'Change Log', href: route('changelog') },
                { label: 'Markdown Test', href: route('md-test') },
                { separator: true },
                { label: 'index.html', href: 'index.html' }, // or ./index.html
                { separator: true },
                { label: 'Content Not Found', href: route('bar') }
            ]
        },
        {
            iconClass: 'ico-md ico-github',
            label: 'GitHub',
            href: 'https://github.com/onury/docma',
            target: '_blank'
        }
    ];
}

describe('build', () => {
    let config = {
        debug: 16,
        jsdoc: {
            encoding: 'utf8',
            recurse: false,
            pedantic: false,
            access: ['public', 'protected'], // null, // ['private'],
            package: null,
            module: true,
            undocumented: false,
            undescribed: false,
            hierarchy: true,
            sort: true, // "grouped",
            relativePath: path.join(__dirname, '/code'),
            filter: null,
            allowUnknownTags: true,
            dictionaries: ['jsdoc', 'closure'],
            includePattern: '.+\\.js(doc|x)?$',
            excludePattern: '(^|\\/|\\\\)_',
            plugins: []
        },
        // markdown options
        markdown: {
            gfm: true,
            tables: true,
            breaks: false,
            pedantic: false,
            sanitize: false,
            smartLists: true,
            smartypants: false,
            xhtml: false,
            tasks: true,
            emoji: true
        },
        app: {
            title: 'Docma Documentation',
            meta: null,
            base: '/javascript/docma/test/output', // overwritten in specs
            entrance: 'content:guide',
            routing: 'path', // overwritten in specs
            server: 'apache' // overwritten in specs
        },
        template: {
            path: 'zebra',
            options: {
                title: '',
                logo: null,
                sidebar: {
                    enabled: true,
                    outline: 'tree',
                    collapsed: false,
                    toolbar: true,
                    itemsFolded: false,
                    itemsOverflow: 'crop',
                    badges: true,
                    search: true,
                    animations: true
                },
                symbols: {
                    autoLink: true,
                    params: 'list',
                    enums: 'list',
                    props: 'list',
                    meta: false
                },
                contentView: {
                    bookmarks: false
                },
                navbar: {
                    enabled: true,
                    fixed: true,
                    dark: false,
                    animations: true,
                    menu: []
                }
            }
        },
        src: [
            './test/input/md-test.md',
            // './test/input/**/*.js',
            './test/input/code.js',
            {
                "docma": [
                    "./lib/Docma.js",
                    "./lib/Template.js",
                    "./lib/TemplateDoctor.js"
                ],
                "web": [
                    "./lib/web/DocmaWeb.js",
                    "./lib/web/DocmaWeb.Route.js"
                ],
                "web-utils": "./lib/web/DocmaWeb.Utils.js"
            },
            {
                'src': [
                    './test/input/src/lib/*.js'
                ]
            },
            './doc/**/*.md',
            { 'guide': './README.md' }, // renamed markdown
            './CHANGELOG.md',
            {
                'page': './test/input/html-test.html',
                'iframe': './test/input/iframe-test.html'
            }
        ],
        dest: './test/output' // overwritten in specs
    };

    // beforeAll(function () {});

    test('build with query-routing', async () => {
        config.app.routing = 'query';
        config.template.options.navbar.menu = getNavItems(config.app.routing);
        config.dest = 'test/output/query-routing';
        config.app.base = '/';
        await Docma.create()
            .build(config)
            .then(function (success) {
                expect(success).toEqual(true);
            })
            .catch(function (err) {
                console.log(err.stack || err);
                expect(Boolean(err)).toEqual(false);
            });
    });

    test.only('build with path-routing (for GitHub)', () => {
        config.app.routing = 'path';
        config.app.server = 'github';
        config.template.options.navbar.menu = getNavItems(config.app.routing);
        config.dest = 'test/output/path-routing';
        config.app.base = '/'; // '/javascript/docma/' + config.dest;
        return Docma.create()
            .build(config)
            .then(function (success) {
                expect(success).toEqual(true);
            })
            .catch(function (err) {
                console.log(err.stack || err);
                expect(Boolean(err)).toEqual(false);
            });
    });

    test('build docma documentation', () => {
        return Docma.create()
            .build('./docma.json')
            .then(function (success) {
                expect(success).toEqual(true);
            })
            .catch(function (err) {
                console.log(err.stack || err);
                expect(Boolean(err)).toEqual(false);
            });
    });

});
