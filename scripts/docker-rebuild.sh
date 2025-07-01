#!/bin/bash

CONTAINER_NAME="email-3pid-api"
IMAGE_NAME="email-3pid-api"
PORT=3300
NETWORK_NAME="matrix-postgres"

echo "🛑 Stopping old container..."
docker stop $CONTAINER_NAME 2>/dev/null || true

echo "🗑️ Removing old container..."
docker rm $CONTAINER_NAME 2>/dev/null || true

echo "🐳 Building new Docker image..."
docker build -t $IMAGE_NAME .

echo "🚀 Running new container on port $PORT and connecting to network $NETWORK_NAME..."
docker run -d \
  -p $PORT:$PORT \
  --env-file .env \
  --name $CONTAINER_NAME \
  --network $NETWORK_NAME \
  $IMAGE_NAME

echo "✅ Done! Running at: http://localhost:$PORT"
