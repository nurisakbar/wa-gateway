#!/bin/bash

echo "🚀 Starting WA Gateway Production Environment with Docker Compose..."

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
        echo "⚠️  IMPORTANT: Please update the .env file with production values before continuing!"
        read -p "Press Enter to continue after updating .env file..."
    else
        echo "⚠️  No .env file found. Creating basic .env file..."
        cat > .env << EOF
# Database Configuration
MYSQL_ROOT_PASSWORD=your-secure-root-password
MYSQL_DATABASE=wagateway
MYSQL_USER=wagateway
MYSQL_PASSWORD=your-secure-password

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key
JWT_EXPIRES_IN=7d
SESSION_SECRET=your-session-secret

# Environment
NODE_ENV=production
EOF
        echo "✅ Basic .env file created."
        echo "⚠️  IMPORTANT: Please update the .env file with production values before continuing!"
        read -p "Press Enter to continue after updating .env file..."
    fi
fi

# Function to cleanup on exit
cleanup() {
    echo ""
    echo "🛑 Stopping Docker Compose services..."
    if command -v docker-compose &> /dev/null; then
        docker-compose down
    else
        docker compose down
    fi
    echo "✅ Docker Compose services stopped"
    exit 0
}

# Trap Ctrl+C and call cleanup
trap cleanup SIGINT

# Start Docker Compose production environment
echo "🐳 Starting Docker Compose production environment..."
if command -v docker-compose &> /dev/null; then
    docker-compose up --build -d
else
    docker compose up --build -d
fi

echo "✅ WA Gateway Production Environment is starting up!"
echo "📱 Frontend: http://localhost:3000"
echo "🔧 Backend: http://localhost:3001"
echo "📊 API Docs: http://localhost:3001/api-docs"
echo "🗄️  phpMyAdmin: http://localhost:8080"
echo "🔍 Redis Commander: http://localhost:8081"
echo ""
echo "To view logs: docker-compose logs -f"
echo "To stop services: docker-compose down"
echo "Press Ctrl+C to stop all services" 