#!/bin/bash

echo "Starting clean deployment..."

# Try to stop and remove containers/volumes if they exist
if docker-compose version >/dev/null 2>&1; then
    DOCKER_CMD="docker-compose"
elif docker compose version >/dev/null 2>&1; then
    DOCKER_CMD="docker compose"
fi

if [ ! -z "$DOCKER_CMD" ]; then
    echo "Found $DOCKER_CMD. Cleaning up existing environment..."
    $DOCKER_CMD down --remove-orphans 2>/dev/null
fi

# The 'ContainerConfig' bug is usually tied to stale metadata.
# We will manually remove the images to force a complete rebuild of the layer cache.
echo "Removing existing images to force a fresh build..."
docker rmi sailing-backend:latest sailing-frontend:latest 2>/dev/null

echo "Building and starting containers..."
if [ "$DOCKER_CMD" == "docker-compose" ]; then
    # V1 Fix: perform a full down then up
    docker-compose up --build -d
else
    # V2
    docker compose up --build -d
fi

echo "Deployment complete!"
