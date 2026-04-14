#!/usr/bin/env bash
set -e

C_DIR="$HOME/.coreling"
mkdir -p "$C_DIR"

echo -e "\033[96m⚡ Pulling Coreling Engine...\033[0m"
# Downloads the Mac/Linux binary (assuming you named it 'coreling' without an extension)
curl -fsSL "https://raw.githubusercontent.com/frien-frozen/corelingpy/main/coreling" -o "$C_DIR/coreling"
chmod +x "$C_DIR/coreling"

# Add to PATH if it's not already there
if [[ ":$PATH:" != *":$C_DIR:"* ]]; then
    SHELL_RC=""
    if [ -n "$ZSH_VERSION" ] || [ -f "$HOME/.zshrc" ]; then
        SHELL_RC="$HOME/.zshrc"
    elif [ -n "$BASH_VERSION" ] || [ -f "$HOME/.bashrc" ]; then
        SHELL_RC="$HOME/.bashrc"
    fi
    
    if [ -n "$SHELL_RC" ]; then
        echo "export PATH=\"\$PATH:$C_DIR\"" >> "$SHELL_RC"
        echo -e "\033[92m⚡ Coreling installed perfectly.\033[0m"
        echo -e "\033[90mRestart your terminal (or open a new tab), then type 'coreling' anywhere.\033[0m"
    else
        echo -e "\033[93mPlease manually add $C_DIR to your PATH.\033[0m"
    fi
else
    echo -e "\033[92m⚡ Coreling installed perfectly. You can now type 'coreling' anywhere.\033[0m"
fi