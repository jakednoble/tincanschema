var fs = require('fs');
var async = require('async');
var schemaUtils = require('./schemaUtils.js');


// http://stackoverflow.com/a/1144249
function objectsEqual(x, y) {
    if ( x === y ) return true;
    // if both x and y are null or undefined and exactly the same

    if ( ! ( x instanceof Object ) || ! ( y instanceof Object ) ) return false;
    // if they are not strictly equal, they both need to be Objects

    if ( x.constructor !== y.constructor ) return false;
    // they must have the exact same prototype chain, the closest we can do is
    // test there constructor.

    for ( var p in x ) {
        if ( ! x.hasOwnProperty( p ) ) continue;
        // other properties were tested using x.constructor === y.constructor

        if ( ! y.hasOwnProperty( p ) ) return false;
        // allows to compare x[ p ] and y[ p ] when set to undefined

        if ( x[ p ] === y[ p ] ) continue;
        // if they have the same strict value or identity then they are equal

        if ( typeof( x[ p ] ) !== "object" ) return false;
        // Numbers, Strings, Functions, Booleans must be strictly equal

        if ( ! objectsEqual( x[ p ],  y[ p ] ) ) return false;
        // Objects and Arrays must be tested recursively
    }

    for ( p in y ) {
        if ( y.hasOwnProperty( p ) && ! x.hasOwnProperty( p ) ) return false;
        // allows x[ p ] to be set to undefined
    }
    return true;
}


var dstPath = __dirname + '/schema';
var allSchemaPath = __dirname + '/tincan.schema.json';
var allSchema = null;
function loadAllSchema(callback) {
    schemaUtils.loadSchema(allSchemaPath, function(err, data) {
        if (err) return callback(err);

        allSchema = data;
        callback();
    });
}

function test_splitJoin(callback) {
    schemaUtils.splitSchema(allSchema, dstPath, function(err) {
        if (err) return callback(err);

        var allSchemaResult = schemaUtils.loadSchemaDir(
                dstPath,
                function(err, data){
            if (err) return callback(err);

            if (objectsEqual(data, allSchema)) {
                console.log("Split and joined schema successfully!");
            } else {
                return callback(Error(
                    "Did not get expected result\n" +
                    "==== EXPECTED ====\n" +
                    JSON.stringify(allSchema, null, '    ') + "\n" +
                    "==== END EXPECTED ====\n" +
                    "==== RESULT ====\n" +
                    JSON.stringify(data, null, '    ') + "\n" +
                    "==== END RESULT ===="
                ));
            }
        });
    });
}

function main() {
    async.auto({
        load_all_schema: loadAllSchema,
        test_split_join: ['load_all_schema', test_splitJoin],
    }, function(err) {
        if (err) throw err;
    });
}

main();
