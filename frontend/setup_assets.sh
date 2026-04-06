#!/bin/bash
# Run this once after cloning to copy the design assets into the public folder.
# Place the provided_design folder at the same level as this script.
#
# Usage:  bash setup_assets.sh

DESIGN_DIR="/home/upay/Documents/socialapp/frontend/provided_design"   # adjust if needed

if [ ! -d "$DESIGN_DIR" ]; then
  echo "ERROR: provided_design folder not found at $DESIGN_DIR"
  echo "Please place the provided_design folder next to the frontend folder."
  exit 1
fi

mkdir -p public/assets
cp -r "$DESIGN_DIR/assets/images" public/assets/
cp -r "$DESIGN_DIR/assets/css"    public/assets/
cp -r "$DESIGN_DIR/assets/fonts"  public/assets/

echo "✅ Assets copied to public/assets/"
echo "Now run: npm install && npm run dev"