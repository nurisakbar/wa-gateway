#!/bin/bash

# KlikWhatsApp Docker Startup Script
# This script helps you start KlikWhatsApp with Docker

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
        print_error "Docker is not installed. Please install Docker first."
        exit 1
    fi

    if ! command -v docker-compose &> /dev/null; then
        print_error "Docker Compose is not installed. Please install Docker Compose first."
        exit 1
    fi

    print_success "Docker and Docker Compose are available"
}

# Check if .env file exists
check_env() {
    if [ ! -f .env ]; then
        print_warning ".env file not found. Creating from template..."
        cp docker.env.example .env
        print_success ".env file created. Please review and modify if needed."
    else
        print_success ".env file found"
    fi
}

# Function to start services
start_services() {
    local mode=$1
    
    print_status "Starting KlikWhatsApp in $mode mode..."
    
    if [ "$mode" = "development" ]; then
        docker-compose -f docker-compose.dev.yml up -d
    else
        docker-compose up -d
    fi
    
    print_success "Services started successfully!"
}

# Function to show status
show_status() {
    print_status "Checking service status..."
    
    if [ "$1" = "development" ]; then
        docker-compose -f docker-compose.dev.yml ps
    else
        docker-compose ps
    fi
}

# Function to show logs
show_logs() {
    local service=$1
    local mode=$2
    
    print_status "Showing logs for $service..."
    
    if [ "$mode" = "development" ]; then
        docker-compose -f docker-compose.dev.yml logs -f $service
    else
        docker-compose logs -f $service
    fi
}

# Function to stop services
stop_services() {
    local mode=$1
    
    print_status "Stopping KlikWhatsApp services..."
    
    if [ "$mode" = "development" ]; then
        docker-compose -f docker-compose.dev.yml down
    else
        docker-compose down
    fi
    
    print_success "Services stopped successfully!"
}

# Function to restart services
restart_services() {
    local mode=$1
    
    print_status "Restarting KlikWhatsApp services..."
    stop_services $mode
    start_services $mode
}

# Function to clean up
cleanup() {
    print_warning "This will remove all containers, networks, and volumes. Are you sure? (y/N)"
    read -r response
    if [[ "$response" =~ ^([yY][eE][sS]|[yY])$ ]]; then
        print_status "Cleaning up Docker resources..."
        docker-compose down -v --remove-orphans
        docker-compose -f docker-compose.dev.yml down -v --remove-orphans
        docker system prune -f
        print_success "Cleanup completed!"
    else
        print_status "Cleanup cancelled."
    fi
}

# Function to show help
show_help() {
    echo "KlikWhatsApp Docker Management Script"
    echo ""
    echo "Usage: $0 [COMMAND] [MODE]"
    echo ""
    echo "Commands:"
    echo "  start     Start KlikWhatsApp services"
    echo "  stop      Stop KlikWhatsApp services"
    echo "  restart   Restart KlikWhatsApp services"
    echo "  status    Show service status"
    echo "  logs      Show service logs"
    echo "  cleanup   Remove all containers and volumes"
    echo "  help      Show this help message"
    echo ""
    echo "Modes:"
    echo "  production  Production mode (default)"
    echo "  development Development mode with hot reload"
    echo ""
    echo "Examples:"
    echo "  $0 start production"
    echo "  $0 start development"
    echo "  $0 logs backend development"
    echo "  $0 status production"
}

# Main script logic
main() {
    local command=$1
    local mode=${2:-production}
    
    # Check prerequisites
    check_docker
    check_env
    
    case $command in
        "start")
            start_services $mode
            print_success "KlikWhatsApp is starting up!"
            print_status "Frontend: http://localhost:3000"
            print_status "Backend API: http://localhost:3001"
            print_status "API Docs: http://localhost:3001/api-docs"
            if [ "$mode" = "development" ]; then
                print_status "phpMyAdmin: http://localhost:8080"
                print_status "Redis Commander: http://localhost:8081"
            fi
            ;;
        "stop")
            stop_services $mode
            ;;
        "restart")
            restart_services $mode
            ;;
        "status")
            show_status $mode
            ;;
        "logs")
            local service=$2
            if [ -z "$service" ]; then
                print_error "Please specify a service (e.g., backend, frontend, mysql)"
                exit 1
            fi
            show_logs $service $mode
            ;;
        "cleanup")
            cleanup
            ;;
        "help"|"--help"|"-h")
            show_help
            ;;
        *)
            print_error "Unknown command: $command"
            show_help
            exit 1
            ;;
    esac
}

# Run main function with all arguments
main "$@" 