#!/bin/bash

# LESAVOT Frontend Build Script for Render Deployment
echo "🚀 Starting LESAVOT Frontend Build Process..."

# Check if web_version directory exists
if [ ! -d "web_version" ]; then
    echo "❌ Error: web_version directory not found!"
    exit 1
fi

echo "📁 Checking web_version directory structure..."
ls -la web_version/

# Verify critical files exist
critical_files=(
    "web_version/index.html"
    "web_version/auth.html"
    "web_version/config.js"
    "web_version/styles.css"
)

for file in "${critical_files[@]}"; do
    if [ ! -f "$file" ]; then
        echo "❌ Error: Critical file missing: $file"
        exit 1
    else
        echo "✅ Found: $file"
    fi
done

# Check for steganography pages
stego_files=(
    "web_version/text_stego.html"
    "web_version/image_stego.html"
    "web_version/audio_stego.html"
    "web_version/steganography-demo.html"
    "web_version/dh-demo.html"
)

for file in "${stego_files[@]}"; do
    if [ ! -f "$file" ]; then
        echo "⚠️  Warning: Steganography file missing: $file"
    else
        echo "✅ Found: $file"
    fi
done

# Verify configuration
echo "🔧 Verifying configuration..."
if grep -q "lasavot-backend.onrender.com" web_version/config.js; then
    echo "✅ Backend URL configured correctly"
else
    echo "⚠️  Warning: Backend URL might not be configured correctly"
fi

# Create _redirects file if it doesn't exist
if [ ! -f "web_version/_redirects" ]; then
    echo "📝 Creating _redirects file..."
    cat > web_version/_redirects << 'EOF'
# Redirect rules for LESAVOT frontend
/auth           /auth.html          200
/text           /text_stego.html    200
/image          /image_stego.html   200
/audio          /audio_stego.html   200
/profile        /profile.html       200
/history        /history.html       200
/demo           /steganography-demo.html  200
/dh-demo        /dh-demo.html       200
/mfa-setup      /mfa-setup.html     200

# Fallback for SPA routing
/*              /index.html         200
EOF
    echo "✅ _redirects file created"
else
    echo "✅ _redirects file already exists"
fi

# Optimize files for production
echo "⚡ Optimizing for production..."

# Remove any development files
dev_files=(
    "web_version/test-*.html"
    "web_version/*.log"
    "web_version/node_modules"
)

for pattern in "${dev_files[@]}"; do
    if ls $pattern 1> /dev/null 2>&1; then
        echo "🧹 Removing development files: $pattern"
        rm -rf $pattern
    fi
done

# Final verification
echo "🔍 Final verification..."
total_files=$(find web_version -type f | wc -l)
total_size=$(du -sh web_version | cut -f1)

echo "📊 Build Summary:"
echo "   - Total files: $total_files"
echo "   - Total size: $total_size"
echo "   - Build directory: web_version/"

echo "✅ LESAVOT Frontend Build Complete!"
echo "🚀 Ready for Render deployment!"

exit 0
