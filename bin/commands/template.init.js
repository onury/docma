'use strict';

// --------------------------------
// Docma CLI `template init` command
// --------------------------------

// core modules
const path = require('path');
// dep modules
const Promise = require('bluebird');
const _ = require('lodash');
const fs = require('fs-extra');
const inquirer = require('inquirer');
const chalk = require('chalk');
const checkNpmName = require('npm-name');
// own modules
const TemplateDoctor = require('../../lib/TemplateDoctor');
const utils = require('../../lib/utils');

// constants
const RE_EMAIL = /^[\w-]+(\.[\w-]+)*@([a-z0-9-]+(\.[a-z0-9-]+)*?\.[a-z]{2,6}|(\d{1,3}\.){3}\d{1,3})(:\d{4})?$/i;
const INIT_DIR_PATH = path.join(__dirname, '..', '..', 'lib', '_init');

module.exports = rootDirPath => {

    console.log(chalk.white('Welcome! This will initialize a new Docma Template.'));
    console.log(chalk.gray('Note that entered information will also be used in your package.json'));

    if (!rootDirPath) {
        rootDirPath = process.cwd();
        console.log(chalk.cyan('No path is specified. Using current working directory...\n'));
    } else {
        rootDirPath = path.resolve(rootDirPath);
        console.log(chalk.cyan(`Template will be initialized in directory '${rootDirPath}'...\n`));
    }

    // inner /template directory path
    const templateDirPath = path.join(rootDirPath, 'template');

    // --------------------------------
    // HELPER METHODS
    // --------------------------------

    function checkRootDir() {
        return fs.pathExists(rootDirPath)
            .then(exists => {
                if (!exists) {
                    // throw new Error(chalk.red(`Target directory does not exist: '${rootDirPath}'`));
                    return fs.ensureDir(rootDirPath).then(() => rootDirPath);
                }
                return fs.lstat(rootDirPath)
                    .then(stats => {
                        if (!stats.isDirectory()) {
                            throw new Error(chalk.red(`Target path is not a directory: '${rootDirPath}'\n`));
                        }
                        return utils.fs.isEmptyDir(rootDirPath);
                    })
                    .then(empty => {
                        if (!empty) {
                            throw new Error(chalk.yellow(`Target directory is not empty: '${rootDirPath}'\n`));
                        }
                        return rootDirPath;
                    });
            });
    }

    function parseWriteFile(answers, src, dest) {
        return fs.readFile(src, 'utf8')
            .then(content => {
                // parse content with ${key} placeholders
                _.each(answers, (value, key) => {
                    const reKey = new RegExp('\\$\\{' + key + '\\}', 'gi');
                    content = (content || '').replace(reKey, String(value));
                });
                return fs.outputFile(dest, content, 'utf8');
            });
    }

    function getPackageData(answers) {
        const pkg = {
            name: answers.fullName,
            version: answers.version,
            description: answers.description,
            repository: answers.repository,
            license: answers.license,
            author: answers.author,
            main: 'index.js',
            files: [
                'template/',
                'index.js',
                'LICENSE'
            ],
            keywords: [
                'docma',
                'template'
            ],
            peerDependencies: {
                'docma': '>=' + answers.minDocmaVersion
            }
        };
        return JSON.stringify(pkg, null, '  ');
    }

    function generate(answers) {
        return Promise.resolve()
            .then(() => {
                const pkgFile = path.join(rootDirPath, 'package.json');
                return fs.outputFile(pkgFile, getPackageData(answers));
            })
            .then(() => {
                return fs.copy(path.join(INIT_DIR_PATH, 'template'), templateDirPath);
            })
            .then(() => {
                return parseWriteFile(
                    answers,
                    path.join(INIT_DIR_PATH, 'README.md'),
                    path.join(rootDirPath, 'README.md')
                );
            })
            .then(() => {
                return parseWriteFile(
                    answers,
                    path.join(INIT_DIR_PATH, 'index.js'),
                    path.join(rootDirPath, 'index.js')
                );
            })
            .then(() => {
                // we have a formatted MIT license in the init-dir.
                // if user has set the license to MIT, we'll parse/use this.
                // otherwise, user needs to provide own license file.
                if (answers.license.toLowerCase() === 'mit') {
                    return parseWriteFile(
                        answers,
                        path.join(INIT_DIR_PATH, 'LICENSE-MIT'),
                        path.join(rootDirPath, 'LICENSE')
                    );
                }
                return null;
            });
    }

    // --------------------------------
    // INQUIRER QUESTIONS (in order)
    // --------------------------------

    const questions = [
        {
            type: 'input',
            message: 'Template name:',
            name: 'name',
            filter(input) {
                // remove docma-template prefix if any
                return TemplateDoctor.removePrefix(input).trim().toLowerCase();
            },
            validate(input) {
                const name = TemplateDoctor.removePrefix(input).trim().toLowerCase();
                return Promise.resolve()
                    .then(() => {
                        const ins = TemplateDoctor.inspectName(name);
                        if (!ins.valid) return ins.message;
                        const pkgName = TemplateDoctor.TEMPLATE_PREFIX + name;
                        return checkNpmName(pkgName)
                            .then(available => {
                                if (!available) {
                                    return `Package name "${pkgName}" is already taken.`;
                                }
                                return true;
                            });
                    });
            }
        },
        {
            type: 'input',
            message: 'Template version:',
            name: 'version',
            default: '1.0.0',
            validate(input) {
                const ins = TemplateDoctor.inspectVersion(input);
                if (ins.valid) {
                    // might have a message even if version is valid
                    if (ins.message) console.log('\n' + chalk.yellow(ins.message));
                    return true;
                }
                return ins.message;
            }
        },
        {
            type: 'input',
            message: 'Short description:',
            name: 'description',
            default: '',
            filter(input) {
                return utils.removeNewLines(input, ' ').trim();
            }
        },
        {
            type: 'input',
            message: 'Minimum Docma version supported:',
            name: 'minDocmaVersion',
            default: '2.0.0',
            validate(input) {
                const ins = TemplateDoctor.inspectMinDocmaVersion(input);
                return !ins.valid ? ins.message : true;
            }
        },
        {
            type: 'input',
            message: 'License name:',
            name: 'license',
            default: 'MIT',
            validate(input) {
                const lic = Boolean((input || '').trim());
                if (!lic) return 'Please enter a valid license name.';
                return true;
            },
            filter(input) {
                return utils.removeNewLines(input || '').trim();
            }
        },
        {
            type: 'input',
            message: 'Author name:',
            name: 'authorName',
            filter(input) {
                return utils.removeNewLines(input).trim();
            },
            validate(input) {
                if (!input || utils.removeNewLines(input).trim() === '') {
                    return 'Please enter your full name.';
                }
                return true;
            }
        },
        {
            type: 'input',
            message: 'Author email:',
            name: 'authorEmail',
            default: '',
            filter(input) {
                return utils.removeNewLines(input).trim();
            },
            validate(input) {
                if (input !== '' && !RE_EMAIL.test(input)) {
                    return 'Invalid email addres.';
                }
                return true;
            }
        },
        {
            type: 'input',
            message: 'Repository address:',
            name: 'repository',
            filter(input) {
                return utils.removeNewLines(input).trim();
            }
        }
    ];

    // --------------------------------
    // INIT ROUTINE
    // --------------------------------

    Promise.resolve(checkRootDir()) // wrap with Bluebird promise
        .then(() => {
            return inquirer.prompt(questions);
        })
        .then(answers => {
            answers.year = (new Date()).getFullYear();
            answers.fullName = TemplateDoctor.TEMPLATE_PREFIX + answers.name;
            answers.author = answers.authorName;
            if (answers.authorEmail) {
                answers.author = answers.author + ' <' + answers.authorEmail + '>';
            }
            return generate(answers);
        })
        .then(() => {
            console.log();
            console.log(chalk.green.bold('Your template is initialized successfully.'));
            console.log();
            console.log(chalk.white.bold.underline('Reminders:\n'));
            console.log(chalk.cyan('- This is just a starting point for your template. Go through the generated files and modify them.'));
            console.log(chalk.cyan('- You can run `docma template doctor` to diagnose your template while developing.'));
            console.log(chalk.cyan('- Check out generated package.json for module configuration.'));
            console.log(chalk.cyan('- Once you complete your template, make sure you publish it to npm.'));
            console.log(chalk.cyan('- Please test your template thoroughly before you publish.'));
            console.log();
            process.exit(0);
        })
        .catch(error => {
            console.log();
            console.log(chalk.red.bold('Template initialization has failed!'));
            console.log(chalk.red(error.message));
            console.log();
            process.exit(1);
        });

};
