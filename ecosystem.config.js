module.exports = {
  apps: [{
    name: 'cedhtools-worker',
    script: 'client/dist/etl/etl/worker.js',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'production',
      SUPABASE_URL: process.env.SUPABASE_URL,
      SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
      TOPDECK_API_KEY: process.env.TOPDECK_API_KEY,
      MOXFIELD_API_BASE_URL: process.env.MOXFIELD_API_BASE_URL,
      MOXFIELD_USER_AGENT: process.env.MOXFIELD_USER_AGENT,
      ETL_REQUESTS_PER_SECOND: process.env.ETL_REQUESTS_PER_SECOND || '0.2'
    },
    error_file: '/var/www/cedhtools/logs/err.log',
    out_file: '/var/www/cedhtools/logs/out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss',
    merge_logs: true
  }]
}; 