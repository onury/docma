'use strict';

/**
 *  ${name} - Docma Template
 *  @author ${author}
 *  @license ${license}
 */

module.exports = (template, modules) => {

    // modules: _, Promise, fs, dust, HtmlParser, utils
    // const { _ } = modules;

    // Template main HTML file
    template.mainHTML = 'index.html';

    // Template default options.
    template.defaultOptions = {
        // e.g.
        // title: '',
        // logo: null
    };

    // ignore files relative to /template directory. other files in the root of
    // th module directory are already ignored.
    // template.ignore = [];

    template.preBuild(() => {
        // any extra operation before the documentation is built. this is
        // optional. Can return a promise if async.
    });

    template.postBuild(() => {
        // any extra operation after the documentation is built. this is
        // optional. Can return a promise if async.
    });
};
