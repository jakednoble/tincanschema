var fs = require('fs');
var JSV = require('JSV').JSV;


var env = JSV.createEnvironment("json-schema-draft-03");
var schemaschema = env.findSchema("http://json-schema.org/draft-03/schema");

var allSchema = JSON.parse(fs.readFileSync(__dirname + '/tincan.schema.json', 'utf8'));
var schema = env.createSchema(allSchema, null, 'tcapi:special');

function validateSchema(schema) {
    var schemareport = schemaschema.validate(schema);
    if (schemareport.errors.length > 0) return schemareport;
    return null;
}

function validate(json) {
    //validate a single statement or list of statements
    var report = env.validate(json, {"$ref": "tcapi:special#statementpost"});
    if (report.errors.length > 0) return report;
    return null;
}


if (!process.argv[2]) {
    throw new Error(
        "No input file! Syntax:\n" +
        "    " + process.argv[1] + " <json file>\n"
    );
}

var schemaErrors = validateSchema(schema);
if (schemaErrors) {
    throw new Error(
        "Could not load schema:\n" +
        "    " + JSON.stringify(schemaErrors.errors, null, "    ") + "\n"
    );
}

console.log("Loading  " + process.argv[2] + " ...");
var json = JSON.parse(fs.readFileSync(process.argv[2], 'utf8'));
console.log("Validating...");
var report = validate(json);

//TODO: validate length of mbox_sha1sum
//TODO: language map keys -- really funky rules!
//TODO: objectType hack for statement/substatement improvement?
//TODO: duration validation
//TODO: timestamp/stored validation
//TODO: find out if there is a better way to handle the no additional agent properties thing
//TODO: find out why minItems and maxItems aren't validating


console.log("Done.");
if (report) {
    throw new Error(
        "Validation failed:\n" +
        JSON.stringify(report.errors, null, "    ") + "\n"
    );
} else {
    console.log("No errors!");
}
