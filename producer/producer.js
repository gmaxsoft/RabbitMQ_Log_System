const amqp = require('amqplib');

// Konfiguracja zmiennych
const RABBITMQ_URL = process.env.RABBITMQ_URL || 'amqp://localhost';
const EXCHANGE_NAME = 'log_exchange';

const modules = ['auth', 'payments', 'orders', 'shipping'];
const severities = ['info', 'warning', 'error'];

let intervalId = null;
let connection = null;

async function startProducer() {
  try {
    console.log(`[*] Łączę się z RabbitMQ: ${RABBITMQ_URL}`);
    
    // 1. Nawiązanie połączenia
    connection = await amqp.connect(RABBITMQ_URL);
    const channel = await connection.createChannel();
    
    console.log('[+] Połączenie nawiązane');

    // 2. Deklaracja Exchange typu 'topic'
    await channel.assertExchange(EXCHANGE_NAME, 'topic', { durable: false });

    console.log(`[!] Producent uruchomiony. Wysyłam logi co 3 sekundy...`);

    // 3. Pętla generująca losowe logi
    intervalId = setInterval(() => {
      try {
        const randomModule = modules[Math.floor(Math.random() * modules.length)];
        const randomSeverity = severities[Math.floor(Math.random() * severities.length)];
        const routingKey = `${randomModule}.${randomSeverity}`;
        
        const message = `Log zdarzenia z godziny ${new Date().toISOString()}`;

        channel.publish(EXCHANGE_NAME, routingKey, Buffer.from(message));
        
        console.log(`[x] Wysłano: ${routingKey} -> '${message}'`);
      } catch (err) {
        console.error('[!] Błąd przy wysyłaniu wiadomości:', err.message);
      }
    }, 3000);

    // Obsługa graceful shutdown
    process.on('SIGINT', async () => {
      console.log('\n[*] Zatrzymuję producenta...');
      if (intervalId) clearInterval(intervalId);
      if (connection) await connection.close();
      console.log('[+] Połączenie zamknięte');
      process.exit(0);
    });

  } catch (error) {
    console.error('[!] Błąd producenta:', error.message);
    console.error('[!] Stack:', error.stack);
    // W razie błędu (np. RabbitMQ jeszcze nie wstał), zrestartuj proces
    console.log('[*] Próbuję ponownie za 5 sekund...');
    setTimeout(startProducer, 5000);
  }
}

startProducer();