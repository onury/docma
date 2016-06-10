(function () {

    // core modules
    var path = require('path');

    // dep modules
    // var fs = require('fs-extra');

    // own modules
    var Docma = require('../../index');

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
                    { label: 'Docma Web Core', href: route('docma-web') },
                    { label: 'Docma Filters', href: route('docma-filters') }
                ]
            },
            {
                iconClass: 'ico-book',
                label: 'API Reference',
                items: [
                    { label: 'Docma (Builder) API', href: route('docma', 'api') },
                    { label: 'Docma (Web) API', href: route('docma-web', 'api') },
                    { label: 'Docma Web Utils', href: route('docma-web-utils', 'api') },
                    { label: 'Test (src)', href: route('src', 'api') },
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
                target: "_blank"
            }
        ];
    }

    describe('build', function () {
        var config = {
            debug: 5,
            jsdoc: {
                encoding: 'utf8',
                recurse: false,
                pedantic: false,
                access: null, // ['private'],
                package: null,
                module: true,
                undocumented: false,
                undescribed: false,
                hierarchy: true,
                sort: true, // "grouped",
                relativePath: path.join(__dirname, '/code'),
                filter: null
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
                path: 'default',
                options: {
                    title: 'Docma',
                    sidebar: true,
                    collapsed: false,
                    badges: true,
                    search: true,
                    navbar: true,
                    navItems: []
                }
            },
            src: [
                './test/input/md-test.md',
                // './test/input/**/*.js',
                './test/input/code.js',
                {
                    'docma': './lib/docma.js',
                    'docma-web': [
                        './lib/web/core.js',
                        './lib/web/core.*.js',
                        '!./lib/web/core.utils.js'
                    ],
                    'docma-web-utils': './lib/web/core.utils.js'
                },
                {
                    'src': [
                        './test/input/private/core/*.js',
                        './test/input/src/lib/*.js'
                    ],
                    'priv': './test/input/private/*.js'
                },
                './doc/**/*.md',
                { 'guide': './README.md' }, // renamed markdown
                './CHANGELOG.md'
            ],
            dest: './test/output' // overwritten in specs
        };

        // beforeAll(function () {});

        it('should build with query-routing', function (done) {
            config.app.routing = 'query';
            config.template.options.navItems = getNavItems(config.app.routing);
            config.dest = 'test/output/query-routing';
            config.app.base = '/javascript/docma/' + config.dest;
            Docma.create()
                .build(config)
                .then(function (success) {
                    expect(success).toEqual(true);
                })
                .catch(function (err) {
                    expect(Boolean(err)).toEqual(false);
                    console.log(err.stack || err);
                })
                .finally(done);
        });

        it('should build with path-routing (for GitHub)', function (done) {
            config.app.routing = 'path';
            config.app.server = 'github';
            config.template.options.navItems = getNavItems(config.app.routing);
            config.dest = 'test/output/path-routing';
            config.app.base = '/javascript/docma/' + config.dest;
            Docma.create()
                .build(config)
                .then(function (success) {
                    expect(success).toEqual(true);
                })
                .catch(function (err) {
                    expect(Boolean(err)).toEqual(false);
                    console.log(err.stack || err);
                })
                .finally(done);
        });

        fit('should build docma documentation', function (done) {
            Docma.create()
                .build('./doc/docma.config.json')
                .then(function (success) {
                    expect(success).toEqual(true);
                })
                .catch(function (err) {
                    expect(Boolean(err)).toEqual(false);
                    console.log(err.stack || err);
                })
                .finally(done);
        });

    });

})();
