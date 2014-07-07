Tin Can Schema tools
====================

validate.js
------------
check the structure of a TinCan JSON file

Requires, in the same directory as 'validate.js', a 'schema' 
folder containing TinCan schema in JSON format.

Syntax:
    ./validate.js file.json [type_id]

splitSchema.js
------------
take a JSON schema, and save its parts as separate files

Syntax:
    ./splitSchema.js src.json dst_dir


joinSchema.js
------------
read a directory of JSON schema, and save them in a single file

Syntax:
    ./joinSchema.js src_dir dst.json

