#!/bin/bash
cd "$(dirname "$0")/../node_modules/zustand/esm"
for f in *.mjs; do
  sed -i 's/import\.meta\.env ? import\.meta\.env\.MODE : void 0/typeof process !== "undefined" \&\& process.env ? process.env.NODE_ENV : void 0/g' "$f" 2>/dev/null
done
echo "zustand ESM patched"
