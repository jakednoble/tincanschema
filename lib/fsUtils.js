var fs = require('fs');

exports.getFolder = function (path, callback) {
    fs.stat(path, function(err, stat) {
        if (err && err.code === 'ENOENT') {
            var permissions = 0777 & ~process.umask();
            return fs.mkdir(path, permissions, callback);
        }
        else if  (stat && !stat.isDirectory()) {
            return callback(new Error(
                "Not a directory:  " + path
            ));
        }
        // else directory exists
        return callback();
    });
}

exports.stripTrailingSlashes = function (path) {
    while (path.endsWith('/') && path.length > 1) {
        path = path.slice(0, -1);
    }
    return path;
}
