# PostgreSQL + DBeaver Setup Guide for WSL2

This guide covers setting up PostgreSQL in WSL2 and connecting it to DBeaver on Windows.

## 1. Initial PostgreSQL Installation
```bash
# Install PostgreSQL
sudo apt update
sudo apt install postgresql postgresql-contrib

# Install development libraries
sudo apt install libpq-dev python3-dev
```

## 2. PostgreSQL Configuration
```bash
# Edit postgresql.conf
sudo nano /etc/postgresql/16/main/postgresql.conf
# Set: listen_addresses = '*'

# Edit pg_hba.conf
sudo nano /etc/postgresql/16/main/pg_hba.conf
# Add at bottom:
host    all    all    0.0.0.0/0    md5
host    all    all    127.0.0.1/32    md5
```

## 3. Database Setup
```bash
# Start PostgreSQL
sudo pg_ctlcluster 16 main start

# Set postgres user password
sudo -u postgres psql
postgres=# ALTER USER postgres WITH PASSWORD 'your_password';
postgres=# \q

# Create database
sudo -u postgres createdb cedhtools
```

## 4. Backup and Restore
```bash
# Backup database
pg_dump -U postgres -F d -f backup_name cedhtools

# Restore database
sudo -u postgres psql
CREATE DATABASE cedhtools;
\q

PGPASSWORD='your_password' pg_restore -U postgres -h localhost -d cedhtools ./backup_path -v
```

## 5. DBeaver Connection
1. Get WSL2 IP:
```bash
ip addr show eth0 | grep -oP "(?<=inet\s)\d+(\.\d+){3}"
```

2. DBeaver settings:
- Host: WSL2 IP
- Port: 5432
- Database: cedhtools
- Username: postgres
- Password: your_password

## 6. Useful `.zshrc` Additions
```bash
# Add to ~/.zshrc
# PostgreSQL helpers
alias showip='ip addr show eth0 | grep -oP "(?<=inet\s)\d+(\.\d+){3}"'

# Auto-restart function
pg_start() {
    if ! pg_lsclusters | grep -q "online"; then
        echo "PostgreSQL is down, restarting..."
        sudo pg_ctlcluster 16 main start
    fi
}
```

## 7. Common Commands
```bash
# Check PostgreSQL status
pg_lsclusters

# Start/stop PostgreSQL
sudo pg_ctlcluster 16 main start
sudo pg_ctlcluster 16 main stop

# Connect to database
psql -U postgres -d cedhtools

# Get WSL2 IP for DBeaver
showip
```

## 8. Troubleshooting
- If PostgreSQL won't start:
```bash
sudo pkill postgres
sudo rm -f /var/lib/postgresql/16/main/postmaster.pid
sudo pg_ctlcluster 16 main start
```

- If DBeaver loses connection:
1. Run `showip`
2. Update DBeaver host with new IP
3. Test connection

## 9. Important Notes
- WSL2 IP changes after restarts
- PostgreSQL might need restart after WSL2 restart
- Always backup before major changes
- Keep pg_hba.conf and postgresql.conf backups

Remember to replace 'your_password' with your actual PostgreSQL password in all commands!
