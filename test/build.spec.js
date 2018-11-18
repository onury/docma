'use strict';

// core modules
const path = require('path');

// dep modules
// const fs = require('fs-extra');

// own modules
const Docma = require('../index');


describe('build', () => {

    // beforeAll(function () {});

    test('build with query-routing', async () => {
        const config = {
            src: [
                'test/input/*.js',
                {
                    'group': 'test/input/src/**.js',
                    'html-route': 'test/input/html-test.html'
                },
                'test/input/md-test.md'
            ],
            dest: 'test/output/query-routing',
            app: {
                entrance: 'api:group',
                routing: 'query',
                base: '/'
            },
            template: {
                path: 'zebra'
            }
        };
        try {
            await expect(Docma.create().build(config)).resolves.toEqual(true);
        } catch (err) {
            console.log(err.stack || err);
            expect(Boolean(err)).toEqual(false);
        }
    });

    // test.only('build with path-routing (for GitHub)', () => {
    //     config.app.routing = 'path';
    //     config.app.server = 'github';
    //     config.template.options.navbar.menu = getNavItems(config.app.routing);
    //     config.dest = 'test/output/path-routing';
    //     config.app.base = '/'; // '/javascript/docma/' + config.dest;
    //     return Docma.create()
    //         .build(config)
    //         .then(function (success) {
    //             expect(success).toEqual(true);
    //         })
    //         .catch(function (err) {
    //             console.log(err.stack || err);
    //             expect(Boolean(err)).toEqual(false);
    //         });
    // });

    // test('build docma documentation', () => {
    //     return Docma.create()
    //         .build('./docma.json')
    //         .then(function (success) {
    //             expect(success).toEqual(true);
    //         })
    //         .catch(function (err) {
    //             console.log(err.stack || err);
    //             expect(Boolean(err)).toEqual(false);
    //         });
    // });

});
