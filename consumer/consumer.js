
const amqp = require('amqplib');

async function receiveAlerts() {
    const rabbitUrl = process.env.RABBITMQ_URL || 'amqp://localhost';
    
    try {
        console.log(`[*] Łączę się z RabbitMQ: ${rabbitUrl}`);
        const connection = await amqp.connect(rabbitUrl);
        
        console.log('[+] Połączenie nawiązane');
        const channel = await connection.createChannel();
        const exchange = 'log_exchange';

        await channel.assertExchange(exchange, 'topic', { durable: false });
        const q = await channel.assertQueue('', { exclusive: true });

        // Subskrybujemy tylko błędy z dowolnego modułu
        await channel.bindQueue(q.queue, exchange, '*.error');
        console.log('[+] Nasłuchiwanie alertów na pattern: *.error');

        console.log(' [*] Czekam na ALERTY. Aby wyjść: CTRL+C');

        channel.consume(q.queue, (msg) => {
            if (msg) {
                console.log(` [ALERT CRITICAL] ${msg.fields.routingKey}: ${msg.content.toString()}`);
            }
        }, { noAck: true });

        // Obsługa zamykania
        process.on('SIGINT', async () => {
            console.log('\n[*] Zamykam połączenie...');
            await connection.close();
            process.exit(0);
        });

    } catch (error) {
        console.error('[!] BŁĄD:', error.message);
        console.error('[!] Stack:', error.stack);
        process.exit(1);
    }
}

receiveAlerts();