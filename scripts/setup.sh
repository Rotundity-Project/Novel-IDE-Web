#!/usr/bin/env bash
set -euo pipefail

cp -n .env.example .env || true
cp -n app/.env.example app/.env.local || true
cp -n server/.env.example server/.env || true

pnpm install

echo "Setup complete."
echo "Run: pnpm dev:server"
echo "Run: pnpm dev:app"
