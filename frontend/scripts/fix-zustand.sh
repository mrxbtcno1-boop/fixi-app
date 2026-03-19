#!/bin/bash
# Fix zustand import.meta.env references for Hermes compatibility
# Works for both zustand v4 and v5

ZUSTAND_DIR="node_modules/zustand"

if [ -d "$ZUSTAND_DIR" ]; then
  find "$ZUSTAND_DIR" -name "*.mjs" -exec sed -i 's/(import\.meta\.env ? import\.meta\.env\.MODE : void 0)/("production")/g' {} +
  echo "[fix-zustand] Patched import.meta.env references in zustand files"
fi
