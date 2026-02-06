#!/usr/bin/env bash
set -euo pipefail

if ! command -v npm >/dev/null 2>&1; then
  echo "npm not found. Please install Node.js." >&2
  exit 1
fi

npm run dev
