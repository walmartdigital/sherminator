const path = require('path');

const app = require('../../');

app.start(path.join(__dirname, 'config.js'));

app.on(app.events.APPLICATION_READY, async () => {
    const productStream = app.service('productStream');
    const KafkaProducer = app.service('KafkaProducer');
    const config = app.service('config');
    const logger = app.service('logger');

    const topic = config.get('kafkaTopic');
    const brokers = config.get('kafkaBrokers');

    const kafkaProducer = new KafkaProducer({
        kafkaHost: brokers
    });

    await kafkaProducer.createTopics([topic])

    productStream
        .on('data', async (product) => {
            try {
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
            }
        })
        .on('end', () => {
            logger.info('Reading products.json was finished');
        });
});

app.on(app.events.UNCAUGHT_EXCEPTION, (err) => {
    console.log('error');
});