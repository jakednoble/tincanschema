#!/usr/bin/env node

var schemaUtils = require('./lib/schemaUtils.js');
require('./lib/strUtils.js');

var cfg = {};
function printHelp() {
    console.log(
        '\nsplitSchema.js -- ' +
        'take a JSON schema, and save its parts as separate files\n'
    );
    printSyntax();
}

function printSyntax() {
    var fname = process.argv[1].split('/').reverse()[0];
    console.log(
        'Syntax:\n' +
        '    ./' + fname + ' src.json dst_dir\n'
    )
}

function parseArgs() {
    // Chop ['node', 'this_file.js'] -- also works when run as ./this_file.js
    var rest = process.argv.slice(2);

    if (rest[0] && (rest[0].startsWith('-h') || rest[0].startsWith('--h'))) {
        printHelp();
        process.exit(0);
    }

    if (rest.length !== 2) {
        printSyntax();
        throw new Error("Invalid arguments");
    }

    cfg.srcFile = rest[0];
    cfg.dstDir = rest[1];
}

function work() {
    schemaUtils.splitSchemaFile(cfg.srcFile, cfg.dstDir, function(err) {
        if (err) {
            if (err.code === 'ENOENT') {
                err.message = "File '" + err.path + "' does not exist";
            }
            throw err;
        }
        // console.log(cfg.srcFile + ' -> ' + cfg.dstDir);
    });
}

function main() {
    parseArgs();
    work();
}

main();
