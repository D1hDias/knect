module.exports = {
  apps: [{
    name: 'knecthub',
    script: 'dist/index.js',
    cwd: '/usr/local/lsws/Example/html/knecthub.com.br',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'production',
      PORT: 5000
    },
    env_production: {
      NODE_ENV: 'production',
      PORT: 5000
    },
    error_file: '/var/log/pm2/knecthub-error.log',
    out_file: '/var/log/pm2/knecthub-out.log',
    log_file: '/var/log/pm2/knecthub.log',
    time: true
  }]
};