#!/bin/sh
# Rebuild build/icon.icns and build/icon.png from build/icon.svg.
# Needs rsvg-convert (brew install librsvg) and iconutil (ships with macOS).
set -e
cd "$(dirname "$0")/.."
set_dir=$(mktemp -d)/icon.iconset
mkdir -p "$set_dir"
for s in 16 32 128 256 512; do
  rsvg-convert -w "$s" -h "$s" build/icon.svg -o "$set_dir/icon_${s}x${s}.png"
  rsvg-convert -w $((s * 2)) -h $((s * 2)) build/icon.svg -o "$set_dir/icon_${s}x${s}@2x.png"
done
iconutil -c icns "$set_dir" -o build/icon.icns
rsvg-convert -w 1024 -h 1024 build/icon.svg -o build/icon.png
rm -rf "$(dirname "$set_dir")"
echo "wrote build/icon.icns and build/icon.png"
