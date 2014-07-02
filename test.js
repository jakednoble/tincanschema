var fs = require('fs');
var schemaUtils = require('./schemaUtils.js');


var dstPath = __dirname + '/schema';
// var allSchema = JSON.parse(fs.readFileSync(__dirname + '/tincan.schema.json', 'utf8'));
var allSchema = null;
function loadAllSchema(callback) {
    schemaUtils.loadSchema(__dirname + '/tincan.schema.json',
        function(err, data) {
            if (err) { callback(err); return; }

            allSchema = data;
            callback();
        }
    );
}


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


function test_serializeDeserialize(callback) {
    schemaUtils.splitSchema(allSchema, dstPath, function(err) {
        if (err) { callback(err); return; }

        var allSchemaResult = schemaUtils.loadSchemaDir(dstPath, function(err, data){
            if (err) { callback(err); return; }

            if (objectsEqual(data, allSchema)) {
                console.log("Split and combined schema successfully!");
            } else {
                callback(Error(
                    "Did not get expected result\n" +
                    "==== EXPECTED ====\n" +
                    expected + "\n" +
                    "==== END EXPECTED ====\n" +
                    "==== RESULT ====\n" +
                    result + "\n" +
                    "==== END RESULT ===="
                ));
                return;
            }
        });
    });
}

function main() {
    loadAllSchema(function(){
        test_serializeDeserialize(function(){});
    });
}

main();
