#!/usr/bin/env node

var async = require('async');
var fs = require('fs');

var schemaUtils = require('./lib/schemaUtils.js');
require('./lib/strUtils.js');


function isArray(obj) {
    return Object.prototype.toString.call(obj) === '[object Array]';
}


var config = {
    schemaName: 'tcapi:special',
    verbose: false,
    //srcFile: 'path/to/json/file'
    //schema: {schema: object}
    //typeId: 'name_of_type'
};
function printHelp() {
    console.log(
        '\nvalidate.js -- ' +
        'check the structure of a TinCan JSON file\n\n' +
        "Requires, in the same directory as 'validate.js', a 'schema' \n" +
        "folder containing TinCan schema in JSON format.\n"
    );
    printSyntax();
}

function printSyntax() {
    var fname = process.argv[1].split('/').reverse()[0];
    console.log(
        "Syntax:\n" +
        "    ./" + fname + " file.json [type_id]\n"
    )
}

function checkArgs() {
    /* node validate.js file ...
     */

    // Chop ['node', 'validate.js']
    var rest = process.argv.slice(2);

    if (rest[0] && (rest[0].startsWith('-h') || rest[0].startsWith('--h'))) {
        printHelp();
        process.exit(0);
    }

    if (rest.length === 0 || rest.length > 2) {
        printSyntax();
        throw new Error("Invalid arguments")
    }

    config.srcFile = rest[0];
    config.typeId = rest[1];
}

function loadSchema(cb) {
    schemaUtils.loadSchemaDir(__dirname + '/schema', function(err, schema) {
        if (err) return cb(err);
        validateSchema(schema);
        config.schema = schema;
        schemaUtils.addSchemaName(schema, config.schemaName);
        cb();
    });
}

function validateSchema(schema) {
    var schemaErrors = schemaUtils.validateSchema(config.schema);
    if (schemaErrors) throw new Error(
        "Could not load schema\n" +
        JSON.stringify(schemaErrors.errors, null, "    ")
    );
}

function validate(json, id) {
    //validate a single statement or list of statements
    var report = env.validate(json, {"$ref": id});
    if (report.errors.length > 0) return report;
    return null;
}

function loadJson(fpath, cb) {
    /*
    cb is called as cb(err, obj) when finished.
     */
    fs.readFile(fpath, function(err, data) {
        if (err) return cb(new Error(
            'Could not open file  ' + fpath
        ));


        try { data = JSON.parse(data, 'utf8'); }
        catch (err) { return cb(err); }

        cb(null, data);
    });
}

function validateObjectWithRef(obj, ref) {
    /*
    :returns error report if errors found, else
    :returns null
     */
    var errors = schemaUtils.validate(obj, ref);

    if (errors === null) console.log(
        'VALID as a  ' + ref['$ref'] + '  ...'
    );

    return errors;
}

function validateObject(obj, id) {
    var ref;
    if (id) {
        ref = {'$ref': config.schemaName + '#' + id};
        return validateObjectWithRef(obj, ref);
    }

    console.warn(
        'WARNING: No schema id provided; trying all possibilities' +
        ' (may take a while...)'
    );


    var results = [];
    var errors = {};
    for (id in config.schema.properties) {
        ref = {'$ref': config.schemaName + '#' + id};
        var err = validateObjectWithRef(obj, ref);
        if (err === null) results.push(id);
        else {
            errors[id] = err.errors;
        }
    }

    return (results.length > 0) ? null : {
        message: "Could not validate the object",
        object: obj,
        tried: Object.keys(config.schema.properties),
        errors: errors,
    };
}

function validateJsonFile(fpath, id, cb) {
    /*
    cb called as cb(err) when done.
     */
    if (config.verbose) console.log('Processing  ' + config.srcFile + '  ...');

    loadJson(fpath, function(err, data) {
        if (err) return cb(err);

        var errors = validateObject(data, id);

        if (errors) {
            var origMsg = isArray(errors.errors) && errors.errors[0].message;
            if (origMsg && origMsg.startsWith('Unknown schema reference')) {
                return cb(new Error(
                    "UNKNOWN schema type id '" + id + "'\n" +
                    "See '" + __dirname + "/schema' for allowed type ids."
                    ));
            }

            var msg = "INVALID JSON file '" + fpath;
            if (id) msg += "' as a " + config.schemaName + '#' + id;

            if (config.verbose) {
                if (isArray(errors.errors)){
                    // msg += '\n==== DATA ====\n' +
                    //     JSON.stringify(data, null, '    ') +
                    //     '\n==== END DATA ====\n';
                    msg += "\n" + JSON.stringify(errors.errors, null, '    ');
                } else {
                    msg += "\n" + JSON.stringify(errors, null, '    ');
                }
            }
            return cb(new Error(msg));
        }
        cb();
    });
}

function init(cb) {
    checkArgs();
    loadSchema(cb);
}

function work(cb) {
    validateJsonFile(config.srcFile, config.typeId, function(err) {
        if (err) return cb(err);
        cb();
    });
}

function main() {
    async.series([
        init,
        work,
    ], function(err) {
        if (!err) return;
        if (
            err.message.startsWith('INVALID') ||
            err.message.startsWith('UNKNOWN')
        ) {
            console.log(err.message);
            return;
        }
        throw err;
    });
}

main();
