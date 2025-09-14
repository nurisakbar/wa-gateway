#!/bin/bash

# Setup Environment Variables Script
# This script helps you set up environment files for different environments

echo "🚀 WA Gateway Frontend - Environment Setup"
echo "=========================================="

# Function to copy environment file
setup_env() {
    local env_type=$1
    local source_file=$2
    local target_file=$3
    
    if [ -f "$source_file" ]; then
        cp "$source_file" "$target_file"
        echo "✅ Created $target_file from $source_file"
    else
        echo "❌ Source file $source_file not found"
    fi
}

# Check if we're in the frontend directory
if [ ! -f "nuxt.config.ts" ]; then
    echo "❌ Please run this script from the frontend directory"
    exit 1
fi

echo ""
echo "📋 Available environment setups:"
echo "1. Development (local)"
echo "2. Staging"
echo "3. Production"
echo "4. All environments"
echo ""

read -p "Choose setup option (1-4): " choice

case $choice in
    1)
        echo "🔧 Setting up Development environment..."
        setup_env "development" "env.example" ".env.local"
        echo "✅ Development environment ready!"
        echo "📝 Edit .env.local to customize your settings"
        ;;
    2)
        echo "🔧 Setting up Staging environment..."
        setup_env "staging" "env.staging" ".env.staging"
        echo "✅ Staging environment ready!"
        echo "📝 Edit .env.staging to customize your settings"
        ;;
    3)
        echo "🔧 Setting up Production environment..."
        setup_env "production" "env.production" ".env.production"
        echo "✅ Production environment ready!"
        echo "📝 Edit .env.production to customize your settings"
        ;;
    4)
        echo "🔧 Setting up all environments..."
        setup_env "development" "env.example" ".env.local"
        setup_env "staging" "env.staging" ".env.staging"
        setup_env "production" "env.production" ".env.production"
        echo "✅ All environments ready!"
        echo "📝 Edit the respective .env files to customize your settings"
        ;;
    *)
        echo "❌ Invalid choice. Please run the script again."
        exit 1
        ;;
esac

echo ""
echo "🎉 Environment setup complete!"
echo ""
echo "📖 Next steps:"
echo "1. Edit the created .env file(s) with your actual URLs and API keys"
echo "2. Run 'npm run dev' for development"
echo "3. Run 'npm run build' for production"
echo ""
echo "📚 For more information, see ENV_README.md"
