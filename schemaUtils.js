var fs = require('fs');
var async = require('async');
var JSV = require('JSV').JSV;


var env = JSV.createEnvironment("json-schema-draft-03");
var schemaschema = env.findSchema("http://json-schema.org/draft-03/schema");
exports.SHOULD_VALIDATE = false;

if (typeof String.prototype.endsWith !== 'function') {
    String.prototype.endsWith = function(suffix) {
        return this.indexOf(suffix, this.length - suffix.length) !== -1;
    };
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

exports.validate = function(obj, schema) {
    /*
    Verifies that json is an Object that complies with schema.

    :param obj: object to verify using schema
    :param schema: schema Object
    :returns null if no errors and obj is valid
    :returns an error report Object if not valid
     */
    var report = env.validate(obj, schema);
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
    var props = obj.properties;

    async.each(Object.keys(props), function(name, each_callback) {
        var fpath = dstPath + "/" + name + ".json";
        exports.writeSchema(props[name], fpath, each_callback);
    }, callback);
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
        if (err) { callback(err); return; }

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
            callback(new Error(
                'Could not save schema; failed validation\n' +
                '==== DATA ====\n' +
                JSON.stringify(obj) +
                '==== END DATA ====\n' +
                JSON.stringify(errorReport, null, '    ')));
            return;
        }
    }

    var textData = JSON.stringify(obj, null, "    ");
    fs.writeFile(fpath, textData, {'encoding': 'utf8'}, function(err) {
        if (err) { callback(err); return; }

        console.log("Wrote file:  " + fpath);
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
    console.log('Loading ' + srcPath);
    fs.readFile(srcPath, function(err, data) {
        if (err) { callback(err); return; }

        data = JSON.parse(data);

        if (exports.SHOULD_VALIDATE) {
            var errorReport = exports.validateSchema(data);
            if (errorReport) {
                callback(new Error(
                    'Schema in file ' + srcPath + ' failed validation\n' +
                    '==== DATA ====\n' +
                    data + '\n' +
                    '==== END DATA ====\n' +
                    JSON.stringify(errorReport, null, '    ')));
                return;
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
    fs.readdir(srcPath, function(err, files) {
        if (err) { callback(err); return; }

        var jsonFiles = files.filter(function(fname) {
            return fname.endsWith('.json');
        });

        var props = {};
        async.each(jsonFiles, function(fname, each_callback) {
            exports.loadSchema(srcPath + '/' + fname, function(err, data) {
                if (err) { each_callback(err); return; }

                var name = fname.split('.')[0];
                props[name] = data;

                each_callback();
            });
        },
        function(err) {
            if (err) { callback(err); return; }

            var result = {'properties': props};
            callback(null, result);
        });
    });
};
