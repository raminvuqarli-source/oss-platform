#!/bin/bash

echo "Deploying OSS platform..."

git pull origin main

docker-compose down
docker-compose up -d --build

echo "Deployment complete."
