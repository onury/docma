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

function serve(targetPath, options) {
    const url = `http://localhost:${options.port}`;
    const basePath = options.base;
    const server = express();
    // see https://github.com/expressjs/serve-static
    server.use(basePath, serveStatic(targetPath, {
        fallthrough: false,
        index: indexFiles
    }));
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

    console.info(chalk.cyan(`Starting server @ ${targetPath}`));
    console.info(chalk.cyan(`App base path is: ${options.base}`));
    server.listen(options.port, () => {
        console.log('Serving SPA @', chalk.blue(`${url}${basePath}`));
        console.log('...\n');
    });
}

module.exports = (spaPath, options) => {
    options = _.defaults(options, {
        port: 9000,
        base: null,
        quiet: false
    });

    const pathIsSet = typeof spaPath === 'string' && spaPath.length > 0;
    const baseIsSet = typeof options.base === 'string' && options.base.length > 0;
    let targetPath = pathIsSet
        ? path.resolve(spaPath)
        : process.cwd();
    let basePath = baseIsSet
        ? options.base
        : '/';

    function checkPath() {
        if (!fs.pathExistsSync(targetPath)) {
            console.error(chalk.red(`Cannot serve "${spaPath}". Path does not exist!`));
            return false;
        }
        return true;
    }

    let conf, docmaConfigPath;
    if (!pathIsSet || !baseIsSet) {
        if (!checkPath()) return;
        docmaConfigPath = utils._findDocmaConfigFileSync(targetPath);
        conf = docmaConfigPath ? utils.json.readSync(docmaConfigPath) : null;
    }

    if (conf && !pathIsSet) {
        console.info(chalk.gray(`» Found configuration file @ ${docmaConfigPath}`));
        console.info(chalk.gray('  I will attempt to serve the configured destination.'));
        console.info(chalk.gray('  Provide a path (e.g. "./") to force-serve target directory...\n'));
        // const conf = utils.json.readSync(docmaConfigPath);
        if (conf.dest && typeof conf.dest === 'string') {
            targetPath = path.resolve(process.cwd(), conf.dest);
        }
    }
    if (!checkPath()) return;

    if (conf && !baseIsSet) {
        if (conf.app && typeof conf.app.base === 'string') {
            basePath = conf.app.base;
        }
    }

    options.base = basePath;
    serve(targetPath, options);
};
