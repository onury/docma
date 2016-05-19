(function () {

    // dep modules
    var _ = require('lodash'),
        fs = require('fs-extra'),
        path = require('path');

    // own modules
    var Docma = require('../../index');

    describe('build', function () {
        var doc,
            config = {
                template: {
                    path: 'default',
                    document: {
                        title: 'TEST TITLE'
                    },
                    options: {
                        title: 'Wagon',
                        sidebar: true,
                        collapsed: false,
                        search: true,
                        navbar: true,
                        navItems: [
                            {
                                iconClass: 'ico-book',
                                label: 'Documentation',
                                href: ''
                            },
                            {
                                label: 'Test',
                                target: '_blank'
                            },
                            {
                            },
                            {
                                iconClass: 'ico-mouse-pointer',
                                label: 'Demos &amp; Examples',
                                href: 'index.html'
                            },
                            {
                                iconClass: 'ico-md ico-download',
                                label: 'Download',
                                href: 'index.html',
                                items: [
                                    { label: 'First', href: 'index.html' },
                                    { label: 'Second', href: 'index.html' },
                                    { separator: true },
                                    { label: 'Third', href: 'index.html' }
                                ]
                            },
                            {
                                iconClass: 'ico-md ico-github',
                                label: 'GitHub',
                                href: 'https://github.com/onury/docma'
                            }
                        ]
                    }
                },
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
                    sort: "grouped",
                    relativePath: path.join(__dirname, '/code'),
                    filter: null
                },
                // create an extra json file
                // boolean or name of the json file
                dump: true,
                src: [
                    // './test/code/code.js',
                    // './test/code/task-timer.js'
                    // './test/code/**/*.js'
                    './test/code/wagon.js'
                ],
                dest: './test/doc'
            };

        // beforeAll(function () {});

        it('should have created directory', function (done) {
            var docma = new Docma(config);
            docma.build()
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
