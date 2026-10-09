# JobNexus — AI-Powered Job Discovery & Career Matching

**JobNexus** is a full-stack job discovery and career matching platform built with the MERN stack. It connects students with job opportunities, enables recruiters to manage job postings and applications, and uses AI to help candidates understand their resumes and job compatibility.

🌐 **Live Demo:** [job-nexus-pink.vercel.app](https://job-nexus-pink.vercel.app)
💻 **GitHub Repository:** [Aaditya0700/JobNexus](https://github.com/Aaditya0700/JobNexus)
⚙️ **Backend API:** [JobNexus API](https://jobnexus-bc7x.onrender.com/api)

---

## ✨ Features

### 🤖 AI-Powered Career Tools

* **AI Resume Analyzer:** Analyze resumes and receive personalized feedback on skills, strengths, weaknesses, and areas for improvement.
* **AI Job Match Analysis:** Evaluate how well a candidate's profile and skills align with a particular job.
* **Skill Gap Analysis:** Identify matching and missing skills to help candidates prepare for job opportunities.
* **Resume Analysis Management:** Access saved analysis results and manage repeated analysis requests subject to rate limits.

### 💼 Job Discovery & Applications

* **Internal Job Listings:** Browse jobs posted by recruiters on JobNexus.
* **External Job Search:** Discover external opportunities through the Adzuna Jobs API.
* **Search & Filters:** Find relevant opportunities using available search and filtering options.
* **Job Details:** View descriptions, requirements, company information, and other available job details.
* **Save Jobs:** Bookmark internal and external jobs for later.
* **Job Applications:** Apply for jobs and track application statuses.
* **Application Tracking:** View application progress from the student dashboard.

### 🛡️ Job Trust & Safety

* **AI-Assisted Job Trust Checks:** Access job trust analysis for supported internal and external listings.
* **External Job Information:** Review externally sourced job information before applying.

*Trust checks provide decision support and should not be treated as a guarantee that a job is legitimate.*

### 👥 Role-Based Dashboards

**Student**

* Manage profile, skills, resume, and profile photo.
* Discover and save jobs.
* Apply for jobs and track application statuses.
* Use AI resume analysis and job-match tools.

**Recruiter**

* Create and manage job postings.
* Review applications from candidates.
* Update application statuses.
* Manage recruiter/company information.

**Admin**

* Access administrative dashboards.
* Manage users and review job listings.
* Access role-restricted administrative functionality.

### ⚡ Additional Features

* JWT-based authentication and protected routes.
* Role-based authorization.
* Resume and profile photo uploads using Cloudinary.
* RESTful APIs built with Express.js.
* Real-time communication using Socket.io where supported.
* Email notifications using Nodemailer when SMTP is configured.
* Responsive user interface with loading, error, and empty states.

---

## 🛠️ Tech Stack

| Layer                   | Technologies                        |
| ----------------------- | ----------------------------------- |
| Frontend                | React.js, Vite, Tailwind CSS        |
| Routing                 | React Router                        |
| HTTP Client             | Axios                               |
| Backend                 | Node.js, Express.js                 |
| Database                | MongoDB, Mongoose                   |
| Authentication          | JSON Web Tokens (JWT)               |
| AI Integration          | Google Gemini API                   |
| External Job Data       | Adzuna API                          |
| File Storage            | Cloudinary, Multer                  |
| Real-Time Communication | Socket.io                           |
| Email                   | Nodemailer                          |
| Deployment              | Vercel (frontend), Render (backend) |

---

## 🏗️ Architecture

```text
React + Vite Frontend
        |
        | REST API / HTTPS
        v
Node.js + Express Backend
        |
        +---- MongoDB
        |
        +---- Google Gemini API
        |
        +---- Adzuna Jobs API
        |
        +---- Cloudinary
        |
        +---- Nodemailer / SMTP
        |
        +---- Socket.io
```

---

## 📸 Screenshots

### Homepage

![JobNexus Homepage](ScreenShot/Home.png)

You can add more screenshots to the `ScreenShot/` directory and link them here, such as the job listings page, student dashboard, recruiter dashboard, AI Resume Analyzer, and job-match results.

---

## 🚀 Live Demo

* **Frontend:** https://job-nexus-pink.vercel.app
* **Backend API:** https://jobnexus-bc7x.onrender.com/api
* **Source Code:** https://github.com/Aaditya0700/JobNexus

The application uses external services for AI analysis, job listings, file uploads, and email notifications. Their availability depends on configuration, quotas, and provider status.

---

## ⚙️ Run Locally

### Prerequisites

* Node.js and npm
* MongoDB local instance or MongoDB Atlas
* Cloudinary account for file uploads
* Google Gemini API key for AI features
* Adzuna API credentials for external job search
* SMTP credentials if email notifications are required

### 1. Clone the repository

```bash
git clone https://github.com/Aaditya0700/JobNexus.git
cd JobNexus
```

### 2. Configure the backend

```bash
cd backend
npm install
```

Create a `backend/.env` file:

```env
PORT=5000
MONGODB_URI=your_mongodb_uri
JWT_SECRET=your_long_random_secret
CLIENT_URL=http://localhost:5173

CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret

GEMINI_API_KEY=your_gemini_api_key
GEMINI_MODEL=your_configured_model
GEMINI_FALLBACK_MODEL=your_configured_fallback_model

ADZUNA_APP_ID=your_adzuna_app_id
ADZUNA_APP_KEY=your_adzuna_app_key
ADZUNA_COUNTRY=in
```

Use the exact environment variable names expected by your current backend configuration. Keep optional settings such as SMTP aligned with the names used in the source code.

**Security:** Never commit `.env` files, API keys, database credentials, or JWT secrets to GitHub.

### 3. Start the backend

```bash
npm run dev
```

The backend normally runs on `http://localhost:5000`.

### 4. Configure and start the frontend

Open a second terminal:

```bash
cd frontend
npm install
```

If needed, create `frontend/.env` with:

```env
VITE_API_URL=/api
```

The local Vite configuration should proxy `/api` requests to the backend at `http://localhost:5000`.

Start the frontend:

```bash
npm run dev
```

Open the local URL printed by Vite, normally `http://localhost:5173`.

---

## 🧪 Testing

Run the available backend tests:

```bash
cd backend
npm test
```

Build the frontend for production:

```bash
cd frontend
npm run build
```

The project includes automated tests for selected functionality. A successful build or test suite does not guarantee that every external integration is available; Gemini, Cloudinary, Adzuna, MongoDB, and SMTP should be verified in the intended environment.

---

## 🔐 Security Considerations

* Passwords are handled through the backend authentication flow.
* Protected endpoints enforce authentication and role-based permissions.
* API secrets belong in server-side environment variables.
* File uploads should comply with the application's configured type and size restrictions.
* External service failures and AI rate limits should be handled gracefully.

---

## 👨‍💻 Author

**Aaditya Dubey**
B.Tech Computer Science and Engineering

* **GitHub:** [@Aaditya0700](https://github.com/Aaditya0700)
* **LinkedIn:** [Aaditya Dubey](https://www.linkedin.com/in/aaditya-dubey-b6b435338/)

---

## 📄 License

Add a `LICENSE` file if you intend to distribute the project under an open-source license.

---

*Built to make job discovery and career preparation more accessible through full-stack development and AI-powered tools.*
