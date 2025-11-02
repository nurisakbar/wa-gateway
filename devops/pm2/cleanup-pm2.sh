#!/bin/bash

# =============================================================================
# WA Gateway - PM2 Cleanup Script
# =============================================================================
# Script untuk membersihkan semua proses PM2 yang duplikat
# =============================================================================

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}  PM2 Cleanup - Removing Duplicates${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# Check if PM2 is installed
if ! command -v pm2 >/dev/null 2>&1; then
    echo -e "${RED}Error: PM2 is not installed${NC}"
    exit 1
fi

# Show current PM2 status
echo -e "${YELLOW}Current PM2 processes:${NC}"
pm2 list
echo ""

# Delete all wa-gateway-be instances
echo -e "${BLUE}Cleaning up wa-gateway-be...${NC}"
if pm2 jlist 2>/dev/null | grep -q '"name":"wa-gateway-be"'; then
    # Delete all instances by name
    pm2 delete wa-gateway-be 2>/dev/null || true
    # Also delete by ID if any remain
    pm2 list | grep "wa-gateway-be" | awk '{print $2}' | xargs -I {} pm2 delete {} 2>/dev/null || true
    echo -e "${GREEN}✓ wa-gateway-be cleaned${NC}"
else
    echo -e "${YELLOW}No wa-gateway-be processes found${NC}"
fi

# Delete all wa-gateway-fe instances
echo -e "${BLUE}Cleaning up wa-gateway-fe...${NC}"
if pm2 jlist 2>/dev/null | grep -q '"name":"wa-gateway-fe"'; then
    # Delete all instances by name
    pm2 delete wa-gateway-fe 2>/dev/null || true
    # Also delete by ID if any remain
    pm2 list | grep "wa-gateway-fe" | awk '{print $2}' | xargs -I {} pm2 delete {} 2>/dev/null || true
    echo -e "${GREEN}✓ wa-gateway-fe cleaned${NC}"
else
    echo -e "${YELLOW}No wa-gateway-fe processes found${NC}"
fi

# Save PM2 state
pm2 save 2>/dev/null || true

echo ""
echo -e "${YELLOW}Final PM2 status:${NC}"
pm2 list
echo ""
echo -e "${GREEN}✓ Cleanup completed!${NC}"
echo ""
echo -e "${BLUE}To restart applications:${NC}"
echo -e "  ${YELLOW}./start.sh${NC} or ${YELLOW}./prod.sh${NC}"
echo ""

