/*!
 *  Grunt Configurations
 */
module.exports = function (grunt) {
    'use strict';

    // ----------------------------
    //  GRUNT CONFIG
    // ----------------------------

    grunt.initConfig({

        // ----------------------------
        //  CONFIGURE TASKS
        // ----------------------------

        'jasmine_nodejs': {
            options: {
                specNameSuffix: 'spec.js',
                helperNameSuffix: 'helper.js',
                useHelpers: false,
                random: false,
                seed: null,
                defaultTimeout: 10000, // defaults to 5000
                stopOnFailure: false,
                traceFatal: true,
                reporters: {
                    console: {
                        colors: true,
                        cleanStack: 1,
                        verbosity: 4,
                        listStyle: 'indent',
                        activity: false
                    }
                },
                customReporters: []
            },
            unit: {
                specs: ['test/unit/**']
            },
            build: {
                specs: ['test/build/**']
            }
        },

        'watch': {
            test: {
                options: {
                    // Setting `spawn:false` is very problematic. See
                    // grunt-contrib- watch issues. (Default is `spawn:true`)
                    // spawn: false
                },
                files: [
                    'index.js',
                    'lib/**/*.js',
                    'test/unit/*.spec.js'
                ],
                tasks: ['jasmine_nodejs']
            }
        }
    });

    // ----------------------------
    //  LOAD GRUNT PLUGINS
    // ----------------------------

    require('matchdep').filterDev('grunt-*').forEach(grunt.loadNpmTasks);

    // ----------------------------
    //  REGISTER TASKS
    // ----------------------------

    grunt.registerTask('test-build', ['jasmine_nodejs:build']);
    grunt.registerTask('default', ['watch']);

    // Test Server:
    // cd test/output/query-routing
    // python -m SimpleHTTPServer 9000
    // open http://localhost:9000
    // !! Mind the base path !!

    // run docma for specific tests (e.g. issues):
    // node ./bin/docma -c ./test/issue-10/docma.config.json -d ./test/issue-10/docs
    // cd ./test/issue-10/docs
    // python -m SimpleHTTPServer 9001
    // open http://localhost:9001
};
