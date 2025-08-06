module.exports = {
  apps: [{
    name: 'secret-chat',
    script: 'server.js',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 3000,
      HOSTNAME: '0.0.0.0'
    },
    env_production: {
      NODE_ENV: 'production',
      DATABASE_URL: 'file:/app/data/production.db',
      NEXTAUTH_URL: 'https://your-domain.com',
      NEXTAUTH_SECRET: 'your-super-secret-key-here',
      NEXT_PUBLIC_SOCKET_URL: 'https://your-domain.com'
    },
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_file: './logs/combined.log',
    time: true,
    autorestart: true,
    max_restarts: 10,
    min_uptime: '10s',
    max_memory_restart: '1G'
  }]
}