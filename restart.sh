#!/bin/bash

# =============================================================================
# WA Gateway - Restart Script
# =============================================================================
# Script untuk restart backend dan frontend WA Gateway
# =============================================================================

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

MODE=${1:-dev}  # dev or production (default: dev)
USE_PM2=${2:-false}  # true untuk menggunakan PM2 (default: false)

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}  WA Gateway - Restarting Application${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# Stop application
echo -e "${BLUE}Stopping application...${NC}"
./stop.sh

# Wait a moment
sleep 2

# Start application
echo -e "${BLUE}Starting application...${NC}"
./start.sh $MODE $USE_PM2
