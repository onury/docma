'use strict';

// core modules
const path = require('path');

// Directory paths for various assets/components of the web core.
const DIR_WEB = path.join(__dirname, 'web');
const DIR_ASSETS = path.join(DIR_WEB, 'assets');
const DIR_WEB_CONF = path.join(DIR_WEB, 'config');
const DIR_COMPS = path.join(DIR_WEB, 'components');
const DIR_DATA = path.join(__dirname, 'data');

module.exports = {
    DIR_WEB,
    DIR_ASSETS,
    DIR_WEB_CONF,
    DIR_COMPS,
    DIR_DATA,

    // docma-web parts
    DOCMA_CORE: path.join(DIR_WEB, 'core.js'),
    DOCMA_CORE_PARTS: path.join(DIR_WEB, 'core.*.js'),

    // components to be compiled into docma-web (unminified files)
    DOCMA_COMPS: [
        path.join(DIR_COMPS, 'dust-core.js'),
        path.join(DIR_COMPS, 'dust-helpers.js'),
        path.join(DIR_COMPS, 'page.js'),
        path.join(DIR_COMPS, 'EventEmitter.js')
    ],

    // this is not compiled, used only for jsdom
    JQUERY: path.join(DIR_COMPS, 'jquery.min.js'),
    // docma base styles (for layout generally, not for styling)
    DOCMA_LESS: path.join(DIR_ASSETS, 'docma.less'),
    // JSON that includes emoji code to twemoji SVG filename mapping
    EMOJI_JSON: path.join(DIR_DATA, 'emoji.json'),
    // Server config files
    APACHE_CONF: path.join(DIR_WEB_CONF, 'htaccess'),
    REDIRECT_HTML: path.join(DIR_WEB_CONF, 'redirect.html')
};
