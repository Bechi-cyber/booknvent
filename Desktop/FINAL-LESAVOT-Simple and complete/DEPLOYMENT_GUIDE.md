# LESAVOT Web App Deployment Guide

## Option 1: Vercel Deployment (RECOMMENDED)

### Step 1: Prepare Your Project Structure

1. **Create a new folder structure for Vercel:**
```
lesavot-web/
├── public/
│   ├── index.html
│   ├── auth.html
│   ├── text_stego.html
│   ├── image_stego.html
│   ├── audio_stego.html
│   ├── profile.html
│   ├── styles.css
│   ├── *.js files
│   └── assets/
├── api/
│   ├── auth/
│   │   ├── login.js
│   │   ├── register.js
│   │   └── logout.js
│   ├── steganography/
│   │   ├── text.js
│   │   ├── image.js
│   │   └── audio.js
│   └── users/
│       └── profile.js
├── package.json
├── vercel.json
└── README.md
```

### Step 2: Create Vercel Configuration

Create `vercel.json` in your root directory:

```json
{
  "version": 2,
  "builds": [
    {
      "src": "public/**/*",
      "use": "@vercel/static"
    },
    {
      "src": "api/**/*.js",
      "use": "@vercel/node"
    }
  ],
  "routes": [
    {
      "src": "/api/(.*)",
      "dest": "/api/$1"
    },
    {
      "src": "/(.*)",
      "dest": "/public/$1"
    }
  ],
  "env": {
    "SUPABASE_URL": "@supabase_url",
    "SUPABASE_ANON_KEY": "@supabase_anon_key",
    "JWT_SECRET": "@jwt_secret"
  }
}
```

### Step 3: Update package.json

```json
{
  "name": "lesavot-web",
  "version": "1.0.0",
  "description": "LESAVOT Multimodal Steganography Platform",
  "main": "index.js",
  "scripts": {
    "dev": "vercel dev",
    "build": "echo 'Build complete'",
    "start": "vercel dev"
  },
  "dependencies": {
    "@supabase/supabase-js": "^2.49.4",
    "jsonwebtoken": "^9.0.0",
    "bcryptjs": "^2.4.3",
    "cors": "^2.8.5",
    "express": "^4.18.2"
  },
  "devDependencies": {
    "vercel": "^32.0.0"
  }
}
```

### Step 4: Convert Server Routes to Vercel Functions

Example API function (`api/auth/login.js`):

```javascript
import { createClient } from '@supabase/supabase-js';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { email, password } = req.body;

    // Authenticate with Supabase
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (error) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId: data.user.id, email: data.user.email },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.status(200).json({
      success: true,
      token,
      user: {
        id: data.user.id,
        email: data.user.email
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
```

### Step 5: Deploy to Vercel

1. **Install Vercel CLI:**
```bash
npm install -g vercel
```

2. **Login to Vercel:**
```bash
vercel login
```

3. **Deploy:**
```bash
vercel --prod
```

4. **Set Environment Variables:**
```bash
vercel env add SUPABASE_URL
vercel env add SUPABASE_ANON_KEY
vercel env add JWT_SECRET
```

## Option 2: Netlify + Supabase Edge Functions

### Step 1: Prepare for Netlify

Create `netlify.toml`:

```toml
[build]
  publish = "web_version"
  command = "echo 'Static site ready'"

[[redirects]]
  from = "/api/*"
  to = "/.netlify/functions/:splat"
  status = 200

[[headers]]
  for = "/*"
  [headers.values]
    X-Frame-Options = "DENY"
    X-XSS-Protection = "1; mode=block"
    X-Content-Type-Options = "nosniff"
    Referrer-Policy = "strict-origin-when-cross-origin"
```

### Step 2: Create Netlify Functions

Create `netlify/functions/` directory and add serverless functions.

### Step 3: Deploy to Netlify

1. **Connect GitHub repository to Netlify**
2. **Set environment variables in Netlify dashboard**
3. **Deploy automatically on git push**

## Option 3: GitHub Pages + Supabase (Frontend Only)

### Step 1: Create GitHub Actions Workflow

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches: [ main ]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v2

    - name: Setup Node.js
      uses: actions/setup-node@v2
      with:
        node-version: '18'

    - name: Install dependencies
      run: npm install

    - name: Build
      run: npm run build
      env:
        SUPABASE_URL: ${{ secrets.SUPABASE_URL }}
        SUPABASE_ANON_KEY: ${{ secrets.SUPABASE_ANON_KEY }}

    - name: Deploy to GitHub Pages
      uses: peaceiris/actions-gh-pages@v3
      with:
        github_token: ${{ secrets.GITHUB_TOKEN }}
        publish_dir: ./web_version
