# 🚀 FactoryOS Cloud Deployment Guide

## 📐 Architecture Overview

```
zipybills.com (Reserved for future corporate site)
    ↓
factoryos.zipybills.com          → Marketing/Landing Page + Signup
    ↓
app.factoryos.zipybills.com      → Main SaaS Application (Multi-tenant)
    ↓
api.factoryos.zipybills.com      → Backend API (Express)
```

## 🎯 Deployment Status

### ✅ Backend API (Deployed)
- **Platform**: Render.com (Free Tier)
- **URL**: https://zipybills-monorepo.onrender.com
- **Custom Domain**: Will be `api.factoryos.zipybills.com`
- **Database**: Neon Postgres (Serverless)

### 🔄 Frontend 1: Marketing Site (Ready to Deploy)
- **Platform**: Vercel (Free Tier)
- **Source**: `apps/marketing-site` (Next.js 14)
- **Custom Domain**: Will be `factoryos.zipybills.com`
- **Features**: Landing page, Pricing, Signup flow

### 🔄 Frontend 2: FactoryOS App (Ready to Deploy)
- **Platform**: Vercel (Free Tier)
- **Source**: `apps/factoryOS` (Expo Web)
- **Custom Domain**: Will be `app.factoryos.zipybills.com`
- **Features**: Dashboard, OEE, Machines, Reports, etc.

---

## 📋 Step-by-Step Deployment

### Step 1: Deploy Marketing Site to Vercel

1. **Push code to GitHub** (if not already):
   ```bash
   git add .
   git commit -m "feat: add environment configs for production deployment"
   git push origin develop
   ```

2. **Go to Vercel** (https://vercel.com):
   - Click "Add New Project"
   - Import your GitHub repo: `hnagarkoti/zipybills-monorepo`
   - **Framework Preset**: Next.js
   - **Root Directory**: `apps/marketing-site`
   - Click "Deploy"

3. **Add Environment Variables** in Vercel Dashboard:
   ```
   NEXT_PUBLIC_API_URL=https://api.factoryos.zipybills.com
   NEXT_PUBLIC_APP_URL=https://app.factoryos.zipybills.com
   ```

4. **Add Custom Domain**:
   - Go to Project Settings → Domains
   - Add: `factoryos.zipybills.com`
   - Vercel will show DNS records to add

---

### Step 2: Deploy FactoryOS App to Vercel

1. **Create New Project** in Vercel:
   - Import same repo: `hnagarkoti/zipybills-monorepo`
   - **Framework Preset**: Other
   - **Root Directory**: `apps/factoryOS`
   - **Build Command**: `npx expo export -p web`
   - **Output Directory**: `dist`
   - **Install Command**: `pnpm install --no-frozen-lockfile`
   - Click "Deploy"

2. **Add Environment Variables**:
   ```
   EXPO_PUBLIC_API_URL=https://api.factoryos.zipybills.com
   ```

3. **Add Custom Domain**:
   - Go to Project Settings → Domains
   - Add: `app.factoryos.zipybills.com`

---

### Step 3: Update Render.com Backend URL

1. Go to Render dashboard → Your service
2. Go to Settings → Custom Domain
3. Add: `api.factoryos.zipybills.com`
4. Render will show CNAME record to add

---

### Step 4: Configure DNS (GoDaddy/Namecheap/Cloudflare)

Go to your DNS provider where you manage `zipybills.com`:

#### For Marketing Site (factoryos.zipybills.com):
```
Type: CNAME
Name: factoryos
Value: cname.vercel-dns.com  (Vercel will provide exact value)
TTL: 3600
```

#### For App (app.factoryos.zipybills.com):
```
Type: CNAME
Name: app.factoryos
Value: cname.vercel-dns.com  (Vercel will provide exact value)
TTL: 3600
```

#### For API (api.factoryos.zipybills.com):
```
Type: CNAME
Name: api.factoryos
Value: [your-service].onrender.com  (Render will provide exact value)
TTL: 3600
```

**Note**: DNS propagation can take 5-60 minutes.

---

## 🔧 Local Development

All local dev URLs remain unchanged:
```bash
# Terminal 1: Backend
pnpm dev:factory-api
# → http://localhost:4000

# Terminal 2: Marketing Site
cd apps/marketing-site && pnpm dev
# → http://localhost:3000

# Terminal 3: FactoryOS App
cd apps/factoryOS && npx expo start --web
# → http://localhost:8081
```

The `.env.local` files ensure local development uses `localhost`, while production uses your custom domains.

---

## ✅ Verification Checklist

After deployment completes:

- [ ] Marketing site loads: https://factoryos.zipybills.com
- [ ] Signup page works: https://factoryos.zipybills.com/signup
- [ ] App loads: https://app.factoryos.zipybills.com
- [ ] Login works with signup credentials
- [ ] API health check: https://api.factoryos.zipybills.com/api/health
- [ ] Dashboard shows data after login

---

## 🆓 Free Tier Limits

### Vercel (Both Frontends)
- ✅ 100 GB bandwidth/month
- ✅ Unlimited deployments
- ✅ Custom domains
- ✅ Automatic HTTPS

### Render.com (Backend)
- ✅ 750 hours/month (enough for 1 service 24/7)
- ⚠️ Cold starts after 15 min idle (30-60s wake time)
- ✅ Custom domain
- ✅ Automatic HTTPS

### Neon (Database)
- ✅ 10 GB storage
- ✅ 100 hours compute/month
- ✅ Unlimited connections (pooled)

---

## 🚀 Upgrade Path (When You Need It)

When traffic grows beyond free tiers:

1. **Vercel Pro** ($20/mo per team):
   - 1 TB bandwidth
   - Priority support

2. **Render Starter** ($7/mo):
   - No cold starts
   - 512 MB RAM

3. **Neon Scale** ($19/mo):
   - 50 GB storage
   - Unlimited compute hours

---

## 📞 Support

- Backend errors: Check Render logs
- Frontend errors: Check Vercel deployment logs
- Database issues: Check Neon dashboard

---

**Created**: Feb 17, 2026  
**Updated**: Feb 17, 2026  
**Status**: Ready for deployment ✅
