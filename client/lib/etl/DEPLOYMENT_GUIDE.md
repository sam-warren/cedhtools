# ETL Worker Deployment Guide for Digital Ocean Droplet

This guide explains how to deploy the ETL fixes to your Digital Ocean droplet running PM2.

## Prerequisites

- SSH access to your Digital Ocean droplet
- Git repository access
- PM2 installed on the droplet
- Node.js and npm installed

## Deployment Steps

### Option 1: Git Pull and Restart (Recommended)

1. **SSH into your droplet**
   ```bash
   ssh user@your-droplet-ip
   ```

2. **Navigate to your project directory**
   ```bash
   cd /var/www/cedhtools  # or wherever your project is located
   ```

3. **Pull the latest changes**
   ```bash
   git pull origin main  # or your branch name
   ```

4. **Install dependencies (if package.json changed)**
   ```bash
   cd client
   npm install
   ```

5. **Build the TypeScript code**
   ```bash
   cd client
   npm run etl:build  # Builds the ETL worker TypeScript code
   ```

6. **Restart the PM2 worker**
   ```bash
   pm2 restart cedhtools-worker
   ```

7. **Check the logs to verify it's working**
   ```bash
   pm2 logs cedhtools-worker --lines 50
   ```

### Option 2: Manual File Update

If you can't use git, you can manually update the file:

1. **SSH into your droplet**
   ```bash
   ssh user@your-droplet-ip
   ```

2. **Navigate to the processor file**
   ```bash
   cd /var/www/cedhtools/client/lib/etl
   ```

3. **Backup the current file**
   ```bash
   cp processor.ts processor.ts.backup
   ```

4. **Update the file** (you can use `nano`, `vi`, or `vim`)
   ```bash
   nano processor.ts
   ```
   
   Apply the changes from the investigation report, or copy the updated file content.

5. **Build the TypeScript code**
   ```bash
   cd /var/www/cedhtools/client
   npm run etl:build  # Builds the ETL worker TypeScript code
   ```

6. **Restart PM2**
   ```bash
   pm2 restart cedhtools-worker
   ```

### Option 3: Using SCP to Copy Files

1. **From your local machine, copy the updated file**
   ```bash
   scp client/lib/etl/processor.ts user@your-droplet-ip:/var/www/cedhtools/client/lib/etl/processor.ts
   ```

2. **SSH into the droplet and build**
   ```bash
   ssh user@your-droplet-ip
   cd /var/www/cedhtools/client
   npm run etl:build  # Builds the ETL worker TypeScript code
   pm2 restart cedhtools-worker
   ```

## Verifying the Fix

After deployment, verify the fixes are working:

1. **Check PM2 status**
   ```bash
   pm2 status
   ```

2. **Monitor logs in real-time**
   ```bash
   pm2 logs cedhtools-worker --lines 100
   ```

3. **Check for the new log messages**
   Look for these log messages that indicate the fixes are active:
   - `[Processor] Using last processed tournament date: ...`
   - `[Batch] Using last processed tournament date: ...`

4. **Wait for the next daily update job**
   - Daily updates run at midnight (via cron)
   - Or manually trigger a job via the API/queue

5. **Verify in database**
   ```sql
   -- Check that new tournaments have correct dates (not 1970)
   SELECT tournament_date, name, processed_at 
   FROM processed_tournaments 
   ORDER BY processed_at DESC 
   LIMIT 10;
   
   -- Check ETL status
   SELECT id, last_processed_date, records_processed, status, created_at
   FROM etl_status
   ORDER BY created_at DESC
   LIMIT 5;
   ```

## Troubleshooting

### PM2 won't restart

```bash
# Check PM2 status
pm2 status

# Check if process is stuck
pm2 kill
pm2 start ecosystem.config.js

# Or reload the config
pm2 reload ecosystem.config.js
```

### Build fails

```bash
# Check Node version
node --version

# Clear npm cache
npm cache clean --force

# Remove node_modules and reinstall
rm -rf node_modules
npm install
npm run build
```

### Worker not processing jobs

1. **Check if jobs are being created**
   ```sql
   SELECT * FROM etl_jobs 
   WHERE status = 'PENDING' 
   ORDER BY created_at DESC 
   LIMIT 5;
   ```

2. **Check worker logs for errors**
   ```bash
   pm2 logs cedhtools-worker --err
   ```

3. **Verify environment variables**
   ```bash
   pm2 env 0  # Shows environment for process 0
   ```

### Date issues persist

If tournament dates are still showing as 1970:

1. **Check the Topdeck API response format**
   - The `tournament.startDate` might be in a different format than expected
   - Check logs to see what format is being received

2. **Verify the fix was applied**
   ```bash
   grep -n "tournament.startDate \* 1000" client/lib/etl/processor.ts
   ```
   Should show the multiplication by 1000

## Monitoring After Deployment

1. **Set up log monitoring**
   ```bash
   # Watch logs continuously
   pm2 logs cedhtools-worker
   
   # Or check specific log files
   tail -f /var/www/cedhtools/logs/out.log
   tail -f /var/www/cedhtools/logs/err.log
   ```

2. **Monitor job processing**
   - Check `etl_jobs` table for new jobs
   - Verify `records_processed > 0` for daily updates
   - Monitor `etl_status` table for successful runs

3. **Set up alerts** (optional)
   - Monitor for jobs that complete with 0 records
   - Alert if no jobs process for 24+ hours
   - Alert on PM2 process crashes

## Rollback Plan

If something goes wrong:

1. **Stop PM2**
   ```bash
   pm2 stop cedhtools-worker
   ```

2. **Restore backup**
   ```bash
   cd /var/www/cedhtools/client/lib/etl
   cp processor.ts.backup processor.ts
   ```

3. **Rebuild and restart**
   ```bash
   cd /var/www/cedhtools/client
   npm run build
   pm2 restart cedhtools-worker
   ```

## Next Steps After Deployment

1. **Monitor for 24-48 hours** to ensure daily updates are working
2. **Check that tournament dates are correct** (not 1970)
3. **Verify records are being processed** daily
4. **Consider fixing historical data** - The existing tournaments with 1970 dates could be corrected, but that's a separate task

## Additional Notes

- The worker runs continuously via PM2
- Daily update jobs are created by the cron endpoint (`/api/etl-cron`)
- The cron endpoint runs daily at midnight (configured in `vercel.json`)
- PM2 will automatically restart the worker if it crashes
- Logs are stored in `/var/www/cedhtools/logs/`

