const getCallerFile = () => {
    var originalFunc = Error.prepareStackTrace;
    var callerfile, currentfile;
    try {
        var err = new Error();

        Error.prepareStackTrace = function (err, stack) {
            return stack;
        };

        currentfile = err.stack.shift().getFileName();

        while (err.stack.length) {
            callerfile = err.stack.shift().getFileName();

            if (currentfile !== callerfile) break;
        }
    } catch (e) {}

    Error.prepareStackTrace = originalFunc;

    return callerfile;
}

module.exports = {
    getCallerFile
}