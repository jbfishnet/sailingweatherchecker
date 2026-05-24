#!/bin/bash

# Detect if docker compose (V2) or docker-compose (V1) is available
if docker compose version >/dev/null 2>&1; then
    DOCKER_CMD="docker compose"
elif docker-compose version >/dev/null 2>&1; then
    DOCKER_CMD="docker-compose"
else
    echo "Error: Neither 'docker compose' nor 'docker-compose' found."
    kill $$ # Safer way to exit the script without triggering the block
fi

echo "Using ${DOCKER_CMD}..."

# Handle the 'ContainerConfig' KeyError in docker-compose V1
if [[ "$DOCKER_CMD" == "docker-compose" ]]; then
    echo "Detected legacy docker-compose (V1). Performing a clean restart to avoid 'ContainerConfig' errors..."
    $DOCKER_CMD down --remove-orphans
fi

$DOCKER_CMD up --build -d
