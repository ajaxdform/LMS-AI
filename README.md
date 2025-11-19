# LMS - Learning Management System 🎓

A full-stack Learning Management System built with Spring Boot, React, and MongoDB Atlas, featuring Docker containerization and comprehensive security features.

## 🚀 Features

- **Public Course Browsing** - Unauthenticated users can browse courses
- **User Authentication** - Firebase Auth with Google Sign-In
- **Course Management** - Create, edit, and organize courses with chapters and topics
- **Quiz System** - Create quizzes with multiple-choice questions
- **Progress Tracking** - Track user progress through courses
- **Certificate Generation** - Award certificates upon course completion
- **Admin Panel** - Comprehensive admin dashboard for management
- **Security** - CSRF protection, input validation, rate limiting
- **Caching** - Caffeine cache for improved performance
- **Docker Support** - Containerized deployment with Docker Compose
- **MongoDB Atlas** - Cloud database integration

## 🛠️ Tech Stack

### Backend
- **Java 21** with Spring Boot 3.5.6
- **Spring Security** with CSRF protection
- **MongoDB** (MongoDB Atlas cloud database)
- **Firebase Admin SDK** for authentication
- **OWASP** libraries for security
- **Caffeine Cache** for performance
- **Swagger/OpenAPI** for API documentation

### Frontend
- **React 19** with Vite 5
- **Tailwind CSS 4** for styling
- **Firebase Auth** with Google Sign-In
- **React Router** for navigation
- **Axios** for API calls
- **React Quill** for rich text editing

### DevOps
- **Docker** with multi-stage builds
- **Docker Compose** for orchestration
- **Nginx** for serving frontend
- **Maven** for backend build

## 📋 Prerequisites

- **Docker Desktop** (Windows/Mac) or Docker Engine (Linux)
- **MongoDB Atlas** account (free tier available)
- **Firebase Project** with Admin SDK credentials
- **Java 21** (if running without Docker)
- **Node.js 20+** (if running without Docker)

## 🔧 Setup Instructions

### 1. Clone Repository

```bash
git clone https://github.com/ajaxdform/LMS-AI.git
cd LMS-AI
```

### 2. MongoDB Atlas Setup

1. Create a free cluster at [MongoDB Atlas](https://cloud.mongodb.com/)
2. Create a database user
3. Whitelist IP addresses (0.0.0.0/0 for development)
4. Get your connection string

### 3. Firebase Setup

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create/select your project
3. Generate Admin SDK private key
4. Save JSON file to `lms-backend/src/main/resources/firebase/`

### 4. Environment Configuration

```bash
# Copy environment template
cp .env.example .env

# Edit .env with your credentials
# Update MONGODB_ATLAS_URI with your connection string
```

### 5. Run with Docker

```bash
# Build and start all services
docker-compose up --build

# Or run in background
docker-compose up -d --build
```

### 6. Access Application

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:8080/api/v1
- **Swagger UI**: http://localhost:8080/swagger-ui/index.html

## 📚 Documentation

Comprehensive documentation is available in the `Docs/` directory:

- **[DOCKER_GUIDE.md](Docs/DOCKER_GUIDE.md)** - Complete Docker setup and workflow
- **[SETUP_GUIDE.md](Docs/SETUP_GUIDE.md)** - Development environment setup
- **[API_REFERENCE.md](Docs/API_REFERENCE.md)** - API endpoints documentation
- **[ADMIN_PANEL_GUIDE.md](Docs/ADMIN_PANEL_GUIDE.md)** - Admin panel usage
- **[DEVELOPMENT_GUIDE.md](Docs/DEVELOPMENT_GUIDE.md)** - Development guidelines

## 🐳 Docker Services

| Service | Port | Description |
|---------|------|-------------|
| Frontend | 5173 | React app served by Nginx |
| Backend | 8080 | Spring Boot REST API |
| MongoDB | Atlas | Cloud database (external) |

## 🔐 Security Features

- ✅ CSRF protection with cookie-based tokens
- ✅ Input sanitization and validation
- ✅ Rate limiting on API endpoints
- ✅ Firebase authentication
- ✅ CORS configuration
- ✅ Security headers (CSP, HSTS, X-Frame-Options)
- ✅ Non-root users in Docker containers
- ✅ Secrets excluded from Git

## 📦 Project Structure

```
LMS/
├── lms-backend/          # Spring Boot API
│   ├── src/
│   ├── Dockerfile
│   └── pom.xml
├── lcm-frontend/         # React Frontend
│   ├── src/
│   ├── Dockerfile
│   ├── nginx.conf
│   └── package.json
├── Docs/                 # Documentation
├── docker-compose.yml    # Docker orchestration
└── .env.example          # Environment template
```

## 🚦 Development

### Running Backend (without Docker)

```bash
cd lms-backend
./mvnw spring-boot:run
```

### Running Frontend (without Docker)

```bash
cd lcm-frontend
npm install
npm run dev
```

## 🧪 Testing

```bash
# Backend tests
cd lms-backend
./mvnw test

# Frontend tests
cd lcm-frontend
npm test
```

## 📝 API Documentation

Access Swagger UI at http://localhost:8080/swagger-ui/index.html for interactive API documentation.

Key endpoints:
- `GET /api/v1/public/courses` - List all courses
- `POST /api/v1/courses` - Create course (admin)
- `GET /api/v1/courses/{id}` - Get course details
- `POST /api/v1/enroll/{courseId}` - Enroll in course
- `GET /api/v1/dashboard` - User dashboard

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Open Pull Request

## 📄 License

This project is licensed under the MIT License.

## 👥 Authors

- **Shubh** - Initial work

## 🙏 Acknowledgments

- Spring Boot team for excellent framework
- React team for amazing frontend library
- MongoDB Atlas for reliable cloud database
- Firebase for authentication services
- Docker for containerization platform

## 🐛 Known Issues

- None currently reported

## 🔄 Recent Updates

- ✅ Added Docker containerization
- ✅ Integrated MongoDB Atlas
- ✅ Implemented Google Sign-In
- ✅ Enhanced security features
- ✅ Added public course browsing
- ✅ Improved UI/UX

## 📞 Support

For issues and questions:
- Create an issue on GitHub
- Check documentation in `Docs/` folder
- Review Docker guide for deployment help

---

**Happy Learning! 🎓**
