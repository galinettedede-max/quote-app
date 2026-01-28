# Deployment Guide - Render.com

Deploy your DEX Aggregator Performance Comparator to Render.com with full Node.js support for API routes.

## Why Render.com?

Render.com supports:
- ✅ Full Node.js runtime (API routes work perfectly)
- ✅ Filesystem access for reading CSV/JSON data
- ✅ Automatic deployments from GitHub
- ✅ Free tier available
- ✅ HTTPS included

---

## Quick Start

### 1. Prerequisites

- GitHub account with your repository
- Render.com account (sign up at https://render.com)

### 2. Update Next.js Configuration

First, update your [next.config.js](next.config.js) to remove static export mode:

```js
/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Removed output: 'export' to enable API routes
}

module.exports = nextConfig
```

Commit this change:
```bash
git add next.config.js
git commit -m "Configure for Render.com deployment"
git push
```

### 3. Deploy to Render.com

1. **Go to Render Dashboard**: https://dashboard.render.com/
2. **Click "New +"** → Select **"Web Service"**
3. **Connect your GitHub repository**:
   - Authorize Render to access your GitHub
   - Select your repository
4. **Configure the service**:
   - **Name**: `quote-app` (or your preferred name)
   - **Region**: Choose closest to your users
   - **Branch**: `main`
   - **Runtime**: `Node`
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm run start`
   - **Instance Type**: Free (or choose paid for better performance)

5. **Click "Create Web Service"**

### 4. Access Your Site

Your site will be live at:
**https://quote-app-XXXX.onrender.com** (Render provides the exact URL)

Initial deployment takes 5-10 minutes.

---

## Configuration Details

### Build Settings

| Setting | Value |
|---------|-------|
| Build Command | `npm install && npm run build` |
| Start Command | `npm run start` |
| Node Version | 20.x (detected automatically) |

### Environment Variables (Optional)

If needed, add environment variables in Render dashboard:
- Go to your service → **Environment** tab
- Add key-value pairs
- Example: `NODE_ENV=production`

---

## Updating Your Site

### Auto-Deploy on Git Push

Render automatically deploys when you push to `main`:

```bash
# Update data
cp new-data.csv data/quotes.csv
git add data/quotes.csv
git commit -m "Update quote data"
git push

# Render auto-deploys in 2-5 minutes
```

### Manual Deploy

Trigger deployment manually:
1. Go to your service dashboard
2. Click **"Manual Deploy"** → Select `main` branch
3. Click **"Deploy"**

### View Logs

Real-time logs available in dashboard:
1. Go to your service
2. Click **"Logs"** tab
3. Monitor build and runtime logs

---

## Data Management

### Adding/Updating Data Files

Your data files in `/data/` directory are automatically included:
- `data/quotes.csv` - Main data source
- `data/quotes.json` - Alternative JSON format
- `data/trades.json` - Legacy format

Just commit and push to update:
```bash
git add data/
git commit -m "Update data files"
git push
```

---

## Troubleshooting

### Build Fails

**Check build logs:**
1. Dashboard → Your Service → **Logs** tab
2. Look for error messages

**Common fixes:**
- TypeScript errors: Fix in code and push
- Missing dependencies: Check `package.json`
- Build timeout: Upgrade to paid tier for faster builds

### Site Shows Error/404

**Check if service is running:**
- Dashboard shows **"Live"** status (green)
- View **Logs** for runtime errors

**Common issues:**
- Port configuration: Render automatically sets `PORT` env var
- API route errors: Check logs for filesystem issues

### Data Not Loading

**Verify data files:**
```bash
# Check files are in repo
git ls-files data/

# Should show:
# data/quotes.csv
# data/quotes.json.example
# data/trades.json
```

**Check API route:**
- Visit: `https://your-app.onrender.com/api/data`
- Should return JSON array
- If empty or error, check logs

### Slow Performance

Free tier services spin down after 15 minutes of inactivity:
- First request after sleep takes 30-60 seconds
- Upgrade to paid tier ($7/month) for always-on service

---

## Custom Domain (Optional)

1. **Add custom domain in Render:**
   - Go to your service → **Settings** tab
   - Scroll to **Custom Domain**
   - Click **"Add Custom Domain"**
   - Enter your domain (e.g., `quotes.yourdomain.com`)

2. **Configure DNS:**
   ```
   Type: CNAME
   Name: quotes (or www)
   Value: your-app.onrender.com
   ```

3. **SSL Certificate:**
   - Render automatically provisions SSL
   - HTTPS ready in ~5 minutes

---

## Cost

**Free Tier:**
- 750 hours/month (always-on for 1 service)
- Services spin down after 15 min inactivity
- 100GB bandwidth/month
- Perfect for testing and demos

**Paid Tier ($7/month):**
- Always-on (no spin down)
- Faster builds
- More resources

---

## Monitoring

### Check Service Health

Dashboard shows:
- **Status**: Live/Building/Failed
- **Last Deploy**: Timestamp and commit
- **Metrics**: CPU, Memory, Response times (paid tier)

### Logs

Real-time logs for debugging:
```
Render Dashboard → Your Service → Logs
```

View:
- Build logs
- Application logs (console.log output)
- Error messages

---

## Comparison: Render.com vs GitHub Pages

| Feature | Render.com | GitHub Pages |
|---------|------------|--------------|
| API Routes | ✅ Full support | ❌ Static only |
| Filesystem Access | ✅ Yes | ❌ No |
| Server-Side Rendering | ✅ Yes | ❌ No |
| Auto-Deploy | ✅ Yes | ✅ Yes |
| Cost | Free tier available | Free |
| Custom Domain | ✅ Yes | ✅ Yes |
| SSL/HTTPS | ✅ Auto | ✅ Auto |

**For this app: Render.com is recommended** because your API routes need filesystem access to read CSV/JSON data files.

---

## Need Help?

- [Render Documentation](https://render.com/docs)
- [Render Support](https://render.com/support)
- [Next.js Deployment Guide](https://nextjs.org/docs/deployment)

---

## Summary

**To deploy:**

1. Update `next.config.js` (remove `output: 'export'`)
2. Push to GitHub
3. Create Web Service on Render.com
4. Connect your GitHub repo
5. Deploy with: Build = `npm install && npm run build`, Start = `npm run start`

Your site will be live with full API route support!

Happy deploying! 🚀
