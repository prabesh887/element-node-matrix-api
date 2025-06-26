# Stage 1: Builder (for production install)
FROM node:20-alpine AS builder
WORKDIR /app

COPY package*.json ./
RUN npm install --only=production

COPY . .

# Stage 2: Production image
FROM node:20-alpine
WORKDIR /app

COPY --from=builder /app /app

EXPOSE 3000
CMD ["node", "server.js"]
