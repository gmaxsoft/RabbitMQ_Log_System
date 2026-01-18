# 🐰 RabbitMQ Log System (Node.js + Docker)

Projekt edukacyjny demonstrujący działanie systemów kolejkowych na przykładzie rozproszonego logowania i filtrowania alertów.

## 🚀 O projekcie
Aplikacja symuluje architekturę mikroserwisową, w której różne moduły systemu wysyłają logi o różnych priorytetach, a wyspecjalizowani konsumenci odbierają tylko te wiadomości, które ich interesują.

### Wykorzystane technologie:
* **Node.js** (Producent i Konsument)
* **RabbitMQ** (Message Broker)
* **Docker & Docker Compose** (Konteneryzacja)
* **amqplib** (Biblioteka AMQP dla Node.js)

---

## 🏗️ Architektura
W projekcie wykorzystano **Topic Exchange**, co pozwala na elastyczne rutowanie wiadomości:
* **Producent (Producer):** Wysyła wiadomości z kluczami typu `moduł.poziom` (np. `auth.info`, `payments.error`).
* **Konsument (Consumer):** Subskrybuje wiadomości pasujące do wzorca (np. `*.error` – aby odbierać błędy ze wszystkich modułów).

---

## 🛠️ Jak uruchomić?

1. Upewnij się, że masz zainstalowany **Docker** oraz **Docker Compose**.
2. Sklonuj repozytorium lub przejdź do folderu projektu.
3. Uruchom cały stack jedną komendą:
   ```bash
   docker-compose up --build