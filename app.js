const EventEmitter = require('events');
const architect = require('architect');
const debug = require('debug');
const chalk = require('chalk');
const lodash = require('lodash');
const path = require('path');

const expr = require('./utils/expressions');
const packageJSON = require('./package.json');

const CORE_CONFIG_PATH = path.join(__dirname, 'conf.js');
const EVENTS = {
    APPLICATION_READY: 'APPLICATION:READY',
    APPLICATION_UNCAUGHT_EXCEPTION: 'APPLICATION:UNCAUGHT_EXCEPTION',
    APPLICATION_UNHANDLED_REJECTION: 'APPLICATION:UNHANDLED_REJECTION',
    APPLICATION_SHUTDOWN: 'APPLICATION:SHUTDOWN',
    SERVICE_REGISTERED: 'SERVICE:REGISTERED',
    PLUGIN_REGISTERED: 'PLUGIN:REGISTERED'
};
let shutdownWasCalled = false;
const log = debug(`${packageJSON.name}:app`);

const shutdown = function () {
    expr.whenFalse(shutdownWasCalled, () => {
        shutdownWasCalled = true;
        let counter = this.listeners(EVENTS.APPLICATION_SHUTDOWN).length;
        expr.whenTrue(counter === 0, process.exit.bind(process, 0));

        // count the handlers , and when handler call next, augment +1 counter
        // when counter is equal to the handler , close in a 'sign kill'
        this.emit(EVENTS.APPLICATION_SHUTDOWN, () => {
            counter--;
            if (counter <= 0) {
                // kill process in a sigterm
                process.exit(1);
            }
        });
    });
};

class App extends EventEmitter {

    get events() {
        return EVENTS;
    }

    constructor() {
        super();
        this.services = null;

        process.on('uncaughtException', this.emit.bind(this, EVENTS.APPLICATION_UNCAUGHT_EXCEPTION));
        process.on('unhandledRejection', this.emit.bind(this, EVENTS.APPLICATION_UNHANDLED_REJECTION));
        const bindedShutdown = shutdown.bind(this);
        process.on('SIGINT', bindedShutdown);
        process.on('SIGTERM', bindedShutdown);
    }

    start(configPath) {
        // creating built in core plugins config
        const coreConfig = architect.loadConfig(CORE_CONFIG_PATH);

        // creating client config
        const clientConfig = architect.loadConfig(configPath);

        const config = [...coreConfig, ...clientConfig];

        architect.createApp(config, (err, app) => {
            if (err) {
                log(chalk.red('Was an error creating architect pipe flow app'));
                log(err);
                throw err;
            };

            app.on('service', this.emit.bind(this, EVENTS.SERVICE_REGISTERED));
            app.on('plugin', this.emit.bind(this, EVENTS.PLUGIN_REGISTERED));
            // set services to provide using app.service
            this.services = app.services;
            log(chalk.green('Application is ready :)'));
            this.emit(EVENTS.APPLICATION_READY);
        });
    }

    service(pattern) {
        return lodash.get(this.services, pattern)
    }
}

module.exports = App;