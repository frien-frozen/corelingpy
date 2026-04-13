#!/bin/bash
set -e

setup_dirs() {
  mkdir -p "$HOME/.coreling/artifacts"
}

download_core() {
  curl -fsSL "https://raw.githubusercontent.com/frien-frozen/corelingpy/main/coreling.py" -o /tmp/coreling
  chmod +x /tmp/coreling
}

install_bin() {
  if [ -w "/usr/local/bin" ]; then
    mv /tmp/coreling /usr/local/bin/coreling
  else
    sudo mv /tmp/coreling /usr/local/bin/coreling
  fi
}

setup_dirs
download_core
install_bin