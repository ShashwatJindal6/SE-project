# InternWin

## InternWin — Internship & Job Application Tracker

A modern full-stack web application that helps students manage and track internship and job applications efficiently in one centralized platform.

## About The Project

Internship Tracker simplifies the internship application process for students by providing a centralized dashboard to manage applications, monitor statuses, store recruiter details, and organize important information.

The project is built using the MERN stack with Firebase Authentication and is designed for deployment on Vercel.

## Features

- Authentication — Google Sign-In via Firebase Auth
- Dashboard — Overview of all applications with stats and insights
- Applications List — Full CRUD for internship/job applications
- Kanban Board — Drag-and-drop style board view by status
- Add New — Rich form to add applications with recruiter info, salary, links, and more
- Notes — Per-application notes with a dedicated notes manager
- Offer Comparison — Compare multiple job offers side by side
- Profile — User profile management
- Dark Mode — Cosmic glassmorphic dark theme throughout
- Persistent Storage — All data saved to MongoDB Atlas, synced per user

## Tech Stack

### Frontend

- React.js
- Vite
- Firebase Authentication
- CSS

### Backend

- Node.js
- Express.js
- MongoDB Atlas
- Mongoose

### Deployment

- Vercel
- Render

## Project Structure

```
Internship-Tracker/
├── backend/
│   ├── models/
│   │   ├── Application.js
│   │   ├── Note.js
│   │   └── User.js
│   ├── routes/
│   │   ├── applicationRoutes.js
│   │   ├── noteRoutes.js
│   │   └── userRoutes.js
│   ├── server.js
│   ├── package.json
│   └── .env
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── assets/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── services/
│   │   ├── utils/
│   │   ├── App.jsx
│   │   ├── config.js
│   │   ├── firebase.js
│   │   └── main.jsx
│   ├── package.json
│   ├── vite.config.js
│   └── eslint.config.js
└── README
```

## Installation & Setup

###  Clone the Repository

```bash
git clone https://github.com/your-username/Internship-Tracker.git
cd Internship-Tracker
```

###  Backend Setup

```bash
cd backend
npm install
```

Create a `.env` file inside the `backend` folder:

```env
MONGO_URL=your_mongodb_connection_string
PORT=5000
```
```npx nodemon server.js

Run the backend server:

```bash
npm start
```

or

```bash
nodemon server.js
```

### Frontend Setup

Open a new terminal and run:

```bash
cd frontend
npm install
```

Create a `.env` file inside the `frontend` folder:

```env
VITE_FIREBASE_API_KEY=your_key
VITE_FIREBASE_AUTH_DOMAIN=your_domain
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_bucket
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

Run the frontend:

```bash
npm run dev
```

The frontend runs on:

```text
http://localhost:5173
```

## API Functionality

The backend APIs handle:

- Creating applications
- Updating application status
- Fetching user applications
- Deleting applications
- Managing user data

## Authentication

Firebase Authentication is used for:

- User Login & Signup
- Secure Authentication
- Session Management
- Google Authentication

## Team Members

- Shashwat Jindal
- Utkarsh Patel

## Future Improvements

- Interview scheduling
- Email notifications
- AI-powered internship recommendations

