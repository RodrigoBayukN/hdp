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

BINARY_NAME="hdp-${OS}-${ARCH}.tar.gz"
REPO_URL="https://github.com/RodrigoBayukN/hdp"
DOWNLOAD_URL="${REPO_URL}/releases/latest/download/${BINARY_NAME}"

echo "Installing HDP for ${OS}-${ARCH}..."

INSTALL_DIR="$HOME/.hdp/bin"
mkdir -p "$INSTALL_DIR"

# Download archive
if command -v curl >/dev/null 2>&1; then
  curl -L -o hdp.tar.gz "${DOWNLOAD_URL}"
elif command -v wget >/dev/null 2>&1; then
  wget -O hdp.tar.gz "${DOWNLOAD_URL}"
else
  echo "Error: curl or wget not found"; exit 1
fi

# Extract into install dir
tar -xzf hdp.tar.gz -C "$INSTALL_DIR"
rm hdp.tar.gz

# Make executable
chmod +x "$INSTALL_DIR/hdp"

# Add to PATH if not already present
if [[ ":$PATH:" != *":$INSTALL_DIR:"* ]]; then
  echo "export PATH=\"$INSTALL_DIR:\$PATH\"" >> "$HOME/.bashrc"
  if [ -f "$HOME/.zshrc" ]; then
    echo "export PATH=\"$INSTALL_DIR:\$PATH\"" >> "$HOME/.zshrc"
  fi
  echo "✅ HDP has been installed to $INSTALL_DIR"
  echo "⚠️  Please restart your terminal or run: source ~/.bashrc (or ~/.zshrc) to update your PATH."
else
  echo "✅ HDP has been installed successfully to $INSTALL_DIR"
fi

echo "Run 'hdp --help' to get started!"
