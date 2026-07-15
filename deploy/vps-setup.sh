#!/bin/bash
set -e

echo "=== SocialApp Backend VPS Setup ==="

if [ -z "$1" ]; then
    echo "Usage: $0 <your-domain> [github-username]"
    echo "Example: $0 thisisharun.xyz harunurrashid97"
    exit 1
fi

DOMAIN=$1
APP_DIR="/opt/socialapp"
GITHUB_USER="${2:-}"

echo "[1/6] Updating system..."
apt-get update && apt-get upgrade -y

echo "[2/6] Installing Docker & Docker Compose..."
if ! command -v docker &> /dev/null; then
    apt-get install -y ca-certificates curl gnupg lsb-release
    mkdir -p /etc/apt/keyrings
    curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor -o /etc/apt/keyrings/docker.gpg
    echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | tee /etc/apt/sources.list.d/docker.list > /dev/null
    apt-get update && apt-get install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin
fi

echo "[3/6] Installing Nginx..."
apt-get install -y nginx

echo "[4/6] Installing Certbot for SSL..."
apt-get install -y certbot python3-certbot-nginx

echo "[5/6] Setting up application directory..."
mkdir -p $APP_DIR
cd $APP_DIR

if [ ! -d ".git" ]; then
    if [ -z "$GITHUB_USER" ]; then
        echo "ERROR: /opt/socialapp is not a git repository"
        echo ""
        echo "Please clone your repo first:"
        echo "  git clone https://github.com/YOUR_USERNAME/socialapp.git $APP_DIR"
        echo ""
        echo "Or run this script with your GitHub username:"
        echo "  bash deploy/vps-setup.sh $DOMAIN YOUR_USERNAME"
        exit 1
    fi
    
    REPO_URL="https://github.com/${GITHUB_USER}/socialapp.git"
    
    if [ -d "$APP_DIR" ] && [ "$(ls -A $APP_DIR)" ]; then
        echo "ERROR: $APP_DIR is not empty and not a git repo"
        echo "Please remove it first: rm -rf $APP_DIR"
        exit 1
    fi
    
    echo "Cloning repository from $REPO_URL..."
    git clone "$REPO_URL" "$APP_DIR"
    cd "$APP_DIR"
fi

echo "[6/6] Configuring Nginx..."
cp nginx/backend.conf /etc/nginx/sites-available/socialapp-backend
ln -sf /etc/nginx/sites-available/socialapp-backend /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default
nginx -t && systemctl reload nginx

echo "=== Setting up SSL with Certbot ==="
certbot --nginx -d $DOMAIN -d www.$DOMAIN --non-interactive --agree-tos -m admin@$DOMAIN

echo "=== Setting up Systemd service ==="
cp deploy/socialapp-backend.service /etc/systemd/system/
systemctl daemon-reload
systemctl enable socialapp-backend
systemctl start socialapp-backend

echo ""
echo "=== Setup Complete ==="
echo "App directory: $APP_DIR"
echo "Domain: https://$DOMAIN"
echo ""
echo "Next steps:"
echo "1. Set GitHub Secrets in your repo settings:"
echo "   - VPS_HOST: $(curl -s ifconfig.me)"
echo "   - VPS_USER: root (or your SSH user)"
echo "   - VPS_SSH_KEY: contents of your SSH private key"
echo ""
echo "2. Push to main branch to trigger first deployment:"
echo "   git push origin main"
echo ""
echo "3. Verify backend is running:"
echo "   curl https://$DOMAIN/api/health/ (or your health endpoint)"
