const path = require('path');

const app = require('../../');
const config = require('../../config');
const logger = require('../../logger');

app.start(path.join(__dirname, 'config.js'));

app.on(app.events.APPLICATION_READY, async () => {
    const productStream = app.service('productStream');
    const KafkaProducer = app.service('KafkaProducer');

    const topic = config.get('kafkaTopic');
    const brokers = config.get('kafkaBrokers');
    let send = 0,
        sended = 0,
        intervalRef;

    const kafkaProducer = new KafkaProducer({
        kafkaHost: brokers
    });

    await kafkaProducer.createTopics([topic])

    productStream
        .on('data', async (product) => {
            try {
                send++;
                const data = await kafkaProducer.send([{
                    topic,
                    messages: JSON.stringify(product),
                    attributes: 1,
                }]);
                logger.debug(`Product sended: id: ${product.SKUID}, insertion data: ${JSON.stringify(data)}`);
            } catch (error) {
                logger.error(`Error sending product: ${product.SKUID}`);
                logger.debug({
                    err: error // std serializer interpret the err property
                })
            } finally {
                sended++;
            }
        })
        .on('end', () => {
            logger.info('Reading products.json was finished');

            intervalRef = setInterval(() => {
                logger.info('Checking if product sending is finished');
                if (send === sended) {
                    clearInterval(intervalRef);
                    logger.info('All products were sended, bye bye :)');
                    process.exit(0);
                }
                logger.info('Product sending is in process, checking again in one second');
            }, 1000);
        });
});

app.on(app.events.APPLICATION_UNHANDLED_REJECTION, (reason, p) => {
    const msg = `Unhandled Rejection at: ${p}, reason: ${reason}`;
    logger.error(msg);
    throw new Error(msg);
});

app.on(app.events.APPLICATION_UNCAUGHT_EXCEPTION, (err) => {
    logger.error({
        err
    }, `UncaughtException`);
});