# CEDHTools Docker Setup

This directory contains Docker configurations for running the cedhtools application, a comprehensive platform for competitive EDH (Commander) Magic: The Gathering players. The application consists of a Next.js frontend, Rust backend, and multiple databases for efficient data management.

## Application Overview

cedhtools is built with the following core components:

- **Frontend**: Next.js 15 application with:
  - Server and client components
  - Authentication system using NextAuth.js
  - Modern UI using Tailwind CSS
  - Real-time updates and interactions
  - Mobile-responsive design

- **Backend**: Rust API service providing:
  - High-performance data processing
  - RESTful API endpoints
  - WebSocket support for real-time features
  - Efficient data aggregation and analysis

- **Databases**:
  - TimescaleDB (Data): Stores game data, card information, tournament results
  - PostgreSQL (User): Manages user accounts, authentication, and sessions

## Prerequisites

- Docker Engine 24.0.0 or later
- Docker Compose V2
- At least 4GB of available RAM
- Git
- A Gmail account for email services (or alternative SMTP provider)
- Google OAuth credentials (for social login)

## Initial Setup

1. Clone the repository and navigate to the docker directory:
```bash
git clone https://github.com/yourusername/cedhtools.git
cd cedhtools/.docker
```

2. Create and configure environment variables:
```bash
cp .env.example .env
# Edit .env with your configuration
```

3. Generate a NextAuth secret:
```bash
openssl rand -base64 32
# Add the output to NEXTAUTH_SECRET in your .env file
```

4. Set up Google OAuth:
   - Go to Google Cloud Console
   - Create a new project
   - Enable OAuth2 API
   - Create OAuth credentials
   - Add authorized redirect URIs
   - Update .env with credentials

## Development Environment

The development environment includes:
- Hot-reloading for both frontend and backend
- Debug logging
- Development database instances
- Volume mounts for local development

### Starting Development Environment

```bash
# Start all services
docker compose up --build -d

# View real-time logs
docker compose logs -f

# View logs for specific service
docker compose logs -f [app|api|data-db|user-db]

# Stop all services
docker compose down
```

## Production Environment

The production environment features:
- Optimized builds
- Minimal container images
- Security hardening
- Production-grade database configurations
- SSL/TLS support

### Deployment Steps

1. Build production images:
```bash
docker compose -f docker-compose.prod.yml build
```

2. Start production services:
```bash
docker compose -f docker-compose.prod.yml up -d
```

## Services Configuration

### Frontend (Next.js App)
- Port: 3000
- Environment: Node.js 20
- Dependencies managed with pnpm
- Features:
  - Server-side rendering
  - API route handlers
  - Authentication system
  - Email verification
  - Password reset functionality

### Backend (Rust API)
- Port: 3100
- Built with actix-web
- Features:
  - RESTful endpoints
  - WebSocket connections
  - Database pooling
  - Rate limiting
  - Request validation

### TimescaleDB (Data)
- Port: 5433
- Stores:
  - Card data
  - Deck information
  - Tournament results
  - Player statistics
  - Game history

### PostgreSQL (User)
- Port: 5432
- Stores:
  - User accounts
  - Authentication data
  - Sessions
  - Email verification tokens
  - Password reset tokens

## Maintenance

### Backup and Restore

```bash
# Backup databases
docker compose exec data-db pg_dump -U $DATA_DB_USER $DATA_DB_NAME > data_backup.sql
docker compose exec user-db pg_dump -U $USER_DB_USER $USER_DB_NAME > user_backup.sql

# Restore databases
docker compose exec -T data-db psql -U $DATA_DB_USER $DATA_DB_NAME < data_backup.sql
docker compose exec -T user-db psql -U $USER_DB_USER $USER_DB_NAME < user_backup.sql
```

### Monitoring

Monitor container health:
```bash
docker compose ps
docker compose top
```

View container metrics:
```bash
docker stats
```

## Troubleshooting

### Common Issues

1. **Database Connection Errors**
   - Check database credentials in .env
   - Ensure database ports are not in use
   - Verify database containers are running

2. **Email Service Issues**
   - Confirm SMTP credentials
   - Check Gmail App Password
   - Verify email configuration in .env

3. **Authentication Problems**
   - Validate NEXTAUTH_URL matches your domain
   - Check Google OAuth credentials
   - Ensure database migrations are up to date

### Debug Commands

```bash
# Check container logs
docker compose logs [service-name]

# Inspect container
docker compose exec [service-name] sh

# Check database connection
docker compose exec [data-db|user-db] psql -U $DB_USER -d $DB_NAME

# Rebuild specific service
docker compose up -d --build [service-name]

# Clean up environment
docker compose down -v
docker system prune -f
```

## Security Notes

- All production containers run as non-root users
- Sensitive environment variables are not built into images
- Database passwords are required to be strong
- Regular security updates are recommended
- SSL/TLS is required in production
- API rate limiting is enabled
- Authentication tokens have appropriate expiration

## Contributing

Please refer to the main repository's CONTRIBUTING.md for guidelines on contributing to the project.

## Support

For support, please:
1. Check the troubleshooting section
2. Search existing GitHub issues
3. Create a new issue if needed

## License

This project is licensed under the MIT License - see the LICENSE file for details.

