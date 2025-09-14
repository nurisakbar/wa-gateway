#!/bin/bash

# KlikWhatsApp Docker Runner for macOS
# This script helps you run the entire KlikWhatsApp application using Docker

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if Docker is installed
check_docker() {
    if ! command -v docker &> /dev/null; then
        print_error "Docker is not installed. Please install Docker Desktop for macOS first."
        print_status "Download from: https://www.docker.com/products/docker-desktop"
        exit 1
    fi

    if ! docker info &> /dev/null; then
        print_error "Docker is not running. Please start Docker Desktop."
        exit 1
    fi

    print_success "Docker is installed and running"
}

# Check if Docker Compose is available
check_docker_compose() {
    if ! command -v docker-compose &> /dev/null; then
        print_error "Docker Compose is not installed. Please install Docker Compose."
        exit 1
    fi

    print_success "Docker Compose is available"
}

# Create necessary directories
create_directories() {
    print_status "Creating necessary directories..."
    
    mkdir -p backend/uploads
    mkdir -p backend/logs
    mkdir -p nginx/logs
    mkdir -p nginx/ssl
    
    print_success "Directories created"
}

# Generate self-signed SSL certificate for development
generate_ssl_cert() {
    if [ ! -f "nginx/ssl/cert.pem" ]; then
        print_status "Generating self-signed SSL certificate for development..."
        
        openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
            -keyout nginx/ssl/key.pem \
            -out nginx/ssl/cert.pem \
            -subj "/C=US/ST=State/L=City/O=Organization/CN=localhost"
        
        print_success "SSL certificate generated"
    else
        print_status "SSL certificate already exists"
    fi
}

# Build and start services
start_services() {
    print_status "Building and starting KlikWhatsApp services..."
    
    # Build images
    docker-compose build
    
    # Start services
    docker-compose up -d
    
    print_success "Services started successfully"
}

# Wait for services to be ready
wait_for_services() {
    print_status "Waiting for services to be ready..."
    
    # Wait for MySQL
    print_status "Waiting for MySQL..."
    while ! docker-compose exec -T mysql mysqladmin ping -h"localhost" --silent; do
        sleep 2
    done
    
    # Wait for Redis
    print_status "Waiting for Redis..."
    while ! docker-compose exec -T redis redis-cli ping; do
        sleep 2
    done
    
    # Wait for Backend
    print_status "Waiting for Backend API..."
    while ! curl -f http://localhost:3000/api/health &> /dev/null; do
        sleep 5
    done
    
    # Wait for Frontend
    print_status "Waiting for Frontend..."
    while ! curl -f http://localhost:3001 &> /dev/null; do
        sleep 5
    done
    
    print_success "All services are ready!"
}

# Show service status
show_status() {
    print_status "Service Status:"
    docker-compose ps
    
    echo ""
    print_status "Access URLs:"
    echo -e "  ${GREEN}Frontend:${NC} http://localhost:3001"
    echo -e "  ${GREEN}Backend API:${NC} http://localhost:3000"
    echo -e "  ${GREEN}API Documentation:${NC} http://localhost:3000/api-docs"
    echo -e "  ${GREEN}Health Check:${NC} http://localhost:3000/api/health"
    echo ""
    print_status "Database:"
    echo -e "  ${GREEN}MySQL:${NC} localhost:3306"
    echo -e "  ${GREEN}Redis:${NC} localhost:6379"
}

# Stop services
stop_services() {
    print_status "Stopping KlikWhatsApp services..."
    docker-compose down
    print_success "Services stopped"
}

# Show logs
show_logs() {
    print_status "Showing logs (Press Ctrl+C to exit)..."
    docker-compose logs -f
}

# Clean up everything
cleanup() {
    print_warning "This will remove all containers, volumes, and images. Are you sure? (y/N)"
    read -r response
    if [[ "$response" =~ ^([yY][eE][sS]|[yY])$ ]]; then
        print_status "Cleaning up..."
        docker-compose down -v --rmi all
        print_success "Cleanup completed"
    else
        print_status "Cleanup cancelled"
    fi
}

# Main menu
show_menu() {
    echo ""
    echo -e "${BLUE}KlikWhatsApp Docker Manager${NC}"
    echo "================================"
    echo "1. Start KlikWhatsApp"
    echo "2. Stop KlikWhatsApp"
    echo "3. Show Status"
    echo "4. Show Logs"
    echo "5. Restart Services"
    echo "6. Cleanup Everything"
    echo "7. Exit"
    echo ""
    read -p "Choose an option (1-7): " choice
}

# Main function
main() {
    case $1 in
        "start")
            check_docker
            check_docker_compose
            create_directories
            generate_ssl_cert
            start_services
            wait_for_services
            show_status
            ;;
        "stop")
            stop_services
            ;;
        "status")
            show_status
            ;;
        "logs")
            show_logs
            ;;
        "restart")
            stop_services
            start_services
            wait_for_services
            show_status
            ;;
        "cleanup")
            cleanup
            ;;
        *)
            while true; do
                show_menu
                case $choice in
                    1)
                        check_docker
                        check_docker_compose
                        create_directories
                        generate_ssl_cert
                        start_services
                        wait_for_services
                        show_status
                        ;;
                    2)
                        stop_services
                        ;;
                    3)
                        show_status
                        ;;
                    4)
                        show_logs
                        ;;
                    5)
                        stop_services
                        start_services
                        wait_for_services
                        show_status
                        ;;
                    6)
                        cleanup
                        ;;
                    7)
                        print_status "Goodbye!"
                        exit 0
                        ;;
                    *)
                        print_error "Invalid option. Please choose 1-7."
                        ;;
                esac
            done
            ;;
    esac
}

# Run main function with arguments
main "$@" 