#!/usr/bin/env node

/**
 * Platform Startup Script
 * Comprehensive script to start all platform components
 */

const { spawn, exec } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Financial Analyzer Platform Startup');
console.log('=====================================\n');

class PlatformStarter {
  constructor() {
    this.processes = [];
    this.isShuttingDown = false;
  }

  async checkPrerequisites() {
    console.log('🔍 Checking Prerequisites...');
    
    const checks = [
      {
        name: 'Node.js',
        check: () => process.version,
        required: 'v18+',
        fix: 'Install Node.js 18 or higher'
      },
      {
        name: 'npm',
        check: () => {
          try {
            require('child_process').execSync('npm --version', { stdio: 'pipe' });
            return 'installed';
          } catch {
            return null;
          }
        },
        required: 'installed',
        fix: 'npm is required'
      },
      {
        name: 'Apps directory',
        check: () => fs.existsSync('./apps'),
        required: true,
        fix: 'Run from project root directory'
      },
      {
        name: 'API package',
        check: () => fs.existsSync('./apps/api/package.json'),
        required: true,
        fix: 'API package missing'
      },
      {
        name: 'Frontend package',
        check: () => fs.existsSync('./apps/web/package.json'),
        required: true,
        fix: 'Frontend package missing'
      }
    ];

    let allPassed = true;
    
    for (const check of checks) {
      const result = check.check();
      if (result === check.required || (check.required === true && result)) {
        console.log(`   ✅ ${check.name}: ${result === true ? 'OK' : result}`);
      } else {
        console.log(`   ❌ ${check.name}: ${check.fix}`);
        allPassed = false;
      }
    }

    if (!allPassed) {
      throw new Error('Prerequisites not met');
    }

    console.log('   ✅ All prerequisites met\n');
  }

  async installDependencies() {
    console.log('📦 Installing Dependencies...');
    
    const packages = [
      { dir: '.', name: 'Root workspace' },
      { dir: './apps/api', name: 'API server' },
      { dir: './apps/web', name: 'Frontend' }
    ];

    for (const pkg of packages) {
      if (!fs.existsSync(path.join(pkg.dir, 'node_modules'))) {
        console.log(`   Installing ${pkg.name}...`);
        await this.runCommand('npm install', pkg.dir);
      } else {
        console.log(`   ✅ ${pkg.name} dependencies already installed`);
      }
    }
    
    console.log('   ✅ All dependencies installed\n');
  }

  async setupDatabase() {
    console.log('🗄️  Setting up Database...');
    
    // Check if Docker is available
    try {
      await this.runCommand('docker --version', '.');
      console.log('   ✅ Docker available');

      // Check if PostgreSQL container is running
      try {
        await this.runCommand('docker ps | grep postgres', '.');
        console.log('   ✅ PostgreSQL container already running');
      } catch {
        console.log('   🔄 Starting PostgreSQL container...');
        try {
          await this.runCommand('docker-compose up -d postgres', '.');
          console.log('   ✅ PostgreSQL container started');
        } catch {
          console.log('   ⚠️  Could not start PostgreSQL with Docker');
          console.log('   💡 Manual setup required - see README for database setup');
        }
      }
    } catch {
      console.log('   ⚠️  Docker not available');
      console.log('   💡 Please install PostgreSQL manually or use Docker');
    }

    console.log('');
  }

  async buildComponents() {
    console.log('🔨 Building Components...');

    // Build API
    console.log('   Building API server...');
    await this.runCommand('npm run build', './apps/api');
    console.log('   ✅ API server built');

    // Build Frontend
    console.log('   Building frontend...');
    await this.runCommand('npm run build', './apps/web');
    console.log('   ✅ Frontend built');

    console.log('   ✅ All components built\n');
  }

