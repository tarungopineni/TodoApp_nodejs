<p align="center">
  <h1 align="center">TodoApp</h1>
  <p align="center">
    A full-stack mobile Todo application built with React Native, NestJS, MongoDB and JWT authentication.
  </p>
</p>

<p align="center">
  <a href="https://drive.google.com/file/d/1zoyasjp3U3e0LAWshP42ubQeHxxMeU5b/view?usp=drivesdk">📱 Download APK</a>
  &nbsp; • &nbsp;
  <a href="https://drive.google.com/file/d/1oRMgdPtGzNSU27zqyXwGsikj5Xur_yTP/view?usp=drivesdk">🎥 Watch Demo</a>
  &nbsp; • &nbsp;
  <a href="https://todoapp-nodejs-jkdv.onrender.com">🌐 Live Backend</a>
</p>

---

## 🚀 Try the App

Want to try the application yourself?

**📱 [Download the Android APK](https://drive.google.com/file/d/1zoyasjp3U3e0LAWshP42ubQeHxxMeU5b/view?usp=drivesdk)**

Install the APK on an Android device and create an account to start using the application.

**🎥 [Watch the Demo Video](https://drive.google.com/file/d/1oRMgdPtGzNSU27zqyXwGsikj5Xur_yTP/view?usp=drivesdk)**

The demo video shows the main application flow, including authentication, task creation, editing, completion and deletion.

> The mobile app is connected to the deployed backend, so you can test the actual application rather than a frontend-only demo.

---

## 📌 About

TodoApp is a simple full-stack task management application where users can securely create and manage their personal tasks.

Each task supports:

- Title and description
- Priority
- Start date & time
- Deadline
- Completion status

The project was built to practice **backend development, REST APIs, authentication, database integration and React Native mobile development**.

---

## ✨ Features

### 🔐 Authentication
- User registration and login
- JWT authentication
- Password hashing with bcrypt
- Protected API endpoints
- Persistent login using AsyncStorage

### ✅ Task Management
- Create, view, update and delete tasks
- Mark tasks as completed
- Task priorities
- Start date/time and deadlines
- Search and filtering

### 🛡️ Backend Validation
The backend prevents invalid task schedules:

- Start time cannot be in the past
- Deadline cannot be in the past
- Deadline cannot be before the start time

### 👤 User Isolation
Users can only access and modify their own tasks. Unauthorized access to another user's tasks is rejected by the backend.

---

## 🛠️ Tech Stack

| Technology | Usage |
|---|---|
| React Native | Mobile application |
| TypeScript | Application & backend development |
| NestJS | REST API backend |
| Node.js | Backend runtime |
| MongoDB | Database |
| MongoDB Atlas | Cloud database |
| Mongoose | MongoDB ODM |
| JWT | Authentication |
| Passport.js | Authentication strategy |
| bcryptjs | Password hashing |
| Axios | API communication |
| AsyncStorage | Token persistence |
| Render | Backend deployment |

---

## 🏗️ Architecture

React Native Mobile App
          │
          │ HTTPS / REST API
          ▼
     NestJS Backend
          │
     ┌────┴────┐
     │         │
   JWT      Todo API
     │         │
     └────┬────┘
          ▼
       MongoDB
          │
          ▼
    MongoDB Atlas

🔌 API
Authentication
POST /auth/create
POST /auth/token
User
GET /user/
Todos
GET    /todos/
GET    /todos/todo/:id
POST   /todos/todos
PUT    /todos/todo/:id
DELETE /todos/todo/:id
Health Check
GET /healthy

Live Backend:
https://todoapp-nodejs-jkdv.onrender.com

🧪 Testing

The backend includes end-to-end tests covering:

Authentication
Duplicate user validation
Todo CRUD
User isolation
Invalid credentials
Date/time validation

Current test result:

Test Suites: 1 passed
Tests:       22 passed
📱 Screenshots
<p align="center"> Add screenshots of the application here. </p> <!-- Example: <p align="center"> <img src="screenshots/login.png" width="220"/> <img src="screenshots/home.png" width="220"/> <img src="screenshots/create-todo.png" width="220"/> </p> -->
🔮 Future Improvements
Email reminders for upcoming deadlines
Push notifications
Recurring tasks
Categories and tags
Calendar view
Advanced sorting and filtering
Offline support
👨‍💻 Author

Tarun Gopineni

Computer Science Engineering Student
Backend Development & AI Systems

<p> <a href="https://github.com/tarungopineni">GitHub</a> • <a href="https://linkedin.com/in/gopineni-lakshmi-sai-tarun-20a524396">LinkedIn</a> </p> ```
