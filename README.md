# JobNexus — AI-Powered Job Discovery & Career Matching

JobNexus is an AI-powered job discovery and career matching platform built with the MERN stack, where students can find and apply for jobs, and recruiters can post and manage job listings.

## 🚀 Features

- JWT Authentication with Student and Recruiter roles
- Create, Edit, Delete Job Postings
- Apply for Jobs with Cover Letter
- Upload Resume and Profile Photo (Cloudinary)
- Save Jobs for later
- Search and Filter Jobs
- Recruiter Dashboard to manage applications
- Admin Panel to manage users and jobs
- Email Notifications on application status
- Real-time updates with Socket.io

## 🛠️ Tech Stack

**Frontend:**
- React.js
- Tailwind CSS
- React Router
- Axios

**Backend:**
- Node.js
- Express.js
- MongoDB
- JWT Authentication
- Cloudinary
- Socket.io
- Nodemailer

## 📸 Screenshots
![Homepage](ScreenShot/Home.png)

## ⚙️ Installation

### Backend
```bash
cd backend
npm install
npm run dev
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```

### Environment Variables
Create `.env` file in backend folder:
```env
PORT=5000
MONGODB_URI=your_mongodb_uri
JWT_SECRET=your_jwt_secret
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
CLIENT_URL=http://localhost:5173
```

## 👨‍💻 Author
Aaditya Dubey
- GitHub: [@Aaditya0700](https://github.com/Aaditya0700)
- LinkedIn: [Aaditya Dubey](https://www.linkedin.com/in/aaditya-dubey-b6b435338/)