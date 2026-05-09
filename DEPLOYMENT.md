# Deploying FileConvert to the Web

This app needs system tools (LibreOffice, Ghostscript, GraphicsMagick) so it
**cannot** be deployed to standard serverless platforms (Vercel, Netlify, Cloudflare Pages).

You need a platform that supports **Docker** or a raw **Linux VPS**.

---

## 🚀 Option A — Railway (Recommended, easiest)

Railway detects the `Dockerfile` automatically and handles everything.

**Free tier:** 5 USD/month credit (enough for light traffic)
**Pros:** One-click deploy from GitHub, automatic HTTPS, no config needed

### Steps

1. **Push your code to GitHub**
   ```bash
   git init
   git add .
   git commit -m "initial commit"
   # Create a new repo on github.com, then:
   git remote add origin https://github.com/YOUR_USERNAME/fileconvert.git
   git push -u origin main
   ```

2. **Create a Railway project**
   - Go to [railway.app](https://railway.app) → sign in with GitHub
   - Click **New Project** → **Deploy from GitHub repo**
   - Select your `fileconvert` repository
   - Railway detects the `Dockerfile` automatically and starts building

3. **Set environment variables**

   In your Railway service dashboard → **Variables** tab, add:

   | Variable | Value |
   |---|---|
   | `NODE_ENV` | `production` |
   | `PORT` | `5000` |
   | `MAX_FILE_SIZE_MB` | `50` |
   | `FILE_EXPIRY_MINUTES` | `30` |
   | `RATE_LIMIT_MAX_REQUESTS` | `100` |

4. **Generate a domain**

   Railway dashboard → your service → **Settings** → **Domains** → **Generate Domain**

   You'll get a URL like `https://fileconvert-production-xxxx.up.railway.app`

5. **Done.** The build takes 3–5 minutes (LibreOffice is large).
   Watch progress under **Deployments**.

---

## 🎨 Option B — Render

**Free tier:** Web services sleep after 15 min inactivity (free), or ~$7/mo to stay awake

### Steps

1. Push to GitHub (same as Railway step 1 above)

2. Go to [render.com](https://render.com) → **New** → **Web Service**

3. Connect your GitHub repo

4. Render detects `render.yaml` automatically — confirm the settings:
   - **Runtime:** Docker
   - **Dockerfile path:** `./Dockerfile`

5. Under **Environment Variables**, add:
   | Variable | Value |
   |---|---|
   | `NODE_ENV` | `production` |
   | `PORT` | `10000` |
   | `MAX_FILE_SIZE_MB` | `50` |
   | `FILE_EXPIRY_MINUTES` | `30` |

6. Click **Create Web Service** — build takes ~5 minutes.

> **Note:** On the free tier, the container sleeps after 15 minutes of no traffic.
> The first request after sleeping takes ~30s to wake up. Upgrade to Starter ($7/mo) to avoid this.

---

## 🖥️ Option C — DigitalOcean Droplet (Most control, ~$6/mo)

Best if you want full control, a custom domain, and no cold starts.

### 1. Create a Droplet

- [digitalocean.com](https://digitalocean.com) → **Create Droplet**
- Image: **Ubuntu 24.04 LTS**
- Size: **Basic, 2GB RAM, 1 vCPU** ($12/mo) — LibreOffice needs at least 1.5GB RAM
- Enable SSH key authentication

### 2. Set up the server

```bash
# SSH in
ssh root@YOUR_DROPLET_IP

# Install Docker
apt-get update
apt-get install -y docker.io docker-compose-plugin
systemctl enable docker
systemctl start docker

# Install Git
apt-get install -y git
```

### 3. Deploy the app

```bash
# Clone your repo (or upload files via scp/rsync)
git clone https://github.com/YOUR_USERNAME/fileconvert.git
cd fileconvert

# Build and start
docker compose up -d --build

# Check it's running
docker compose logs -f
```

App is now running on `http://YOUR_DROPLET_IP:5000`

### 4. Set up Nginx + HTTPS (optional but recommended)

```bash
apt-get install -y nginx certbot python3-certbot-nginx

# Create Nginx config
cat > /etc/nginx/sites-available/fileconvert << 'NGINX'
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;

    # Increase body size limit to match your MAX_FILE_SIZE_MB
    client_max_body_size 55M;

    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        # Increase timeouts for long conversions
        proxy_read_timeout 300s;
        proxy_send_timeout 300s;
    }
}
NGINX

ln -s /etc/nginx/sites-available/fileconvert /etc/nginx/sites-enabled/
nginx -t && systemctl reload nginx

# Get free SSL cert
certbot --nginx -d yourdomain.com -d www.yourdomain.com
```

### 5. Auto-restart on reboot

```bash
# docker compose already handles this via restart: unless-stopped
# But also enable Docker to start on boot:
systemctl enable docker
```

---

## ⚠️ Important: Files Are Ephemeral on Railway/Render

Railway and Render use **ephemeral filesystems** — uploaded and converted files
are lost when the container restarts or redeploys. For an MVP this is fine
(files auto-delete after 30 min anyway), but if you want persistence:

### Option 1: Mount a volume (Railway/Render both support this)

In Railway: Service → **Volumes** → Add volume mounted at `/app/server/outputs`

### Option 2: Migrate to S3 (recommended for production scale)

All file I/O goes through `server/utils/fileUtils.js`. Replace `getOutputUrl()`,
`writeOutputFile()`, and `deleteFile()` with AWS S3 SDK calls.

```bash
npm install @aws-sdk/client-s3 @aws-sdk/s3-request-presigner --prefix server
```

Then add to your platform's environment variables:
```
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=...
AWS_SECRET_ACCESS_KEY=...
S3_BUCKET_NAME=fileconvert-outputs
```

---

## 🔧 Environment Variables Reference

| Variable | Default | Description |
|---|---|---|
| `NODE_ENV` | `development` | Set to `production` on all platforms |
| `PORT` | `5000` | Port Express listens on (Railway auto-sets this) |
| `MAX_FILE_SIZE_MB` | `50` | Max upload size per file |
| `FILE_EXPIRY_MINUTES` | `30` | Auto-delete files after this many minutes |
| `RATE_LIMIT_MAX_REQUESTS` | `100` | Max API requests per 15 min per IP |
| `BASE_URL` | *(not needed)* | Only set if using external storage (S3). Leave unset otherwise — app uses relative paths automatically. |

---

## 🐛 Troubleshooting Deployments

**Build takes too long / times out**
LibreOffice is ~300MB — the first Docker build always takes 5–8 min.
Subsequent builds are faster due to Docker layer caching.

**"LibreOffice not found" error after deploy**
Check the Docker build logs — the `apt-get install libreoffice` step should be visible.
If it failed, check Railway/Render build logs for apt errors.

**File download 404 after conversion**
The `/outputs` directory inside the container was cleared (container restart).
This is expected — converted files are ephemeral. Add a persistent volume to fix it.

**Out of memory error**
LibreOffice needs ~512MB RAM to convert a PDF. Upgrade to a plan with at least 1GB RAM.
On Railway: Service Settings → increase RAM limit.
On DigitalOcean: resize to the 2GB Droplet.

**App works but is slow**
LibreOffice spawns a new process per conversion — the first conversion after a cold
start takes 10–20s. Subsequent ones are faster. This is normal.
