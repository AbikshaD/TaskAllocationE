# 🚀 Quick Deployment Checklist

Follow these steps to deploy your College Task Manager app in **15 minutes**.

---

## Phase 1: MongoDB Setup (3 minutes)

- [ ] Create account at [mongodb.com/cloud/atlas](https://mongodb.com/cloud/atlas)
- [ ] Create M0 free cluster
- [ ] Create database user (save username & password)
- [ ] Allow access from anywhere (IP: 0.0.0.0/0)
- [ ] Get connection string: `mongodb+srv://user:pass@cluster.mongodb.net/taskmanager`
- [ ] Save this string - you'll need it for backend

---

## Phase 2: Deploy Backend on Render (5 minutes)

- [ ] Create account at [render.com](https://render.com)
- [ ] Connect GitHub account
- [ ] Click "New Web Service"
- [ ] Select your repository
- [ ] Set **Root Directory** to `backend`
- [ ] Environment:
  - [ ] `MONGODB_URI` = your MongoDB connection string
  - [ ] `JWT_SECRET` = any random secret (e.g., `change-me-later-$(date)`)
  - [ ] `NODE_ENV` = `production`
- [ ] Click "Create Web Service"
- [ ] Wait for green "Live" status (~2-3 minutes)
- [ ] Copy the URL (e.g., `https://taskmanager-backend.onrender.com`)

---

## Phase 3: Deploy Frontend on Vercel (5 minutes)

- [ ] Create account at [vercel.com](https://vercel.com)
- [ ] Import project and select your repository
- [ ] Set **Root Directory** to `frontend`
- [ ] Add Environment Variable:
  - [ ] `VITE_API_URL` = Render backend URL (from Phase 2)
- [ ] Click "Deploy"
- [ ] Wait for blue "Ready" status (~1-2 minutes)
- [ ] Get your frontend URL (e.g., `https://taskmanager.vercel.app`)

---

## Phase 4: Update Backend CORS (2 minutes)

- [ ] Go to Render dashboard → Your backend service
- [ ] Go to "Environment"
- [ ] Add: `CLIENT_URL` = your Vercel frontend URL (from Phase 3)
- [ ] Service auto-redeploys

---

## ✅ You're Live!

Visit your frontend URL and test:
- [ ] Sign up / Login works
- [ ] Dashboard loads
- [ ] Can allocate tasks
- [ ] Can delete/edit items

---

## 🐛 If Something Breaks

| Problem | Solution |
|---------|----------|
| "Cannot reach backend" | Check VITE_API_URL in Vercel & CLIENT_URL in Render |
| "CORS error" | Redeploy both services after updating env vars |
| "MongoDB connection failed" | Check connection string & IP whitelist in Atlas |
| "Render service goes down" | Free tier sleeps after 15min - wake it by visiting URL |

---

## 📝 Environment Variables Summary

**Render Backend**:
```
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/taskmanager
JWT_SECRET=your-secret-key
NODE_ENV=production
CLIENT_URL=https://your-vercel-url.com
```

**Vercel Frontend**:
```
VITE_API_URL=https://your-render-url.com
```

---

## 💡 Tips

- Free tier works great for testing/learning
- Render backend spins down after 15min idle (first request is slow)
- MongoDB Atlas M0 has 512MB storage limit
- For production: upgrade to paid tiers
- To add custom domain: see DEPLOYMENT.md

---

Need help? Open DEPLOYMENT.md for detailed troubleshooting.
