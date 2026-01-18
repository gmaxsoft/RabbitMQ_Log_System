
const amqp = require('amqplib');

async function receiveAlerts() {
    const rabbitUrl = process.env.RABBITMQ_URL || 'amqp://localhost';
    const connection = await amqp.connect(rabbitUrl);

    const channel = await connection.createChannel();
    const exchange = 'log_exchange';

    await channel.assertExchange(exchange, 'topic', { durable: false });
    const q = await channel.assertQueue('', { exclusive: true });

    // Subskrybujemy tylko błędy z dowolnego modułu
    channel.bindQueue(q.queue, exchange, '*.error');

    console.log(' [*] Czekam na ALERTY. Aby wyjść: CTRL+C');

    channel.consume(q.queue, (msg) => {
        console.log(` [ALERT CRITICAL] ${msg.fields.routingKey}: ${msg.content.toString()}`);
    }, { noAck: true });
}

receiveAlerts();