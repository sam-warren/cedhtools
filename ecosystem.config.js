/**
 * PM2 Ecosystem Configuration
 * 
 * Usage:
 *   pm2 start ecosystem.config.js
 *   pm2 stop cedhtools-worker
 *   pm2 logs cedhtools-worker
 *   pm2 monit
 * 
 * For production:
 *   pm2 start ecosystem.config.js --env production
 */

module.exports = {
  apps: [
    {
      name: 'cedhtools-worker',
      script: 'npx',
      args: 'tsx worker/index.ts',
      cwd: __dirname,
      node_args: '--expose-gc --max-old-space-size=768',  // Enable GC + limit Node memory
      
      // Environment variables (override with --env production)
      env: {
        NODE_ENV: 'development',
        WORKER_ID: 'worker-dev',
      },
      env_production: {
        NODE_ENV: 'production',
        WORKER_ID: 'worker-prod-1',
      },
      
      // Process management
      instances: 1,           // Single instance (jobs shouldn't run in parallel)
      exec_mode: 'fork',
      
      // Auto-restart configuration
      autorestart: true,
      watch: false,           // Don't watch for file changes in production
      max_restarts: 10,
      min_uptime: '10s',
      restart_delay: 5000,    // Wait 5s before restarting
      
      // Logging
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      error_file: './logs/worker-error.log',
      out_file: './logs/worker-out.log',
      merge_logs: true,
      
      // Memory management (reduced from 1G to leave room for OS on 1GB droplet)
      max_memory_restart: '750M',
      
      // Graceful shutdown
      kill_timeout: 7200000,  // 2 hours to finish current job (seed jobs are long)
      wait_ready: true,
      listen_timeout: 10000,
    },
  ],
};