```

## Option 4: Railway (Full-Stack)

### Step 1: Prepare for Railway

Create `railway.json`:

```json
{
  "build": {
    "builder": "NIXPACKS"
  },
  "deploy": {
    "startCommand": "npm start",
    "healthcheckPath": "/health"
  }
}
```

### Step 2: Deploy to Railway

1. **Connect GitHub repository**
2. **Set environment variables**
3. **Deploy automatically**

## Recommended Deployment Strategy

### Phase 1: Quick Start (GitHub Pages)
- Deploy frontend to GitHub Pages
- Use Supabase for backend services
- Get online quickly with minimal setup

### Phase 2: Full Deployment (Vercel)
- Migrate to Vercel for better performance
- Add serverless functions for custom logic
- Implement proper API endpoints

### Phase 3: Production Ready (Railway/Render)
- Use dedicated hosting for high traffic
- Implement monitoring and analytics
- Add custom domain and SSL

## Quick Start: Deploy to GitHub Pages (Easiest Option)

### Step-by-Step Instructions:

1. **Enable GitHub Pages:**
   - Go to your repository settings
   - Scroll to "Pages" section
   - Select "Deploy from a branch"
   - Choose "main" branch and "/web_version" folder
   - Save settings

2. **Your app will be available at:**
   `https://bechi-cyber.github.io/FINAL-LESAVOT/`

3. **Update Supabase settings:**
   - Add your GitHub Pages URL to allowed origins
   - Update CORS settings in Supabase dashboard

## Environment Variables Setup

### For Vercel:
```bash
vercel env add SUPABASE_URL production
vercel env add SUPABASE_ANON_KEY production
vercel env add JWT_SECRET production
```

### For Netlify:
1. Go to Site settings > Environment variables
2. Add:
   - `SUPABASE_URL`
   - `SUPABASE_ANON_KEY`
   - `JWT_SECRET`

### For Railway:
1. Go to project settings > Variables
2. Add the same environment variables

## Custom Domain Setup (Optional)

### For Vercel:
1. Go to project settings > Domains
2. Add your custom domain
3. Update DNS records as instructed

### For Netlify:
1. Go to Site settings > Domain management
2. Add custom domain
3. Configure DNS

## SSL Certificate

All recommended platforms provide automatic SSL certificates:
- ✅ Vercel: Automatic SSL
- ✅ Netlify: Automatic SSL
- ✅ GitHub Pages: Automatic SSL
- ✅ Railway: Automatic SSL

## Performance Optimization

### Enable Compression:
Add to `vercel.json`:
```json
{
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "Cache-Control",
          "value": "public, max-age=31536000, immutable"
        }
      ]
    }
  ]
}
```

### CDN Configuration:
- Vercel: Built-in global CDN
- Netlify: Built-in global CDN
- GitHub Pages: Built-in CDN

## Monitoring and Analytics

### Add to your HTML:
```html
<!-- Google Analytics (Optional) -->
<script async src="https://www.googletagmanager.com/gtag/js?id=GA_MEASUREMENT_ID"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'GA_MEASUREMENT_ID');
</script>
```

## Security Headers

### Add to `vercel.json`:
```json
{
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "X-Content-Type-Options",
          "value": "nosniff"
        },
        {
          "key": "X-Frame-Options",
          "value": "DENY"
        },
        {
          "key": "X-XSS-Protection",
          "value": "1; mode=block"
        }
      ]
    }
  ]
}
```

## Troubleshooting Common Issues

### CORS Errors:
- Add your domain to Supabase allowed origins
- Check API endpoint URLs
- Verify environment variables

### 404 Errors:
- Check file paths in HTML
- Verify routing configuration
- Ensure all files are in correct directories

### Authentication Issues:
- Verify Supabase configuration
- Check JWT secret is set
- Confirm API endpoints are working

## Next Steps After Deployment

1. **Test all functionality**
2. **Set up monitoring**
3. **Configure custom domain**
4. **Add analytics**
5. **Implement backup strategy**
6. **Set up CI/CD pipeline**

## Support and Resources

- **Vercel Documentation**: https://vercel.com/docs
- **Netlify Documentation**: https://docs.netlify.com
- **Supabase Documentation**: https://supabase.com/docs
- **GitHub Pages**: https://pages.github.com
