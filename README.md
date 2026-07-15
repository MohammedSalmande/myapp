# Smart Task Manager

A full-stack task management application built with **Next.js**, **Spring Boot**, and **MySQL**.

![License](https://img.shields.io/badge/license-MIT-green)
![Java](https://img.shields.io/badge/Java-21-orange)
![Spring Boot](https://img.shields.io/badge/Spring_Boot-3.x-brightgreen)
![Next.js](https://img.shields.io/badge/Next.js-15-black)
![Docker](https://img.shields.io/badge/Docker-ready-blue)
![GitHub Actions](https://img.shields.io/badge/CI-GitHub_Actions-success)

---

## ✨ Features

- User registration
- JWT Authentication
- Google OAuth (Work in Progress)
- Task CRUD
- REST API
- Docker Compose
- GitHub Actions CI
- Responsive UI

---

## 🏗️ Architecture

```text
┌──────────────┐
│   Browser    │
└──────┬───────┘
       │
       ▼
 Next.js Frontend
       │ REST API
       ▼
 Spring Boot Backend
       │
       ▼
     MySQL
```

---

## 🛠 Tech Stack

| Frontend | Backend | Database | DevOps |
|----------|----------|----------|---------|
| Next.js | Spring Boot | MySQL | Docker |
| React | Java 21 | JPA/Hibernate | GitHub Actions |
| TypeScript | JWT | | Docker Compose |

---

## 🚀 Run locally

### Prerequisites

- Java 21
- Node.js
- Maven
- Docker Desktop / Docker Engine

Clone the repository

```bash
git clone https://github.com/MohammedSalmande/myapp.git
cd myapp
```

Start everything

```bash
docker compose up --build
```

Frontend

```
http://localhost:3000
```

Backend

```
http://localhost:8080
```

---

## 📂 Project Structure

```
myapp
│
├── app/                 Next.js Frontend
├── backend/             Spring Boot Backend
├── .github/             GitHub Actions
├── docker-compose.yml
└── README.md
```

---

## 📦 Useful Commands

### Git

```bash
git status
git add .
git commit -m "message"
git push
```

### Docker

```bash
docker compose up --build
docker compose down
docker ps
```

### Backend

```bash
cd backend
mvn spring-boot:run
mvn test
```

### Frontend

```bash
npm install
npm run dev
```

---

## 🔄 CI/CD

Every push triggers GitHub Actions to:

- Build the frontend
- Build the backend
- Run unit tests
- Validate Docker configuration

Deployment automation is currently under development.

---

## 📌 Roadmap

- [x] JWT Authentication
- [x] Docker Support
- [x] GitHub Actions
- [ ] Google OAuth
- [ ] Email Verification
- [ ] Password Reset
- [ ] VPS Deployment
- [ ] Automatic Deployment

---
## Project Status

| Feature | Status |
|----------|--------|
| Frontend | ✅ Stable |
| Backend | ✅ Stable |
| Authentication | ✅ JWT |
| Google OAuth | 🚧 In Progress |
| Docker | ✅ |
| GitHub Actions | ✅ |
| Deployment | 🚧 Planned |

## 👨‍💻 Author

Mohammed Salman

GitHub

https://github.com/MohammedSalmande