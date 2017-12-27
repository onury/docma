'use strict';

// core modules
const http = require('http');
const path = require('path');
// dep modules
const _ = require('lodash');
const fs = require('fs-extra');
const serveStatic = require('serve-static');
const finalhandler = require('finalhandler');
const chalk = require('chalk');

const indexFiles = [];
['index', 'default', 'main', 'home', 'readme', 'guide']
    .forEach(name => indexFiles.push(`${name}.htm`, `${name}.html`));

module.exports = (spaPath, options) => {

    options = _.defaults(options, {
        port: 9000,
        quite: false
    });

    const url = `http://localhost:${options.port}`;
    const docmaPath = path.join(__dirname, '..');
    const servePath = spaPath
        ? path.resolve(docmaPath, spaPath)
        : process.cwd();

    if (!fs.pathExistsSync(servePath)) {
        console.error(chalk.red(`Cannot serve "${spaPath}". Path does not exist!`));
        return;
    }

    console.info(chalk.cyan(`Starting server @ path: ${servePath}`));
    const serve = serveStatic(servePath, { index: indexFiles });
    const server = http.createServer((req, res) => {
        if (!options.quite) console.log(chalk.gray(req.method.toUpperCase(), req.url));
        serve(req, res, finalhandler(req, res));
    });

    server.listen(options.port, () => {
        console.log('Serving SPA @', chalk.blue(url));
        console.log('');
    });

};
