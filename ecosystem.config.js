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
      NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
      NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      SUPABASE_URL: process.env.SUPABASE_URL,
      SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY,
      SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
      SUPABASE_JWT_SECRET: process.env.SUPABASE_JWT_SECRET,
      TOPDECK_API_KEY: process.env.TOPDECK_API_KEY,
      TOPDECK_API_BASE_URL: process.env.TOPDECK_API_BASE_URL,
      MOXFIELD_API_BASE_URL: process.env.MOXFIELD_API_BASE_URL,
      MOXFIELD_USER_AGENT: process.env.MOXFIELD_USER_AGENT,
      ETL_REQUESTS_PER_SECOND: process.env.ETL_REQUESTS_PER_SECOND,
      ETL_CONCURRENCY_LIMIT: process.env.ETL_CONCURRENCY_LIMIT
    },
    error_file: '/var/www/cedhtools/logs/err.log',
    out_file: '/var/www/cedhtools/logs/out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss',
    merge_logs: true
  }]
}; 