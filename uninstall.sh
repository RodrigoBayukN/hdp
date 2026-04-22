#!/bin/bash

# HDP Uninstaller Script

INSTALL_DIR="$HOME/.hdp/bin"

echo "Uninstalling HDP..."

# Remove binaries
if [ -d "$INSTALL_DIR" ]; then
    rm -rf "$INSTALL_DIR"
    echo "Removed HDP files from $INSTALL_DIR"
else
    echo "HDP files not found at $INSTALL_DIR"
fi

# Remove from PATH in .bashrc and .zshrc
if [ -f "$HOME/.bashrc" ]; then
    sed -i.bak "\|export PATH=\"$INSTALL_DIR:\$PATH\"|d" "$HOME/.bashrc"
    echo "Removed HDP from PATH in .bashrc"
fi

if [ -f "$HOME/.zshrc" ]; then
    sed -i.bak "\|export PATH=\"$INSTALL_DIR:\$PATH\"|d" "$HOME/.zshrc"
    echo "Removed HDP from PATH in .zshrc"
fi

echo "Uninstall complete! You may need to restart your terminal for PATH changes to take effect."
