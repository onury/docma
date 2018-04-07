'use strict';

// --------------------------------
// Docma CLI `template doctor` command
// --------------------------------

// core modules
const path = require('path');
// dep modules
const chalk = require('chalk');
// own modules
const TemplateDoctor = require('../../lib/TemplateDoctor');
// const utils = require('../../lib/utils');

module.exports = (templatePath, options) => {

    if (!templatePath) {
        templatePath = process.cwd();
        console.log(chalk.cyan(`No path is specified. Checking for Docma template in current working directory...`));
    } else {
        templatePath = path.resolve(templatePath);
        console.log(chalk.cyan(`Checking for Docma template in directory '${templatePath}'...`));
    }

    const doctor = new TemplateDoctor(templatePath, options);
    console.log(chalk.cyan(`Diagnosing npm package: ${doctor.templateName}\n`));
    doctor.diagnose();
    process.exit(0);
};
