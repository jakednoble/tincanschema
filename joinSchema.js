#!/usr/bin/env node

var schemaUtils = require('./lib/schemaUtils.js');
require('./lib/strUtils.js');

var cfg = {};
function printHelp() {
    console.log(
        '\njoinSchema.js -- ' +
        'read a directory of JSON schema, and save them in a single file\n'
    );
    printSyntax();
}

function printSyntax() {
    var fname = process.argv[1].split('/').reverse()[0];
    console.log(
        'Syntax:\n' +
        '    ./' + fname + ' src_dir dst.json\n'
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

    cfg.srcDir = rest[0];
    cfg.dstFile = rest[1];
}

function work() {
    schemaUtils.loadSchemaDir(cfg.srcDir, function(err, data) {
        if (err) throw err;

        schemaUtils.writeSchema(data, cfg.dstFile, function (err) {
            if (err) throw err;
        })
    });
}

function main() {
    parseArgs();
    work();
}

main();
