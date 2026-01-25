# Gains Mirror - Landing Page

SEO-optimized landing page for Gains Mirror.

## Structure

```
landing/
├── index.html        # Main landing page
├── download.html     # Download page for Mac & iPhone
├── privacy.html      # Privacy policy
├── terms.html        # Terms of service
├── 404.html          # Error page
├── styles.css        # All styles
├── favicon.svg       # Favicon
├── og-image.svg      # Social sharing image (convert to PNG)
├── robots.txt        # Search engine directives
└── sitemap.xml       # Sitemap for SEO
```

## Deployment

The landing page is deployed alongside the main app using Firebase Hosting with multiple sites.

### Automatic Deployment (GitHub Actions)

- **On merge to `release` branch**: Both app and landing page deploy to production
- **On pull request**: Preview URLs are generated for both

### Manual Deployment

From the repository root:

```bash
# Deploy only the landing page
firebase deploy --only hosting:landing

# Deploy only the app
firebase deploy --only hosting:app

# Deploy both
firebase deploy --only hosting
```

### Firebase Configuration

The deployment is configured in the root `firebase.json`:
- **App target**: `app` → deploys `dist/` to main site
- **Landing target**: `landing` → deploys `landing/` to landing site

Targets are mapped in `.firebaserc`:
- `app` → `workout-progress-app-297f6` (app.gainsmirror.com)
- `landing` → `gainsmirrorlanding` (gainsmirror.com)

## Custom Domain Setup

In Firebase Console (Hosting):

1. Click on `gainsmirrorlanding` site → Add custom domain → `gainsmirror.com`
2. Click on main app site → Add custom domain → `app.gainsmirror.com`

Firebase will provide DNS records to add to your domain registrar.

## SEO Checklist

Before going live:

- [ ] Convert `og-image.svg` to `og-image.png` (1200x630px)
- [ ] Submit sitemap to Google Search Console
- [ ] Verify site in Google Search Console
- [ ] Add Google Analytics (optional)

## Customization

### Adding Real Download Links

In `download.html`, update the JavaScript:

```javascript
// Mac download
document.getElementById('mac-download-btn').addEventListener('click', (e) => {
    window.location.href = 'https://your-storage-url/GainsMirror.dmg';
});

// iOS download
document.getElementById('ios-download-btn').addEventListener('click', (e) => {
    window.location.href = 'https://apps.apple.com/app/your-app-id';
});
```

### Adding Analytics

Add before the closing `</head>` tag:

```html
<script async src="https://www.googletagmanager.com/gtag/js?id=G-XXXXXXXXXX"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'G-XXXXXXXXXX');
</script>
```

## Social Proof & Testimonials

The Social Proof and Testimonials sections are commented out in `index.html`. Uncomment them when you have real data to display.
