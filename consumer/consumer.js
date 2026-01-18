const amqp = require('amqplib');

// Te zmienne są pobierane z pliku docker-compose.yml
const RABBITMQ_URL = process.env.RABBITMQ_URL || 'amqp://localhost';
const EXCHANGE_NAME = 'log_exchange';
const BINDING_KEY = process.env.BINDING_KEY || '#';
const CONSUMER_NAME = process.env.CONSUMER_NAME || 'Generic Consumer';

let connection = null;
let channel = null;

async function startConsumer() {
  try {
    console.log(`[*] ${CONSUMER_NAME} - Łączę się z RabbitMQ: ${RABBITMQ_URL}`);
    connection = await amqp.connect(RABBITMQ_URL);
    console.log('[+] Połączenie nawiązane');
    
    channel = await connection.createChannel();

    await channel.assertExchange(EXCHANGE_NAME, 'topic', { durable: false });

    // Tworzymy tymczasową kolejkę (zostanie usunięta po wyłączeniu kontenera)
    const q = await channel.assertQueue('', { exclusive: true });

    // To jest kluczowy moment - tutaj funkcja decyduje, co będzie odbierać
    await channel.bindQueue(q.queue, EXCHANGE_NAME, BINDING_KEY);

    console.log(` [+] ${CONSUMER_NAME} gotowy! Słucham wzorca: ${BINDING_KEY}`);

    channel.consume(q.queue, (msg) => {
      try {
        if (msg !== null) {
          console.log(` [${CONSUMER_NAME}] Odebrano: ${msg.fields.routingKey} -> ${msg.content.toString()}`);
          channel.ack(msg); // Potwierdzamy odebranie
        }
      } catch (err) {
        console.error(`[!] Błąd przetwarzania wiadomości w ${CONSUMER_NAME}:`, err.message);
        if (msg !== null) channel.nack(msg, false, true); // Odrzuć wiadomość
      }
    });

    // Obsługa graceful shutdown
    process.on('SIGINT', async () => {
      console.log(`\n[*] ${CONSUMER_NAME} - Zamykam połączenie...`);
      if (channel) await channel.close();
      if (connection) await connection.close();
      console.log('[+] Połączenie zamknięte');
      process.exit(0);
    });

  } catch (error) {
    console.error(`[!] Błąd w ${CONSUMER_NAME}:`, error.message);
    console.error('[!] Stack:', error.stack);
    console.log('[*] Próbuję ponownie za 5 sekund...');
    setTimeout(startConsumer, 5000); // Ponów próbę za 5 sekund
  }
}

startConsumer();