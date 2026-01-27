# Deployment Guide - GitHub Pages

Deploy your DEX Aggregator Performance Comparator to GitHub Pages for free.

## Quick Start

Your app is already configured! Just follow these 3 steps:

### 1. Enable GitHub Pages

1. Go to: https://github.com/galinettedede-max/quote-app/settings/pages
2. Under **"Source"**, select **"GitHub Actions"**
3. Click Save

### 2. Push Your Code

```bash
git add .
git commit -m "Enable GitHub Pages deployment"
git push
```

### 3. Access Your Site

Your site will be live at:
**https://galinettedede-max.github.io/quote-app/**

Monitor deployment progress at: https://github.com/galinettedede-max/quote-app/actions

---

## Configuration

### Next.js Config

Your [next.config.js](next.config.js) enables static export:

```js
const nextConfig = {
  reactStrictMode: true,
  output: 'export',        // Static HTML export
  images: {
    unoptimized: true,     // Required for GitHub Pages
  },
}
```

The GitHub Actions workflow automatically injects the correct `basePath` for your repository.

### Workflow

The deployment workflow at [.github/workflows/deploy-github-pages.yml](.github/workflows/deploy-github-pages.yml) runs automatically on every push to `main`.

**Features:**
- ✅ Automatic builds on push
- ✅ Smart caching for faster builds
- ✅ Manual workflow trigger option

---

## Updating Your Site

### Update Data
```bash
# Replace data file
cp new-data.csv data/quotes.csv

# Push changes
git add data/quotes.csv
git commit -m "Update quote data"
git push
```

Auto-deploys in ~2-3 minutes.

### Update Code
```bash
# Make changes, then:
git add .
git commit -m "Your changes"
git push
```

---

## Manual Deployment

Trigger deployment manually:

1. Go to: https://github.com/galinettedede-max/quote-app/actions
2. Click "Deploy Next.js site to Pages"
3. Click "Run workflow" → Select `main` → "Run workflow"

---

## Troubleshooting

### Build Fails
1. Check logs at: https://github.com/galinettedede-max/quote-app/actions
2. Common fixes:
   - Fix TypeScript errors
   - Update `package.json` dependencies
   - Check file size (1GB limit)

### Site Shows 404
- Wait 5-10 minutes after first deployment
- Clear browser cache (Cmd/Ctrl + Shift + R)
- Verify GitHub Pages is enabled in settings

### Data Not Updating
- Confirm changes were pushed to `main` branch
- Check workflow completed successfully
- Clear browser cache

---

## Limitations

**GitHub Pages static export:**
- ❌ No API routes (server-side code)
- ❌ No server-side rendering
- ✅ All client-side features work perfectly
- ✅ Charts, filtering, and data loading work great

---

## Custom Domain (Optional)

1. Add `CNAME` file to repo root with your domain:
   ```
   your-domain.com
   ```

2. Configure DNS:
   ```
   Type: CNAME
   Name: www
   Value: galinettedede-max.github.io
   ```

3. Enable in repository settings

---

## Need Help?

- [GitHub Pages Docs](https://docs.github.com/en/pages)
- [Next.js Static Export](https://nextjs.org/docs/app/building-your-application/deploying/static-exports)

---

## Summary

✨ Your site is ready to deploy!

Just push to `main` and your site goes live at:
**https://galinettedede-max.github.io/quote-app/**

Happy deploying! 🚀
