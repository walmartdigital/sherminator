const bunyan = require('bunyan');

const packageJSON = require('../../package.json');

module.exports = function (_, imports, register) {
    const config = imports.config;
    const loggingLevel = config.has('loggingLevel') ? config.get(`loggingLevel`) : 'debug';
    const environment = config.util.getEnv(`NODE_ENV`);

    const options = {
        name: packageJSON.name,
        serializers: bunyan.stdSerializers,
        level: loggingLevel,
        environment,
    };
    if (environment !== `production`) {
        options.src = true;
    }

    const logger = bunyan.createLogger(options);

    register(null, {
        logger
    });
}