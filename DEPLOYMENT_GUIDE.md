# 🚀 AJ Import Deployment Guide

## 📋 Overview
This guide will help you deploy your AJ Import project:
- **Backend**: Free hosting on Railway/Render
- **Frontend**: Hostinger Business Plan
- **Database**: MongoDB Atlas (Free)

---

## 🗄️ Step 1: Setup MongoDB Atlas (Free Database)

### 1.1 Create MongoDB Atlas Account
1. Go to [MongoDB Atlas](https://www.mongodb.com/atlas)
2. Sign up for a free account
3. Create a new project called "AJ Import"

### 1.2 Create Database Cluster
1. Click "Build a Database"
2. Choose "FREE" tier (M0 Sandbox)
3. Select a region close to your users
4. Create cluster (takes 3-5 minutes)

### 1.3 Setup Database Access
1. Go to "Database Access" in left sidebar
2. Click "Add New Database User"
3. Create username/password (save these!)
4. Set privileges to "Read and write to any database"

### 1.4 Setup Network Access
1. Go to "Network Access" in left sidebar
2. Click "Add IP Address"
3. Click "Allow Access from Anywhere" (0.0.0.0/0)
4. Confirm

### 1.5 Get Connection String
1. Go to "Database" in left sidebar
2. Click "Connect" on your cluster
3. Choose "Connect your application"
4. Copy the connection string
5. Replace `<password>` with your database user password
6. Replace `<dbname>` with `aj-import`

**Example Connection String:**
```
mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/aj-import?retryWrites=true&w=majority
```

---

## 🖥️ Step 2: Deploy Backend (Railway - Recommended)

### 2.1 Create Railway Account
1. Go to [Railway](https://railway.app)
2. Sign up with GitHub
3. Connect your GitHub account

### 2.2 Deploy from GitHub
1. Click "New Project"
2. Select "Deploy from GitHub repo"
3. Choose your AJ Import repository
4. Select the `backend` folder
5. Click "Deploy"

### 2.3 Configure Environment Variables
1. Go to your project dashboard
2. Click on your backend service
3. Go to "Variables" tab
4. Add these environment variables:

```
MONGO_URI=mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/aj-import?retryWrites=true&w=majority
JWT_SECRET=your-super-secret-jwt-key-here-make-it-long-and-random
NODE_ENV=production
```

### 2.4 Get Backend URL
1. After deployment, Railway will give you a URL like:
   `https://your-app-name.railway.app`
2. Save this URL - you'll need it for the frontend

---

## 🌐 Step 3: Deploy Frontend (Hostinger)

### 3.1 Prepare Frontend for Production
1. Update API URLs in your frontend code
2. Build the production version

### 3.2 Update API URLs
Replace all `http://localhost:5000` with your Railway backend URL:

**Files to update:**
- All React components that make API calls
- Look for fetch requests to localhost:5000

**Example:**
```javascript
// Change from:
const response = await fetch('http://localhost:5000/api/auth/login', {

// Change to:
const response = await fetch('https://your-app-name.railway.app/api/auth/login', {
```

### 3.3 Build Frontend
```bash
cd frontend
npm run build
```

### 3.4 Upload to Hostinger
1. Login to your Hostinger control panel
2. Go to "File Manager"
3. Navigate to `public_html` folder
4. Upload all files from `frontend/build` folder
5. Extract/upload the files

### 3.5 Configure Domain
1. Point your domain to Hostinger's nameservers
2. Wait for DNS propagation (24-48 hours)

---

## 🔧 Step 4: Alternative Backend Hosting (Render)

If Railway doesn't work, use Render:

### 4.1 Create Render Account
1. Go to [Render](https://render.com)
2. Sign up with GitHub

### 4.2 Deploy Backend
1. Click "New +" → "Web Service"
2. Connect your GitHub repository
3. Select the `backend` folder
4. Configure:
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Environment**: `Node`

### 4.3 Add Environment Variables
Add the same environment variables as Railway:
- `MONGO_URI`
- `JWT_SECRET`
- `NODE_ENV=production`

---

## 🧪 Step 5: Testing Your Deployment

### 5.1 Test Backend
1. Visit your backend URL + `/api/health`
2. Should return: `{"status":"OK","message":"Server is running"}`

### 5.2 Test Frontend
1. Visit your domain
2. Try logging in
3. Test all major features

### 5.3 Test Database Connection
1. Try creating a new user account
2. Check if data appears in MongoDB Atlas

---

## 🚨 Troubleshooting

### Common Issues:

**Backend won't start:**
- Check environment variables are set correctly
- Verify MongoDB connection string
- Check Railway/Render logs

**Frontend can't connect to backend:**
- Verify API URLs are updated
- Check CORS settings
- Ensure backend is running

**Database connection issues:**
- Verify MongoDB Atlas IP whitelist
- Check username/password
- Ensure database name is correct

---

## 📞 Support

If you encounter issues:
1. Check the deployment platform logs
2. Verify all environment variables
3. Test each component separately
4. Contact me for assistance

---

## 🎉 Success!

Once everything is working:
- Your backend will be running on Railway/Render
- Your frontend will be on Hostinger
- Your database will be on MongoDB Atlas
- Everything will be connected and working!

**Total Cost: $0** (using free tiers)
