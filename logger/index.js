const bunyan = require("bunyan");

const packageJSON = require("../package.json");
const config = require("../config");

const loggingLevel = config.has("logging.level")
  ? config.get(`logging.level`)
  : "debug";
const environment = config.util.getEnv(`NODE_ENV`);

const options = {
  name: packageJSON.name,
  serializers: bunyan.stdSerializers,
  level: loggingLevel,
  environment
};
if (environment !== `production`) {
  options.src = true;
}

module.exports = bunyan.createLogger(options);
