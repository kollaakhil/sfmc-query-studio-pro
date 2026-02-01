#!/bin/bash
# Opens the test page in Chrome with the extension loaded
echo "🧪 Starting Query Studio Pro Test Environment..."
echo ""
echo "1. Open chrome://extensions in Chrome"
echo "2. Enable Developer Mode"
echo "3. Click 'Load unpacked' and select:"
echo "   $(cd "$(dirname "$0")/.." && pwd)"
echo ""
echo "4. Then open this test page:"
echo "   file://$(cd "$(dirname "$0")" && pwd)/index.html"
echo ""
echo "Opening test page..."
open "$(cd "$(dirname "$0")" && pwd)/index.html"
