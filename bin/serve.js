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
// own modules
const utils = require('../lib/utils');

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
    const pathIsSet = Boolean(spaPath);
    let servePath = pathIsSet
        ? path.resolve(docmaPath, spaPath)
        : process.cwd();

    if (!fs.pathExistsSync(servePath)) {
        console.error(chalk.red(`Cannot serve "${spaPath}". Path does not exist!`));
        return;
    }

    const docmaConfigPath = path.join(servePath, 'docma.config.json');
    if (!pathIsSet && fs.pathExistsSync(docmaConfigPath)) {
        console.info(chalk.gray(`» Found docma.config.json @ ${servePath}`));
        console.info(chalk.gray(`  I will attempt to serve the configured destination.`));
        console.info(chalk.gray(`  Provide a path (e.g. "./") to force serve target directory...\n`));
        const conf = utils.json.readSync(docmaConfigPath);
        if (conf && typeof conf.dest === 'string') {
            servePath = path.resolve(docmaPath, conf.dest);
            if (conf.app && typeof conf.app.base === 'string') {
                servePath = utils.path.parentOfBase(servePath, conf.app.base);
            }
        }
    }

    function logRequest(req, res) {
        let sColor = 'green';
        if (res.statusCode >= 400) sColor = 'yellow';
        if (res.statusCode >= 500) sColor = 'red';
        console.log(
            chalk.white(req.method.toUpperCase()),
            chalk.gray(req.url),
            chalk.white('•'),
            chalk[sColor](res.statusCode)
        );
    }

    console.info(chalk.cyan(`Starting server @ path: ${servePath}`));
    const serve = serveStatic(servePath, { index: indexFiles });
    const server = http.createServer((req, res) => {
        if (!options.quite) logRequest(req, res);
        serve(req, res, finalhandler(req, res));
    });

    server.listen(options.port, () => {
        console.log('Serving SPA @', chalk.blue(url));
        console.log('');
    });

};
