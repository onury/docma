#!/usr/bin/env node

var Docma = require('./lib/docma');
var argv = require('minimist')(process.argv.slice(2));

var config;

if(argv.f) {
  config = argv.f; // -f (read from config file)
} else {
  config = {};
  config.dest = argv.o; // -o (output dir)
  config.src = argv._; // (input [file ...])
}

Docma.create().build(config).catch(function (error) {
  console.log(error);
});
