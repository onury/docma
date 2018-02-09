'use strict';

const path = require('path');

/**
 *  Zebra
 *  Docma Default Template
 *  @author Onur Yıldırım <onur@cutepilot.com>
 *  @license MIT
 */

module.exports = (template, modules) => {

    const { _, Promise, fs, utils } = modules;

    // Template main HTML file
    template.mainHTML = 'index.html';
    // Template default options.
    template.defaultOptions = {
        title: '',
        logo: null,         // URL String or { dark: String, light: String }
        sidebar: true,
        toolbar: true,
        animations: true,
        collapsed: false,
        outline: 'tree',    // "flat" | "tree"
        foldSymbols: false,
        typeLinks: true,    // "internal" | "external" | true (both)
        badges: true,
        symbolMeta: false,
        search: true,
        navbar: true,
        navItems: []
    };

    // ignore files relative to /template directory. other files in the root of
    // th module directory are already ignored.
    // template.ignore = [];

    template.preBuild(() => {
        // if a string passed to `logo`, we'll set dark and light to this
        // value.
        const logo = template.options.logo;
        if (typeof template.options.logo === 'string') {
            template.options.logo = {
                dark: logo,
                light: logo
            };
        }
    });

    // template.postBuild(() => { });
};
