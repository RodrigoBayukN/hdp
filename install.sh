#!/bin/bash

# HDP Installer Script
# Detect OS and Architecture
OS="$(uname -s | tr '[:upper:]' '[:lower:]')"
ARCH="$(uname -m)"

case "$OS" in
  linux)   OS="linux" ;;
  darwin)  OS="macos" ;;
  *)       echo "Error: OS $OS not supported"; exit 1 ;;
esac

case "$ARCH" in
  x86_64)  ARCH="x64" ;;
  arm64|aarch64) ARCH="arm64" ;;
  *)       echo "Error: Architecture $ARCH not supported"; exit 1 ;;
esac

BINARY_NAME="hdp-${OS}-${ARCH}"
REPO_URL="https://github.com/RodrigoBayukN/hdp"
DOWNLOAD_URL="${REPO_URL}/releases/latest/download/${BINARY_NAME}"

echo "Installing HDP for ${OS}-${ARCH}..."

# Download binary
if command -v curl >/dev/null 2>&1; then
  curl -L -o hdp "${DOWNLOAD_URL}"
elif command -v wget >/dev/null 2>&1; then
  wget -O hdp "${DOWNLOAD_URL}"
else
  echo "Error: curl or wget not found"; exit 1
fi

# Make executable
chmod +x hdp

# Move to bin directory
if [ -w /usr/local/bin ]; then
  mv hdp /usr/local/bin/hdp
else
  sudo mv hdp /usr/local/bin/hdp
fi

echo "✅ HDP has been installed successfully to /usr/local/bin/hdp"
echo "Run 'hdp --help' to get started!"
