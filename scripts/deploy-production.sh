#!/bin/bash

# Sparks App - Production Deployment Script
# This script automates the entire deployment process

set -e  # Exit on any error

echo "🚀 Sparks App - Production Deployment"
echo "======================================"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Step 1: Check version consistency
echo "📋 Step 1: Checking version consistency..."
if ./scripts/check-version.sh; then
  echo -e "${GREEN}✓ Version check passed${NC}"
else
  echo ""
  echo -e "${YELLOW}⚠️  Version mismatch detected. Fixing...${NC}"
  echo ""
  
  # Run prebuild to sync versions
  echo "Running: npx expo prebuild --clean"
  npx expo prebuild --clean
  
  echo ""
  echo "Re-checking versions..."
  if ./scripts/check-version.sh; then
    echo -e "${GREEN}✓ Versions now synchronized${NC}"
  else
    echo -e "${RED}✗ Version sync failed. Please check manually.${NC}"
    exit 1
  fi
fi

echo ""

# Step 2: Get current version for confirmation
CURRENT_VERSION=$(node -e "console.log(require('./app.json').expo.version)")
echo -e "${BLUE}Current version: ${CURRENT_VERSION}${NC}"
echo ""

# Step 3: Confirm deployment
read -p "Deploy version ${CURRENT_VERSION} to production? (y/N) " -n 1 -r
echo ""
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
  echo "Deployment cancelled."
  exit 0
fi

echo ""

# Step 4: Build and submit
echo "📦 Step 2: Building and submitting to app stores..."
echo "Running: npx eas build --platform all --profile production --auto-submit"
echo ""

npx eas build --platform all --profile production --auto-submit

echo ""
echo -e "${GREEN}✓ Build and auto-submit initiated!${NC}"
echo ""

# Step 5: Post-deployment instructions
echo "======================================"
echo "📱 Next Steps - Manual Store Actions"
echo "======================================"
echo ""

echo -e "${BLUE}🤖 Google Play Console:${NC}"
echo "1. Go to: https://play.google.com/console/u/0/developers/7574537990443980441/app/4974480089571997239/tracks/production"
echo "2. Click: 'Create New Release'"
echo "3. Click: 'Add from Library' (select the build that was just submitted)"
echo "4. Add release notes describing what's new in version ${CURRENT_VERSION}"
echo "5. Click: 'Review Release'"
echo "6. Click: 'Start Rollout to Production'"
echo ""

echo -e "${BLUE}🍎 App Store Connect:${NC}"
echo "1. Go to: https://appstoreconnect.apple.com/apps/6752919846/distribution/info"
echo "2. Wait for build to appear in TestFlight (usually 5-15 minutes)"
echo "3. Once processed, go to 'App Store' tab"
echo "4. Click: '+ Version or Platform'"
echo "5. Select the new build (version ${CURRENT_VERSION})"
echo "6. Add 'What's New' release notes"
echo "7. Click: 'Save' then 'Submit for Review'"
echo ""

echo "======================================"
echo -e "${GREEN}✅ Deployment process complete!${NC}"
echo "======================================"
echo ""
echo "Monitor build status at: https://expo.dev/accounts/mattdyor/projects/sparks-app/builds"
echo ""
