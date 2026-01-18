const amqp = require('amqplib');

async function sendLog(severity, module, message) {
    const rabbitUrl = process.env.RABBITMQ_URL || 'amqp://localhost';
    
    try {
        console.log(`[*] Łączę się z RabbitMQ: ${rabbitUrl}`);
        const connection = await amqp.connect(rabbitUrl);
        console.log('[+] Połączenie nawiązane');
        
        const channel = await connection.createChannel();
        const exchange = 'log_exchange';

        await channel.assertExchange(exchange, 'topic', { durable: false });
        const routingKey = `${module}.${severity}`;

        channel.publish(exchange, routingKey, Buffer.from(message));
        console.log(`[x] Wysłano ${routingKey}: '${message}'`);

        setTimeout(async () => { 
            await connection.close();
            console.log('[+] Połączenie zamknięte');
            process.exit(0); 
        }, 500);

    } catch (error) {
        console.error('[!] BŁĄD:', error.message);
        console.error('[!] Stack:', error.stack);
        process.exit(1);
    }
}

// Przykład użycia:
sendLog('error', 'auth', 'Nieudana próba logowania!');