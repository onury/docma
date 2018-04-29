'use strict';

// -------------------------
// Docma CLI `serve` command
// -------------------------

// core modules
const path = require('path');
// dep modules
const _ = require('lodash');
const fs = require('fs-extra');
const serveStatic = require('serve-static');
const express = require('express');
const chalk = require('chalk');
// own modules
const utils = require('../../lib/utils');

const indexFiles = [];
['index', 'default', 'main', 'home', 'readme', 'guide']
    .forEach(name => indexFiles.push(`${name}.htm`, `${name}.html`));

module.exports = (spaPath, options) => {

    options = _.defaults(options, {
        port: 9000,
        quiet: false
    });

    const url = `http://localhost:${options.port}`;
    const pathIsSet = Boolean(spaPath);
    let servePath = pathIsSet
        ? path.resolve(spaPath)
        : process.cwd();
    let basePath = '/';

    if (!fs.pathExistsSync(servePath)) {
        console.error(chalk.red(`Cannot serve "${spaPath}". Path does not exist!`));
        return;
    }

    const docmaConfigPath = utils._findDocmaConfigFileSync(servePath);
    if (!pathIsSet && docmaConfigPath) {
        console.info(chalk.gray(`» Found configuration file: ${docmaConfigPath}`));
        console.info(chalk.gray(`  I will attempt to serve the configured destination.`));
        console.info(chalk.gray(`  Provide a path (e.g. "./") to force serve target directory...\n`));
        const conf = utils.json.readSync(docmaConfigPath);
        if (conf && typeof conf.dest === 'string') {
            servePath = path.resolve(process.cwd(), conf.dest);
            if (conf.app && typeof conf.app.base === 'string') {
                basePath = conf.app.base;
            }
        }
    }

    console.info(chalk.cyan(`Starting server @ path: ${servePath}`));

    const server = express();
    server.use(basePath, serveStatic(servePath, { fallthrough: false, index: indexFiles }));
    if (basePath !== '/') {
        server.get('/', (req, res) => res.redirect(basePath));
    }

    if (!options.quiet) {
        server.use((req, res, next) => {
            let sColor = 'green';
            if (res.statusCode >= 400) sColor = 'yellow';
            if (res.statusCode >= 500) sColor = 'red';
            console.log(
                chalk.white(req.method.toUpperCase()),
                chalk.gray(req.url),
                chalk.white('•'),
                chalk[sColor](res.statusCode)
            );
            next();
        });
    }
    server.listen(options.port, () => {
        console.log('Serving SPA @', chalk.blue(`${url}${basePath}`));
        console.log('');
    });

};
