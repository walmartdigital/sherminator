const path = require('path');
const JSONStream = require('JSONStream');
const fs = require('fs');

module.exports = function (options, imports, register) {
    const logger = imports.logger;

    const rawProductsFile = path.normalize(`${__dirname}/../../assets/products.json`);
    const parseStream = JSONStream.parse('*');
    const inputStream = fs.createReadStream(rawProductsFile, {
        highWaterMark: (1 * 1024),
    });

    logger.info(`Creating product read stream to file: ${rawProductsFile}`);
    register(null, {
        productStream: inputStream
            .pipe(parseStream)
    });
}