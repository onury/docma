/* eslint camelcase:0, no-nested-ternary:0, max-depth:0, no-var:0, max-params:0, prefer-template:0, prefer-arrow-callback:0, prefer-spread:0, object-shorthand:0 */

/**
 *  @license
 *  Zebra Template for Docma - app.js
 *  Copyright © 2019, Onur Yıldırım
 *  SVG shapes: CC-BY 4.0
 */
var app = window.app || {};

(function () {
    'use strict';

    app.svg = {};

    /**
     *  @license
     *  CC-BY 4.0, © Onur Yıldırım
     */
    var shapes = {
        square: '<path d="M45.9 52.7H14.1c-3.9 0-7-3.1-7-7V13.8c0-3.9 3.1-7 7-7h31.8c3.9 0 7 3.1 7 7v31.8C52.9 49.5 49.8 52.7 45.9 52.7z"/>',
        circle: '<circle cx="30" cy="30.1" r="24.8"/>',
        diamond: '<path d="M55.6 34.7L34.9 55.4c-2.7 2.7-7.2 2.7-9.9 0L4.4 34.7c-2.7-2.7-2.7-7.2 0-9.9L25.1 4.1c2.7-2.7 7.2-2.7 9.9 0l20.7 20.7C58.4 27.5 58.4 32 55.6 34.7z"/>',
        pentagonUp: '<path d="M10.9 49.9L3.4 26.6c-1-3 0.1-6.2 2.6-8L25.8 4.2c2.5-1.8 5.9-1.8 8.4 0L54 18.6c2.5 1.8 3.6 5.1 2.6 8l-7.6 23.3c-1 3-3.7 5-6.8 5H17.8C14.7 54.8 11.9 52.8 10.9 49.9z"/>',
        pentagonDown: '<path d="M49.1 10.8L56.6 34c1 3-0.1 6.2-2.6 8L34.2 56.5c-2.5 1.8-5.9 1.8-8.4 0L6 42.1c-2.5-1.8-3.6-5.1-2.6-8l7.6-23.3c1-3 3.7-5 6.8-5h24.5C45.3 5.8 48.1 7.8 49.1 10.8z"/>',
        octagon: '<path d="M17.4 53.5L6.5 42.6c-1.3-1.3-2.1-3.1-2.1-5V22.3c0-1.9 0.7-3.6 2.1-5L17.4 6.5c1.3-1.3 3.1-2.1 5-2.1h15.4c1.9 0 3.6 0.7 5 2.1l10.9 10.9c1.3 1.3 2.1 3.1 2.1 5v15.4c0 1.9-0.7 3.6-2.1 5L42.6 53.5c-1.3 1.3-3.1 2.1-5 2.1H22.3C20.4 55.6 18.7 54.8 17.4 53.5z"/>',
        hexagonH: '<path d="M13.7 51.3L3.4 33.5c-1.3-2.2-1.3-4.8 0-7L13.7 8.7c1.3-2.2 3.6-3.5 6.1-3.5h20.5c2.5 0 4.8 1.3 6.1 3.5l10.3 17.8c1.3 2.2 1.3 4.8 0 7L46.3 51.3c-1.3 2.2-3.6 3.5-6.1 3.5H19.7C17.2 54.8 14.9 53.4 13.7 51.3z"/>',
        hexagonV: '<path d="M51.3 46.3L33.5 56.6c-2.2 1.3-4.8 1.3-7 0L8.7 46.3c-2.2-1.3-3.5-3.6-3.5-6.1V19.7c0-2.5 1.3-4.8 3.5-6.1L26.5 3.4c2.2-1.3 4.8-1.3 7 0l17.8 10.3c2.2 1.3 3.5 3.6 3.5 6.1v20.5C54.8 42.8 53.4 45.1 51.3 46.3z"/>'
    };
    shapes.pentagon = shapes.pentagonUp;
    shapes.hexagon = shapes.hexagonV;

    app.svg.shape = function (options) {
        var opts = options || {};
        var shape = opts.shape || 'square';
        var svg = shapes[shape];
        var cls = 'badge-' + shape;
        cls += ' svg-fill-' + (opts.color || 'black');
        if (opts.addClass) cls += ' ' + opts.addClass;
        svg = '<svg xmlns="http://www.w3.org/2000/svg" x="0" y="0" viewBox="0 0 60 60">' + svg + '</svg>';
        var scopeCircle = opts.circleColor
            ? '<div class="badge-scope-circle bg-' + opts.circleColor + '"></div>'
            : '';
        // only add data-kind attr if this is a badge button.
        // badge buttons don't have circleColor (scope circle).
        var dataKind = !opts.circleColor
            ? ' data-kind="' + opts.kind + '"'
            : '';
        var title = (opts.title || '').toLowerCase();
        return '<div class="symbol-badge ' + cls + '" title="' + title + '"' + dataKind + '>' + scopeCircle + '<span>' + (opts.char || '-') + '</span>' + svg + '</div>';
    };

    function getFaHtml(title, color) {
        return '<div class="symbol-badge svg-fill-' + color + '" title="' + title + '"><span></span>'
            + '<i class="fas fa-exclamation-circle color-' + color + '"></i>'
            + '</div>';
    }

    app.svg.warn = function (title) {
        title = title || 'Warning: Check your JSDoc comments.';
        return getFaHtml(title, 'yellow');
    };

    app.svg.error = function (title) {
        title = title || 'Error: Check your JSDoc comments.';
        return getFaHtml(title, 'red');
    };

})();
