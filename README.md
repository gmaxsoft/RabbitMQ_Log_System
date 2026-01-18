# 🐰 RabbitMQ Log System (Node.js + Docker)

Projekt edukacyjny demonstrujący działanie systemów kolejkowych na przykładzie rozproszonego logowania i filtrowania alertów.

## 🚀 O projekcie
Aplikacja symuluje architekturę mikroserwisową, w której różne moduły systemu wysyłają logi o różnych priorytetach, a wyspecjalizowani konsumenci odbierają tylko te wiadomości, które ich interesują.

### Wykorzystane technologie:
* **Node.js** (Producent i Konsumenci)
* **RabbitMQ** (Message Broker)
* **MongoDB** (Baza danych dla logów)
* **Docker & Docker Compose** (Konteneryzacja)
* **amqplib** (Biblioteka AMQP dla Node.js)
* **mongodb** (Driver MongoDB dla Node.js)
* **GitHub Actions** (CI/CD)

---

## 🏗️ Architektura
W projekcie wykorzystano **Topic Exchange**, co pozwala na elastyczne rutowanie wiadomości:

### Komponenty:
* **Producent (Producer):** Wysyła wiadomości co 3 sekundy z losowymi modułami i priorytetami (format: `moduł.poziom`, np. `auth.error`, `payments.info`)
* **Konsument ALERCIARZ:** Odbiera tylko błędy - subskrybuje `*.error`
* **Konsument ARCHIWIZATOR:** Odbiera wszystkie wiadomości - subskrybuje `#`

---

## 🛠️ Jak uruchomić?

### Wymagania:
- Docker i Docker Compose
- Git

### Instalacja i uruchomienie:

1. Sklonuj repozytorium:
   ```bash
   git clone <repo-url>
   cd RabbitMQ_Log_System
   ```

2. Uruchom cały stack:
   ```bash
   docker-compose up --build
   ```

3. Obserwuj logi w konsoli:
   - Producer wysyła logi co 3 sekundy
   - ALERCIARZ wyświetla tylko błędy
   - ARCHIWIZATOR wyświetla wszystko

### Dostęp do panelu RabbitMQ:
- URL: http://localhost:15672
- Login: `guest`
- Hasło: `guest`

### Dostęp do bazy MongoDB:
- Host: `localhost:27017`
- Username: `admin`
- Password: `password`
- Database: `rabbitmq_logs`
- Collection: `messages`

---

## 📋 Zmienne środowiskowe

### Producer:
- `RABBITMQ_URL` - URL do RabbitMQ (domyślnie: `amqp://guest:guest@rabbitmq:5672`)

### Konsumenci:
- `RABBITMQ_URL` - URL do RabbitMQ
- `BINDING_KEY` - Wzorzec wiadomości do subskrypcji (domyślnie: `#`)
- `CONSUMER_NAME` - Nazwa konsumenta w logach
- `MONGODB_URL` - URL do MongoDB (domyślnie: `mongodb://admin:password@mongodb:27017/rabbitmq_logs`)

---

## 📊 Struktura projektu

```
.
├── docker-compose.yml          # Konfiguracja usług Docker
├── .gitignore                  # Ignorowane pliki Git
├── .github/
│   └── workflows/
│       └── ci.yml              # GitHub Actions workflow
├── producer/
│   ├── producer.js             # Kod producenta
│   ├── Dockerfile              # Obraz Docker dla producenta
│   └── package.json            # Zależności Node.js
└── consumer/
    ├── consumer.js             # Kod konsumenta
    ├── Dockerfile              # Obraz Docker dla konsumenta
    └── package.json            # Zależności Node.js
```

---

## 🔧 Funkcjonalności

✅ **Niezawodne połączenia** - automatyczne ponowne próby w przypadku błędu
✅ **Graceful Shutdown** - prawidłowe zamknięcie zasobów na Ctrl+C
✅ **Obsługa błędów** - szczegółowe logowanie błędów z stack trace'ami
✅ **Topic Exchange** - elastyczne routowanie wiadomości
✅ **Multiple Consumers** - wsparcie dla wielu konsumentów z różnymi filtrami
✅ **Persistentna baza danych** - wszystkie logi zapisywane w MongoDB
✅ **Indeksowanie danych** - automatyczne tworzenie indeksów dla wydajności
✅ **Docker Compose** - łatwe uruchomienie całego stacku
✅ **GitHub Actions** - automatyczne testy CI/CD

---

## 🧪 Testowanie

Aby zobaczyć system w akcji:

1. Uruchom `docker-compose up --build`
2. Producer będzie wysyłać logi co 3 sekundy
3. ALERCIARZ będzie wyświetlać tylko błędy
4. ARCHIWIZATOR będzie wyświetlać wszystkie wiadomości
5. Wciśnij Ctrl+C, aby zatrzymać stos

Przykładowy output:
```
producer    | [x] Wysłano: payments.error -> Log zdarzenia z godziny 2026-01-18T10:30:45.123Z
error_logger| [ALERCIARZ] Odebrano: payments.error -> Log zdarzenia z godziny 2026-01-18T10:30:45.123Z
error_logger| [✓] Zapisano do MongoDB (ID: 507f1f77bcf86cd799439011)
archive_logger| [ARCHIWIZATOR] Odebrano: payments.error -> Log zdarzenia z godziny 2026-01-18T10:30:45.123Z
archive_logger| [✓] Zapisano do MongoDB (ID: 507f1f77bcf86cd799439012)
```

---

## 📝 Notatki

- Kolejki są tymczasowe i usuwane po wyłączeniu kontenera
- Exchange jest typu `topic` do elastycznego routowania
- Producent wysyła wiadomości co 3 sekundy z losowymi parametrami
- Każdy konsument otrzymuje kopię wiadomości zgodnie ze swoim filtrem
- MongoDB przechowuje wszystkie wiadomości w kolekcji `messages`
- Dane w MongoDB są persistentne i zachowywane po wyłączeniu kontenera
- Każdy dokument zawiera: `routingKey`, `message`, `consumer`, `timestamp`, `bindingKey`
- Automatycznie tworzony indeks na polu `timestamp` dla szybkiego wyszukiwania

## 💾 Obsługa MongoDB

Konsumenci automatycznie zapisują wszystkie odbrane wiadomości do bazy danych:
- **ALERCIARZ** - zapisuje tylko wiadomości z błędami (`*.error`)
- **ARCHIWIZATOR** - zapisuje wszystkie wiadomości (`#`)

Dane mogą być później przeanalizowane za pomocą MongoDB Query Language lub narzędzi takich jak MongoDB Compass.

---

## 📄 Licencja

Projekt edukacyjny dostępny dla celów nauki i demonstracji.