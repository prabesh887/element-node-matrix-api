# Configure env file

```bash
cp sample.env .env
```

# 📘 Docker Commands

# Build and start all services

docker-compose up --build

# Start in detached mode (background)

docker-compose up -d --build

# View logs

docker-compose logs -f
docker-compose logs -f api # API logs only
docker-compose logs -f postgres # Database logs only

# Stop all services

docker-compose down

# Stop and remove all data (reset database)

docker-compose down -v

# Remove all containers and images

docker-compose down -v --rmi all

# Rebuild only the API service

docker-compose build api

# Restart a specific service

docker-compose restart api

# Execute commands in containers

docker-compose exec api sh # Access API container
docker-compose exec postgres psql -U appuser -d appdb # Access database

# 🧪 Curl Commands

## 1️⃣ Check server connection

```bash
curl http://localhost:3300/health
```

✅ Expected output:

```json
{
  "status": "ok",
  "message": "Server is up and running!"
}
```

---

## 2️⃣ Check database connection

```bash
curl http://localhost:3300/health/db
```

✅ Expected output:

```json
{
  "status": "ok",
  "db_time": "..."
}
```

---

## Redact a Blocked Message by `event_id` & `room_id`

```bash
curl -X POST http://localhost:3300/message/redact \
  -H 'x-api-key: your_api_key_here' \
  -H 'Content-Type: application/json' \
  -d '{
    "eventId": event_id,
    "roomId": room_id,
    "reason": "Policy violation"
  }'

```

✅ Example:

```bash
curl -X POST http://localhost:3300/message/redact \
  -H 'x-api-key: your_api_key_here' \
  -H 'Content-Type: application/json' \
  -d '{
    "eventId": "$3YJQ73MH4k3AoVnHwovvKOypmOxXutyjo4NyAwTqnAM",
    "roomId": "!GXQDtzmhtMOoUWqzVS:guardii.ai",
    "reason": "Policy violation"
  }'

```

---

# 🔐 Security Notes

- All **write** and **read** APIs are protected by `x-api-key` header.
- Use a **strong API key** in your `.env` file (`API_KEY=...`).
- Rotate your API key if exposed.
