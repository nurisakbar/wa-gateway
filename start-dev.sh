#!/bin/bash

echo "🚀 Starting WA Gateway Development Environment with Docker Compose..."

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Please install Docker first."
    exit 1
fi

# Check if Docker Compose is installed
if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
    echo "❌ Docker Compose is not installed. Please install Docker Compose first."
    exit 1
fi

echo "✅ Docker and Docker Compose are available"

# Check if .env file exists, if not create from example
if [ ! -f ".env" ]; then
    if [ -f "docker.env.example" ]; then
        echo "📝 Creating .env file from docker.env.example..."
        cp docker.env.example .env
        echo "✅ .env file created. Please review and modify if needed."
    else
        echo "⚠️  No .env file found. Creating basic .env file..."
        cat > .env << EOF
# Database Configuration
MYSQL_ROOT_PASSWORD=rootpassword
MYSQL_DATABASE=wagateway_dev
MYSQL_USER=wagateway
MYSQL_PASSWORD=wagateway123

# JWT Configuration
JWT_SECRET=dev-jwt-secret
JWT_EXPIRES_IN=7d
SESSION_SECRET=dev-session-secret

# Environment
NODE_ENV=development
EOF
        echo "✅ Basic .env file created."
    fi
fi

# Function to cleanup on exit
cleanup() {
    echo ""
    echo "🛑 Stopping Docker Compose services..."
    if command -v docker-compose &> /dev/null; then
        docker-compose -f docker-compose.dev.yml down
    else
        docker compose -f docker-compose.dev.yml down
    fi
    echo "✅ Docker Compose services stopped"
    exit 0
}

# Trap Ctrl+C and call cleanup
trap cleanup SIGINT

# Start Docker Compose development environment
echo "🐳 Starting Docker Compose development environment..."
if command -v docker-compose &> /dev/null; then
    docker-compose -f docker-compose.dev.yml up --build
else
    docker compose -f docker-compose.dev.yml up --build
fi 