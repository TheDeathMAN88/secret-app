#!/bin/bash

# Secret Chat Production Startup Script

set -e

echo "🚀 Starting Secret Chat..."

# Check if .env file exists
if [ ! -f .env ]; then
    echo "❌ .env file not found. Please create it from .env.example"
    exit 1
fi

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed"
    exit 1
fi

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed"
    exit 1
fi

# Install dependencies if node_modules doesn't exist
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm ci --production
fi

# Generate Prisma client if not exists
if [ ! -d "node_modules/.prisma" ]; then
    echo "🔧 Generating Prisma client..."
    npx prisma generate
fi

# Create necessary directories
echo "📁 Creating directories..."
mkdir -p data uploads logs

# Set permissions
chmod 755 data uploads logs

# Build the application if not already built
if [ ! -d ".next" ]; then
    echo "🏗️  Building application..."
    npm run build
fi

# Start the application
echo "🌟 Starting application..."
if command -v pm2 &> /dev/null; then
    echo "📊 Starting with PM2..."
    pm2 start ecosystem.config.js --env production
    pm2 save
    pm2 startup
else
    echo "🚀 Starting with Node.js..."
    NODE_ENV=production node server.js
fi

echo "✅ Secret Chat started successfully!"
echo "📱 Access your app at: ${NEXTAUTH_URL:-http://localhost:3000}"
echo "📊 Check logs with: pm2 logs"