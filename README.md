# Configure env file

```bash
cp sample.env .env
```

# 📘 Docker Commands

**1️⃣ Build the Docker image**

```bash
docker build -t email-3pid-api .
```

**2️⃣ Run the container**

```bash
docker run -d \
  -p 3300:3300 \
  --env-file .env \
  --name email-3pid-api \
  email-3pid-api
```

**3️⃣ Connect the container to Synapse database network**

```bash
sudo docker network connect matrix-postgres email-3pid-api
```

# OR RUN THIS SCRIPT

#### Note: all variable names are defined in `docker-rebuild.sh`

```bash
  sudo ./scripts/docker-rebuild.sh
```

---

# 🧪 Curl Commands

## 1️⃣ Check server connection

```bash
curl http://localhost:3300/ping
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
curl http://localhost:3300/db-check
```

✅ Expected output:

```json
{
  "status": "ok",
  "db_time": "..."
}
```

---

## 3️⃣ Bind email to Matrix server

```bash
curl -X POST \
  http://localhost:3300/add-3pid-email/@user:matrix.guardii.ai \
  -H 'Content-Type: application/json' \
  -H 'x-api-key: your_api_key_here' \
  -d '{"email": "test@example.com"}'
```

---

## 4️⃣ Fetch message from event table by `event_id`

```bash
curl -X POST http://localhost:3300/message \
  -H 'x-api-key: your_api_key_here' \
  -H 'Content-Type: application/json' \
  -d '{"eventId": event_id}'

```

✅ Example:

```bash
curl -X POST http://localhost:3300/message \
  -H 'x-api-key: your_api_key_here' \
  -H 'Content-Type: application/json' \
  -d '{"eventId": "$cmjwjpfTqfWjVolOpOldvidya96RHQ-rMrMLZxaaxrc"}'

```

---

## 5️⃣ Redact a Blocked Message by `event_id` & `room_id`

```bash
curl -X POST http://localhost:3300/message/redact \
  -H 'x-api-key: your_api_key_here' \
  -H 'Content-Type: application/json' \
  -d '{
    "eventId": event_id,
    "roomId": room_id
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
