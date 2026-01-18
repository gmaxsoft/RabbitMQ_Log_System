const amqp = require('amqplib');

async function sendLog(severity, module, message) {
    const rabbitUrl = process.env.RABBITMQ_URL || 'amqp://localhost';
    const connection = await amqp.connect(rabbitUrl);
    const channel = await connection.createChannel();
    const exchange = 'log_exchange';

    await channel.assertExchange(exchange, 'topic', { durable: false });
    const routingKey = `${module}.${severity}`;

    channel.publish(exchange, routingKey, Buffer.from(message));
    console.log(`[x] Sent ${routingKey}: '${message}'`);

    setTimeout(() => { connection.close(); process.exit(0); }, 500);
}

// Przykład użycia:
sendLog('error', 'auth', 'Nieudana próba logowania!');