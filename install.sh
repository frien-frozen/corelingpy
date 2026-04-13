echo "⚡ Installing Coreling AI Orchestrator..."

curl -sL "https://raw.githubusercontent.com/frien-frozen/corelingpy/corelingv1.py" -o /tmp/coreling

chmod +x /tmp/coreling

echo "Requesting permission to move to /usr/local/bin..."
sudo mv /tmp/coreling /usr/local/bin/coreling

echo "Coreling installed successfully!"
echo "Type 'coreling' in your terminal to start."