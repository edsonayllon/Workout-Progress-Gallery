# Workout Progress Gallery - Landing Page

SEO-optimized landing page for Workout Progress Gallery.

## Structure

```
landing/
├── index.html        # Main landing page
├── download.html     # Download page for Mac & iPhone
├── privacy.html      # Privacy policy
├── terms.html        # Terms of service
├── styles.css        # All styles
├── favicon.svg       # Favicon
├── robots.txt        # Search engine directives
├── sitemap.xml       # Sitemap for SEO
├── firebase.json     # Firebase hosting config
└── .firebaserc       # Firebase project config
```

## Deployment to Firebase Hosting

### Prerequisites

1. Install Firebase CLI:
   ```bash
   npm install -g firebase-tools
   ```

2. Login to Firebase:
   ```bash
   firebase login
   ```

### Setup

1. Update `.firebaserc` with your Firebase project ID:
   ```json
   {
     "projects": {
       "default": "your-actual-project-id"
     }
   }
   ```

2. Update URLs in the HTML files to match your domain:
   - Replace `workoutprogressgallery.app` with your domain
   - Replace `app.workoutprogressgallery.app` with your app subdomain

### Deploy

From the `landing` directory:

```bash
cd landing
firebase deploy --only hosting
```

## Custom Domain Setup

To set up the landing page on your root domain (e.g., `appname.com`) and the app on a subdomain (e.g., `app.appname.com`):

### Option 1: Single Firebase Project with Multiple Sites

1. Add a second hosting site in Firebase Console:
   - Go to Hosting > Add another site
   - Name it something like `appname-landing`

2. Update `firebase.json` to use site targeting:
   ```json
   {
     "hosting": {
       "site": "appname-landing",
       "public": ".",
       ...
     }
   }
   ```

3. Deploy with:
   ```bash
   firebase deploy --only hosting:appname-landing
   ```

4. In Firebase Console, connect custom domains:
   - `appname.com` → landing site
   - `app.appname.com` → main app site

### Option 2: Separate Firebase Projects

1. Create a separate Firebase project for the landing page
2. Update `.firebaserc` with the landing page project ID
3. Deploy and connect the domain in Firebase Console

## SEO Checklist

Before going live, ensure you:

- [ ] Update canonical URLs in all HTML files
- [ ] Update Open Graph URLs and images
- [ ] Update sitemap.xml with correct URLs and dates
- [ ] Add a real `og-image.png` (1200x630px recommended)
- [ ] Verify robots.txt sitemap URL
- [ ] Submit sitemap to Google Search Console
- [ ] Add Google Analytics (optional)

## Customization

### Updating App Links

All links to the main app point to `https://app.workoutprogressgallery.app`. Update these in:
- `index.html` - Navigation and CTA buttons
- `download.html` - Navigation and web app section
- `privacy.html` - Navigation
- `terms.html` - Navigation

### Adding Real Download Links

In `download.html`, update the JavaScript at the bottom:

```javascript
// Mac download - replace with your actual DMG/ZIP URL
document.getElementById('mac-download-btn').addEventListener('click', (e) => {
    window.location.href = 'https://your-storage-url/app.dmg';
});

// iOS download - replace with your App Store URL
document.getElementById('ios-download-btn').addEventListener('click', (e) => {
    window.location.href = 'https://apps.apple.com/app/your-app-id';
});
```

### Adding Analytics

Add Google Analytics before the closing `</head>` tag:

```html
<!-- Google Analytics -->
<script async src="https://www.googletagmanager.com/gtag/js?id=G-XXXXXXXXXX"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'G-XXXXXXXXXX');
</script>
```

## Social Proof & Testimonials

The Social Proof and Testimonials sections are commented out by default. Uncomment them in `index.html` when you have real data to display.