  async startServices() {
    console.log('🎬 Starting Services...');

    // Start API server
    console.log('   Starting API server on port 3001...');
    const apiProcess = spawn('npm', ['run', 'dev'], {
      cwd: './apps/api',
      stdio: ['pipe', 'pipe', 'pipe']
    });

    apiProcess.stdout.on('data', (data) => {
      console.log(`   [API] ${data.toString().trim()}`);
    });

    apiProcess.stderr.on('data', (data) => {
      console.log(`   [API ERROR] ${data.toString().trim()}`);
    });

    this.processes.push({ name: 'API', process: apiProcess });

    // Wait for API to start
    await new Promise(resolve => setTimeout(resolve, 5000));

    // Start Frontend (optional)
    const startFrontend = process.argv.includes('--with-frontend');
    if (startFrontend) {
      console.log('   Starting frontend on port 3000...');
      const webProcess = spawn('npm', ['run', 'dev'], {
        cwd: './apps/web',
        stdio: ['pipe', 'pipe', 'pipe']
      });

      webProcess.stdout.on('data', (data) => {
        console.log(`   [WEB] ${data.toString().trim()}`);
      });

      webProcess.stderr.on('data', (data) => {
        console.log(`   [WEB ERROR] ${data.toString().trim()}`);
      });

      this.processes.push({ name: 'Frontend', process: webProcess });
    }

    console.log('   ✅ Services started\n');
  }

  async runHealthCheck() {
    console.log('🏥 Running Health Check...');

    // Wait a bit for services to fully start
    await new Promise(resolve => setTimeout(resolve, 3000));

    try {
      const axios = require('axios');
      const response = await axios.get('http://localhost:3001/api/health');
      console.log('   ✅ API Health Check passed');
      console.log(`   Status: ${response.data.status}`);
    } catch (error) {
      console.log('   ⚠️  API Health Check failed');
      console.log(`   Error: ${error.message}`);
    }

    console.log('');
  }

  async showStatus() {
    console.log('📊 Platform Status');
    console.log('=================');
    console.log('🌐 API Server: http://localhost:3001');
    console.log('🎨 Frontend: http://localhost:3000 (if started with --with-frontend)');
    console.log('📚 API Docs: http://localhost:3001/api/health');
    console.log('');
    console.log('🧪 Available Tests:');
    console.log('   npm run test:e2e          # Full integration test');
    console.log('   node test-e2e-workflow.js # End-to-end workflow test');
    console.log('');
    console.log('🛠️  Management Commands:');
    console.log('   Apps/API: cd apps/api && npm run dev');
    console.log('   Frontend: cd apps/web && npm run dev');
    console.log('   Database: docker-compose up -d postgres');
    console.log('');
    console.log('Press Ctrl+C to stop all services');
  }

  async runCommand(command, cwd) {
    return new Promise((resolve, reject) => {
      exec(command, { cwd }, (error, stdout, stderr) => {
        if (error) {
          reject(error);
        } else {
          resolve(stdout);
        }
      });
    });
  }

  setupShutdownHandlers() {
    const shutdown = () => {
      if (this.isShuttingDown) return;
      this.isShuttingDown = true;

      console.log('\n🛑 Shutting down platform...');
      
      this.processes.forEach(({ name, process }) => {
        console.log(`   Stopping ${name}...`);
        process.kill('SIGTERM');
      });

      setTimeout(() => {
        console.log('   ✅ Platform stopped');
        process.exit(0);
      }, 2000);
    };

    process.on('SIGINT', shutdown);
    process.on('SIGTERM', shutdown);
  }

  async start() {
    try {
      this.setupShutdownHandlers();

      await this.checkPrerequisites();
      await this.installDependencies();
      await this.setupDatabase();
      await this.buildComponents();
      await this.startServices();
      await this.runHealthCheck();
      await this.showStatus();

      // Keep process alive
      await new Promise(() => {});

    } catch (error) {
      console.log(`\n💥 Platform startup failed: ${error.message}`);
      console.log('\n🔧 Troubleshooting:');
      console.log('  1. Ensure you are in the project root directory');
      console.log('  2. Run: npm install');
      console.log('  3. Set up PostgreSQL database');
      console.log('  4. Check all prerequisites above');
      process.exit(1);
    }
  }
}

// Show usage information
function showUsage() {
  console.log('Usage: node start-platform.js [options]');
  console.log('');
  console.log('Options:');
  console.log('  --with-frontend    Start frontend development server');
  console.log('  --help            Show this help message');
  console.log('');
  console.log('Examples:');
  console.log('  node start-platform.js                 # Start API only');
  console.log('  node start-platform.js --with-frontend # Start API + Frontend');
}

// Main execution
if (require.main === module) {
  if (process.argv.includes('--help')) {
    showUsage();
    process.exit(0);
  }

  const starter = new PlatformStarter();
  starter.start();
}

module.exports = PlatformStarter;