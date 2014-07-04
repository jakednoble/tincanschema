var async = require('async');
var schemaUtils = require('./schemaUtils.js');
var fs = require('fs');

var config = {
    schema_name: 'tcapi:special',
    //inFile: 'path/to/json/file'
    //schema: {schema: object}
};

function checkArgs() {
    /* node validate.js file ...
     */

    // Chop ['node', 'validate.js']
    var rest = process.argv.slice(2);

    if (rest.length === 0) throw new Error(
        "No input file! Syntax:\n" +
        "    " + process.argv.slice(0,2).join(' ') + " json_file\n"
    );

    config.inFile = rest[0];
}

function loadSchema(cb) {
    schemaUtils.loadSchemaDir(__dirname + '/schema', function(err, schema) {
        if (err) return cb(err);
        validateSchema(schema);
        config.schema = schema;
        schemaUtils.addSchemaName(schema, config.schema_name);
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
        'Validated as a  ' + ref['$ref'] + '  ...'
    );

    return errors;
}

function validateObject(obj, id) {
    var ref;
    if (id) {
        ref = {'$ref': config.schema_name + '#' + id};
        return validateObjectWithRef(obj, ref);
    }

    console.warn(
        'WARNING: No schema id provided; trying all possibilities' +
        ' (may take a while...)'
    );

    var results = [];
    var errors = {};
    for (id in config.schema.properties) {
        ref = {'$ref': config.schema_name + '#' + id};
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
    console.log('Processing  ' + config.inFile + '  ...');

    loadJson(fpath, function(err, data) {
        if (err) return cb(err);

        var errors = validateObject(data, id);
        if (errors) {
            delete errors.object;

            var msg = "Could not validate the JSON file  " + fpath;
            if (id) msg += "  as a " + config.schema_name + '#' + id;
            msg += '\n==== DATA ====\n' +
                JSON.stringify(data, null, '    ') +
                '\n==== END DATA ====\n' +
                JSON.stringify(errors, null, '    ');
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
    validateJsonFile(config.inFile, null, function(err) {
        console.log('Done.');
        if (err) return cb(err);
        console.log('No errors!');
        cb();
    });
}


//TODO: validate length of mbox_sha1sum
//TODO: language map keys -- really funky rules!
//TODO: objectType hack for statement/substatement improvement?
//TODO: duration validation
//TODO: timestamp/stored validation
//TODO: find out if there is a better way to handle the no additional agent properties thing
//TODO: find out why minItems and maxItems aren't validating

function main() {
    async.series([
        init,
        work,
    ], function(err) {
        if (err) throw err;
    });
}

main();
