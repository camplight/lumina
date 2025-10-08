#!/bin/bash
set -e

echo "Installing system dependencies for Wails..."
sudo apt-get update
sudo apt-get install -y \
  libgtk-3-dev \
  libwebkit2gtk-4.0-dev \
  build-essential \
  pkg-config

echo "Installing Wails CLI..."
go install github.com/wailsapp/wails/v2/cmd/wails@latest

echo "Verifying installation..."
wails doctor

echo "Setup complete! You can now run 'wails dev' to start your application."