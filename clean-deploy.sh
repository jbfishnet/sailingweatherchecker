#!/bin/bash

echo "Starting deep clean deployment..."

# Identify if we're using V1 or V2
if docker compose version >/dev/null 2>&1; then
    DOCKER_CMD="docker compose"
elif docker-compose version >/dev/null 2>&1; then
    DOCKER_CMD="docker-compose"
fi

if [ ! -z "$DOCKER_CMD" ]; then
    echo "Found $DOCKER_CMD. Cleaning up existing environment..."
    $DOCKER_CMD down --remove-orphans 2>/dev/null
fi

# The 'ContainerConfig' bug is caused by metadata mismatch in Docker Compose V1.
# We will manually stop and remove ANY containers related to this project to be sure.
echo "Forcefully removing old containers to clear metadata errors..."
docker ps -a --filter name=sailingweatherchecker --filter name=sailing- -q | xargs -r docker rm -f

# Prune build cache to ensure fresh layers
# echo "Cleaning build cache..."
# docker builder prune -f

echo "Building and starting fresh containers..."
if [ "$DOCKER_CMD" == "docker-compose" ]; then
    # V1: use up with build
    docker-compose up --build -d
else
    # V2
    docker compose up --build -d
fi

echo "Deployment complete!"
