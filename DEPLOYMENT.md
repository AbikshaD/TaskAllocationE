# Deployment Guide - College Task Manager

This guide covers deploying the full-stack application to production using Vercel (Frontend) + Render (Backend) + MongoDB Atlas.

---

## Prerequisites

- GitHub account with repo pushed
- Vercel account (vercel.com)
- Render account (render.com)
- MongoDB Atlas account (mongodb.com/cloud/atlas)

---

## Step 1: Set Up MongoDB Atlas

1. Go to [MongoDB Atlas](https://account.mongodb.com/account/login)
2. Create a new cluster (M0 free tier is fine for testing)
3. Set up a Database User:
   - User: Enter a username (save this)
   - Password: Generate a secure password (save this)
4. Click "Add My Current IP Address" or "Allow Access from Anywhere"
5. Copy the connection string:
   - Click "Connect" → "Drivers" → select "Node.js"
   - Copy the connection string: `mongodb+srv://username:password@cluster.mongodb.net/taskmanager`
6. Replace `username`, `password`, and `taskmanager` (database name) in the string

Save this connection string - you'll need it for both backend deployments.

---

## Step 2: Deploy Backend on Render

### 2.1 Create Render Account & Connect GitHub
1. Go to [Render.com](https://render.com)
2. Sign up and connect your GitHub account
3. Grant permissions to your repositories

### 2.2 Create Web Service
1. Click "New +" → "Web Service"
2. Select your GitHub repository
3. Fill in the configuration:
   - **Name**: `taskmanager-backend` (or your choice)
   - **Root Directory**: `backend`
   - **Environment**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Plan**: Free (should suffice)

### 2.3 Add Environment Variables
1. Scroll down to "Environment"
2. Add these variables:
   ```
   MONGODB_URI = mongodb+srv://username:password@cluster.mongodb.net/taskmanager
   JWT_SECRET = use-a-strong-random-secret-key (generate one)
   NODE_ENV = production
   PORT = 5000
   CLIENT_URL = https://your-frontend-vercel-url.com (add after frontend deployment)
   ```
3. Click "Create Web Service"

### 2.4 Wait for Deployment
- Render will build and deploy automatically
- Once live, you'll get a URL like: `https://taskmanager-backend.onrender.com`
- **Save this URL** - needed for frontend configuration

---

## Step 3: Deploy Frontend on Vercel

### 3.1 Create Vercel Account & Connect GitHub
1. Go to [Vercel.com](https://vercel.com)
2. Sign up with GitHub
3. Grant permissions to your repositories

### 3.2 Import Project
1. Click "Add New..." → "Project"
2. Select your repository
3. Configure:
   - **Framework Preset**: Vite
   - **Root Directory**: Change to `frontend`
   - **Build Command**: `npm run build` (should auto-detect)
   - **Output Directory**: `dist` (should auto-detect)

### 3.3 Set Environment Variables
1. Click "Environment Variables"
2. Add:
   ```
   VITE_API_URL = https://taskmanager-backend.onrender.com
   ```
3. Click "Deploy"

### 3.4 Wait for Build
- Vercel will build and deploy automatically
- Once complete, you'll get a URL like: `https://taskmanager.vercel.app`

---

## Step 4: Update Backend CORS Configuration

Now that frontend is deployed, update backend's CORS:

1. Go back to Render dashboard
2. Select your backend service
3. Go to "Environment" settings
4. Update `CLIENT_URL` to your Vercel frontend URL:
   ```
   CLIENT_URL = https://taskmanager.vercel.app
   ```
5. Service will redeploy automatically

---

## Step 5: Configure API in Frontend

Update frontend API configuration:

**File**: `frontend/src/api/axios.js`

Verify it uses the environment variable:
```javascript
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
```

If not, update it. Then redeploy frontend on Vercel.

---

## Step 6: Testing

1. Visit your Vercel frontend URL
2. Try to register/login
3. Check browser Network tab for API calls
4. If issues, check Render logs: Dashboard → Service → Logs

---

## Troubleshooting

### "Cannot reach backend" or CORS errors
- Check that `CLIENT_URL` is set correctly in Render backend environment
- Check that `VITE_API_URL` is set correctly in Vercel frontend environment
- Redeploy on both platforms after changing environment variables

### 502/503 errors from Render
- Free tier might spin down if inactive for 15 mins
- First request after sleep will be slow (30s+)
- Consider upgrading to paid tier for production

### MongoDB connection fails
- Verify connection string format: `mongodb+srv://user:pass@cluster/dbname`
- Check MongoDB Atlas IP whitelist (must include Render's IPs)
- Try "Allow Access from Anywhere" temporarily to test (not recommended for production)

### File uploads don't persist
- Render free tier doesn't persist files between deployments
- For production, use cloud storage (AWS S3, Cloudinary, etc.)
- Update upload middleware in backend to use cloud service

---

## Custom Domain Setup

1. Register a domain (GoDaddy, Namecheap, etc.)
2. **Vercel**:
   - Go to Project Settings → Domains
   - Add your domain and follow Vercel's DNS instructions
3. **Render**:
   - Go to Web Service Settings → Custom Domain
   - Add your backend domain (e.g., api.yourdomain.com)
   - Follow DNS instructions

---

## Production Checklist

- [ ] MongoDB Atlas cluster using strong credentials
- [ ] JWT_SECRET set to random strong value
- [ ] NODE_ENV = production on backend
- [ ] CORS properly configured
- [ ] File uploads configured (or using cloud storage)
- [ ] Error logging set up
- [ ] Backend logs checked for errors
- [ ] Frontend tested end-to-end
- [ ] All environment variables set on both platforms

---

## Local Development Setup

For future development:

1. **Backend**: `cd backend && npm install && npm run dev`
2. **Frontend**: `cd frontend && npm install && npm run dev`
3. Create `.env` file in `backend/` with MongoDB URI and JWT_SECRET
4. Create `.env.local` file in `frontend/src/` with:
   ```
   VITE_API_URL=http://localhost:5000
   ```

---

## Useful Commands

```bash
# Backend
cd backend
npm install          # Install dependencies
npm run dev          # Local development
npm start            # Production

# Frontend  
cd frontend
npm install
npm run dev          # Local development
npm run build        # Build for production
npm run preview      # Preview production build
```

---

## Support & Maintenance

- **Render free tier**: Services spin down after 15 minutes of inactivity
- **Vercel**: Free tier is very generous, no auto-sleep
- **MongoDB Atlas**: Free M0 tier has 512MB storage limit
- Monitor usage and upgrade if needed

---

Last Updated: April 6, 2026
