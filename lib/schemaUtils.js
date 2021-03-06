var fs = require('fs');
var fsUtils = require('./fsUtils.js');
var async = require('async');
var JSV = require('JSV').JSV;
require('./strUtils.js');

var env = JSV.createEnvironment("json-schema-draft-03");
var schemaschema = env.findSchema("http://json-schema.org/draft-03/schema");
exports.SHOULD_VALIDATE = true;
exports.VERBOSE = false;

exports.addSchemaName = function(schema, name) {
    env.createSchema(schema, null, name);
}

exports.validateSchema = function(schema) {
    /*
    Verifies that schema is an Object compliant with
    json-schema-draft-03

    :param schema: schema Object to validate
    schema
    :returns null if no errors and schema is valid
    :returns an error report Object if not valid
     */
    var schemareport = schemaschema.validate(schema);
    if (schemareport.errors.length > 0) return schemareport;
    return null;
};

exports.validate = function(obj, id) {
    /*
    Verifies that json is an Object that complies with schema.

    :param obj: object to verify using schema
    :param schema: schema Object
    :returns null if no errors and obj is valid
    :returns an error report Object if not valid
     */
    var report = env.validate(obj, id);
    if (report.errors.length > 0) return report;
    return null;
};


exports.splitSchema = function(obj, dstPath, callback) {
    /*
    Takes a large schema Object and splits its 'properties' value into
    smaller schema files.

    :param obj: schema Object with a 'properties' member, which is
    another Object
    :param dstPath: destination folder for the individual result
    schema
    :param callback: called as callback(err) when finished
     */

    dstPath = fsUtils.stripTrailingSlashes(dstPath);
    async.auto({
        check_folder: function(callback) {
            fsUtils.getFolder(dstPath, callback);
        },

        write_files: ['check_folder', function(callback) {
            var props = obj.properties;

            async.each(Object.keys(obj.properties), function(name, callback) {
                var fpath = dstPath + "/" + name + ".json";
                exports.writeSchema(props[name], fpath, callback);
            }, callback);
        }],
    }, function(err, results) {
        return callback(err);
    });

};

exports.splitSchemaFile = function(srcPath, dstPath, callback) {
    /*
    Takes a large JSON schema file and splits its 'properties' value
    into smaller schema files.

    :param srcPath: path to JSON schema file
    :param dstPath: destination folder for the individual result
    schema
    :param callback: called as callback(err) when finished
     */
    exports.loadSchema(srcPath, function(err, data) {
        if (err) return callback(err);

        exports.splitSchema(data, dstPath, callback);
    });
};

exports.writeSchema = function(obj, fpath, callback){
    /*
    Saves the schema object obj to fpath as a JSON file.

    :param obj: Object to convert to JSON string and written to fpath
    :param fpath: the file to write the JSON to
    :param callback: called as callback(err) when finished.
     */
    if (exports.SHOULD_VALIDATE) {
        var errorReport = exports.validateSchema(obj);
        if (errorReport) {
            return callback(new Error(
                'Could not save schema; failed validation\n' +
                '==== DATA ====\n' +
                JSON.stringify(obj) +
                '==== END DATA ====\n' +
                JSON.stringify(errorReport, null, '    ')));
        }
    }

    var textData = JSON.stringify(obj, null, "    ");
    fs.writeFile(fpath, textData, {'encoding': 'utf8'}, function(err) {
        if (err) return callback(err);

        if (exports.VERBOSE) console.log("Wrote file:  " + fpath);
        callback();
    });
};

exports.loadSchema = function(srcPath, callback) {
    /*
    Loads a single JSON schema file.

    :param srcPath: the file to read the schema from
    :param callback: called as callback(err, data) when finished. data
    is an Object containing the schema
     */
    if (exports.VERBOSE) console.log("Reading file:  " + srcPath);

    fs.readFile(srcPath, function(err, data) {
        if (err) return callback(err);

        data = JSON.parse(data);

        if (exports.SHOULD_VALIDATE) {
            var errorReport = exports.validateSchema(data);
            if (errorReport) {
                return callback(new Error(
                    'Schema in file ' + srcPath + ' failed validation\n' +
                    '==== DATA ====\n' +
                    data + '\n' +
                    '==== END DATA ====\n' +
                    JSON.stringify(errorReport, null, '    ')));
            }
        }
        callback(null, data);
    });
};

exports.loadSchemaDir = function(srcPath, callback) {
    /*
    Loads a directory of JSON schema files.

    :param srcPath: the directory to read the schema from
    :param callback: called as callback(err, data) when finished. data
    is an Object containing the schema
     */
    srcPath = fsUtils.stripTrailingSlashes(srcPath);
    
    fs.readdir(srcPath, function(err, files) {
        if (err) return callback(err);

        var jsonFiles = files.filter(function(fname) {
            return fname.endsWith('.json');
        });

        if (files.length === 0) {
            return callback(new Error(
                "The directory '" + srcPath + "' has no .json files!"
            ))
        }

        var props = {};
        async.each(jsonFiles, function(fname, each_callback) {
            exports.loadSchema(srcPath + '/' + fname, function(err, data) {
                if (err) return each_callback(err);

                var name = fname.split('.')[0];
                props[name] = data;

                each_callback();
            });
        },
        function(err) {
            if (err) return callback(err);

            var result = {'properties': props};
            callback(null, result);
        });
    });
};
