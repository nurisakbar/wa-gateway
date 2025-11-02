#!/bin/bash

# =============================================================================
# WA Gateway - Cleanup Ports Script
# =============================================================================
# Script untuk membersihkan port yang masih digunakan oleh proses yang tertinggal
# =============================================================================

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}  WA Gateway - Port Cleanup${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# Function to kill process on port
kill_port() {
    local port=$1
    local name=$2
    
    echo -e "${YELLOW}Checking port $port ($name)...${NC}"
    
    # Find process using the port
    local pid=$(lsof -ti:$port 2>/dev/null || true)
    
    if [ -n "$pid" ]; then
        echo -e "  Found process PID: ${YELLOW}$pid${NC}"
        echo -e "  Killing process..."
        kill $pid 2>/dev/null || true
        sleep 1
        # Force kill if still running
        if ps -p $pid > /dev/null 2>&1; then
            echo -e "  Force killing..."
            kill -9 $pid 2>/dev/null || true
        fi
        echo -e "  ${GREEN}✓ Port $port cleaned${NC}"
    else
        echo -e "  ${GREEN}✓ Port $port is free${NC}"
    fi
}

# Clean backend port (3001)
kill_port 3001 "Backend"

# Clean frontend port (3000)
kill_port 3000 "Frontend"

# Clean any remaining PM2 processes
if command -v pm2 >/dev/null 2>&1; then
    echo ""
    echo -e "${YELLOW}Checking PM2 processes...${NC}"
    
    if pm2 list | grep -q "wa-gateway-be"; then
        echo -e "  Stopping wa-gateway-be..."
        pm2 stop wa-gateway-be 2>/dev/null || true
        pm2 delete wa-gateway-be 2>/dev/null || true
    fi
    
    if pm2 list | grep -q "wa-gateway-fe"; then
        echo -e "  Stopping wa-gateway-fe..."
        pm2 stop wa-gateway-fe 2>/dev/null || true
        pm2 delete wa-gateway-fe 2>/dev/null || true
    fi
    
    pm2 save 2>/dev/null || true
fi

# Kill any remaining node processes
echo ""
echo -e "${YELLOW}Killing any remaining node processes...${NC}"
pkill -f "node.*server.js" 2>/dev/null || true
pkill -f "nodemon.*server.js" 2>/dev/null || true
pkill -f "nuxt.*dev" 2>/dev/null || true
pkill -f "nuxt.*preview" 2>/dev/null || true

# Cleanup PID files
echo ""
echo -e "${YELLOW}Cleaning up PID files...${NC}"
rm -f .backend.pid .frontend.pid

echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}  Port Cleanup Completed!${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo -e "${BLUE}You can now start the application again:${NC}"
echo -e "  ${YELLOW}./start.sh${NC} or ${YELLOW}./dev.sh${NC}"
echo ""
