module.exports = {
  apps: [{
    name: 'cedhtools-worker',
    script: 'cedhtools/client/dist/etl/worker.js',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'production'
    },
    error_file: '/var/www/cedhtools/logs/err.log',
    out_file: '/var/www/cedhtools/logs/out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss',
    merge_logs: true
  }]
}; 