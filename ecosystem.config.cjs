// =============================================================================
// Port Configuration - All ports defined here as single source of truth
// =============================================================================
const PORTS = {
  API: 3233,    // Express API server
  UI: 3218      // React dev server (client)
};

module.exports = {
  PORTS, // Export for other configs to reference

  apps: [
    {
      name: 'bituniverse-server',
      script: 'server/index.js',
      cwd: __dirname,
      interpreter: 'node',
      env: {
        NODE_ENV: 'development',
        PORT: PORTS.API,
        HOST: '0.0.0.0'
      },
      watch: false
    },
    {
      name: 'bituniverse-ui',
      script: 'node_modules/.bin/react-scripts',
      cwd: `${__dirname}/client`,
      args: 'start',
      env: {
        NODE_ENV: 'development',
        PORT: PORTS.UI,
        BROWSER: 'none'
      },
      watch: false
    }
  ]
};
