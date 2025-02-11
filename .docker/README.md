# Docker Setup

This directory contains Docker configurations for both development and production environments.

## Prerequisites

- Docker and Docker Compose installed
- `.env` file configured (copy from `.env.example`)

## Development Environment

The development environment includes hot-reloading for both the Next.js frontend and Rust backend.

```bash
# Start the development environment
docker compose up --build -d

# View logs
docker compose logs -f

# Stop the environment
docker compose down

# Remove volumes (if needed)
docker compose down -v
```

## Production Environment

The production environment uses optimized builds and minimal images for better security and performance.

### 1. Build Production Images

First, build the production images:

```bash
# Build frontend image
docker build -f .docker/app/Dockerfile.prod -t cedhtools-app:prod ./app

# Build backend image
docker build -f .docker/api/Dockerfile.prod -t cedhtools-api:prod ./api
```

### 2. Start Production Environment

```bash
# Start production services
docker compose -f docker-compose.prod.yml up -d

# View logs
docker compose -f docker-compose.prod.yml logs -f

# Stop production environment
docker compose -f docker-compose.prod.yml down
```

## Environment Variables

Make sure to set these in your `.env` file:

```bash
# App
APP_HOST=0.0.0.0
APP_PORT=3000

# API
API_HOST=0.0.0.0
API_PORT=3100
RUST_LOG=info
RUST_BACKTRACE=1

# MongoDB (Data)
DATA_INITDB_ROOT_USERNAME=admin
DATA_INITDB_ROOT_PASSWORD=password
DATA_INITDB_DATABASE=cedhtools-data
DATA_INITDB_PORT=27017

# MongoDB (User)
USER_INITDB_ROOT_USERNAME=admin
USER_INITDB_ROOT_PASSWORD=password
USER_INITDB_DATABASE=user-data
USER_INITDB_PORT=27018
```

## Container Details

### Development
- Frontend (Next.js):
  - Hot reloading enabled
  - Port: 3000
  - Uses Bun for faster development

- Backend (Rust):
  - Hot reloading with cargo-watch
  - Port: 3100
  - Debug builds for better error messages

### Production
- Frontend:
  - Optimized build
  - Standalone Next.js output
  - Non-root user for security
  - Minimal node:20-slim base image

- Backend:
  - Release build
  - Optimized binary
  - Non-root user for security
  - Minimal debian-slim base image

## Troubleshooting

1. If containers fail to start:
```bash
# Check container logs
docker compose logs [service-name]
```

2. To rebuild a specific service:
```bash
docker compose up -d --build [service-name]
```

3. To clean up completely:
```bash
docker compose down -v
docker system prune -f
```

