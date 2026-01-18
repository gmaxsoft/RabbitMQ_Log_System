const amqp = require('amqplib');
const { MongoClient } = require('mongodb');

// Te zmienne są pobierane z pliku docker-compose.yml
const RABBITMQ_URL = process.env.RABBITMQ_URL || 'amqp://localhost';
const MONGODB_URL = process.env.MONGODB_URL || 'mongodb://localhost:27017/rabbitmq_logs';
const EXCHANGE_NAME = 'log_exchange';
const BINDING_KEY = process.env.BINDING_KEY || '#';
const CONSUMER_NAME = process.env.CONSUMER_NAME || 'Generic Consumer';

let rabbitConnection = null;
let channel = null;
let mongoClient = null;
let logsCollection = null;

async function connectToMongoDB() {
  try {
    console.log(`[*] ${CONSUMER_NAME} - Łączę się z MongoDB: ${MONGODB_URL}`);
    mongoClient = new MongoClient(MONGODB_URL);
    await mongoClient.connect();
    console.log('[+] Połączenie MongoDB nawiązane');
    
    const db = mongoClient.db('rabbitmq_logs');
    logsCollection = db.collection('messages');
    
    // Tworzenie indeksu na polu timestamp dla lepszej wydajności
    await logsCollection.createIndex({ timestamp: 1 });
    console.log('[+] Indeks MongoDB utworzony');
    
    return true;
  } catch (error) {
    console.error('[!] Błąd połączenia z MongoDB:', error.message);
    return false;
  }
}

async function saveMessageToDatabase(routingKey, message) {
  try {
    if (!logsCollection) {
      console.error('[!] Kolekcja MongoDB nie jest dostępna');
      return false;
    }

    const document = {
      routingKey: routingKey,
      message: message,
      consumer: CONSUMER_NAME,
      timestamp: new Date(),
      bindingKey: BINDING_KEY
    };

    const result = await logsCollection.insertOne(document);
    console.log(`[✓] Zapisano do MongoDB (ID: ${result.insertedId})`);
    return true;
  } catch (error) {
    console.error('[!] Błąd zapisu do MongoDB:', error.message);
    return false;
  }
}

async function startConsumer() {
  try {
    // Najpierw połącz się z MongoDB
    const mongoConnected = await connectToMongoDB();
    if (!mongoConnected) {
      console.log('[*] Próbuję ponownie za 5 sekund...');
      setTimeout(startConsumer, 5000);
      return;
    }

    console.log(`[*] ${CONSUMER_NAME} - Łączę się z RabbitMQ: ${RABBITMQ_URL}`);
    rabbitConnection = await amqp.connect(RABBITMQ_URL);
    console.log('[+] Połączenie RabbitMQ nawiązane');
    
    channel = await rabbitConnection.createChannel();

    await channel.assertExchange(EXCHANGE_NAME, 'topic', { durable: false });

    // Tworzymy tymczasową kolejkę (zostanie usunięta po wyłączeniu kontenera)
    const q = await channel.assertQueue('', { exclusive: true });

    // To jest kluczowy moment - tutaj funkcja decyduje, co będzie odbierać
    await channel.bindQueue(q.queue, EXCHANGE_NAME, BINDING_KEY);

    console.log(` [+] ${CONSUMER_NAME} gotowy! Słucham wzorca: ${BINDING_KEY}`);

    channel.consume(q.queue, async (msg) => {
      try {
        if (msg !== null) {
          const routingKey = msg.fields.routingKey;
          const messageContent = msg.content.toString();
          
          console.log(` [${CONSUMER_NAME}] Odebrano: ${routingKey} -> ${messageContent}`);
          
          // Zapisz wiadomość do bazy danych
          await saveMessageToDatabase(routingKey, messageContent);
          
          channel.ack(msg); // Potwierdzamy odebranie
        }
      } catch (err) {
        console.error(`[!] Błąd przetwarzania wiadomości w ${CONSUMER_NAME}:`, err.message);
        if (msg !== null) channel.nack(msg, false, true); // Odrzuć wiadomość
      }
    });

    // Obsługa graceful shutdown
    process.on('SIGINT', async () => {
      console.log(`\n[*] ${CONSUMER_NAME} - Zamykam połączenia...`);
      if (channel) await channel.close();
      if (rabbitConnection) await rabbitConnection.close();
      if (mongoClient) await mongoClient.close();
      console.log('[+] Wszystkie połączenia zamknięte');
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