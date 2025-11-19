# 🐳 Docker Containerization Guide for LMS Project

## 📋 Table of Contents
1. [Architecture Overview](#architecture-overview)
2. [Prerequisites](#prerequisites)
3. [Project Structure](#project-structure)
4. [How Docker Works](#how-docker-works)
5. [Container Flow](#container-flow)
6. [Setup Instructions](#setup-instructions)
7. [Common Commands](#common-commands)
8. [Networking](#networking)
9. [Data Persistence](#data-persistence)
10. [Troubleshooting](#troubleshooting)

---

## 🏗️ Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    Docker Host Machine                        │
│                                                               │
│  ┌─────────────┐  ┌──────────────┐                          │
│  │  Frontend   │  │   Backend    │                          │
│  │   (Nginx)   │  │ (Spring Boot)│                          │
│  │   Port 80   │  │  Port 8080   │                          │
│  └──────┬──────┘  └──────┬───────┘                          │
│         │                 │                                   │
│         └─────────────────┘                                   │
│                    lms-network (Bridge)                       │
│                                                               │
│  ┌─────────────┐                                             │
│  │   Volume    │                                             │
│  │ backend_logs│                                             │
│  └─────────────┘                                             │
└─────────────────────────────────────────────────────────────┘
         ↑                    ↑                    
    Host: 5173          Host: 8080          
                             │
                             │ (HTTPS/SSL)
                             ↓
                    ┌────────────────────┐
                    │  MongoDB Atlas     │
                    │  (Cloud Database)  │
                    │  cluster.mongodb.net│
                    └────────────────────┘
```

---

## 📦 Prerequisites

### Required Software
- **Docker Desktop** (Windows/Mac) or **Docker Engine** (Linux)
  - Download: https://www.docker.com/products/docker-desktop
  - Minimum: 4GB RAM allocated to Docker
  - Recommended: 8GB RAM

- **Docker Compose** (included with Docker Desktop)
  - Version: 3.8+

### System Requirements
- **CPU**: 2+ cores
- **RAM**: 8GB+ (4GB minimum)
- **Disk Space**: 10GB+ free
- **OS**: Windows 10/11, macOS 10.15+, or Linux

---

## 📁 Project Structure

```
LMS/
├── docker-compose.yml          # Orchestrates all services
├── .env                         # Environment variables (create from .env.example)
├── .env.example                 # Template for environment variables
│
├── lms-backend/                 # Spring Boot Backend
│   ├── Dockerfile               # Backend container definition
│   ├── .dockerignore            # Files to exclude from Docker build
│   ├── pom.xml                  # Maven dependencies
│   └── src/
│       └── main/
│           └── resources/
│               └── firebase/    # Firebase credentials (must exist)
│
├── lcm-frontend/                # React Frontend
│   ├── Dockerfile               # Frontend container definition
│   ├── .dockerignore            # Files to exclude from Docker build
│   ├── nginx.conf               # Nginx web server configuration
│   └── package.json             # NPM dependencies
│
└── mongo-init/                  # MongoDB initialization scripts (optional)
    └── init.js                  # Database initialization
```

---

## 🔧 How Docker Works

### 1. **Docker Images**
- **Definition**: Read-only templates with instructions for creating containers
- **Layers**: Built in layers (each command in Dockerfile = new layer)
- **Caching**: Unchanged layers are cached for faster builds

### 2. **Docker Containers**
- **Definition**: Running instances of Docker images
- **Isolation**: Each container runs in its own isolated environment
- **Lifecycle**: Can be started, stopped, restarted, and removed

### 3. **Docker Volumes**
- **Purpose**: Persist data beyond container lifecycle
- **Benefits**: Data survives container restarts and removals
- **Types**: Named volumes (managed by Docker) or bind mounts (host directories)

### 4. **Docker Networks**
- **Purpose**: Enable communication between containers
- **Bridge Network**: Default network type for container communication
- **DNS**: Containers can reach each other by service name (e.g., `mongodb`, `backend`)

---

## 🔄 Container Flow

### Build & Startup Process

```
1. USER RUNS: docker-compose up --build
   │
   ├─→ 2. BUILD PHASE
   │    │
   │    ├─→ Backend Build:
   │    │    ├─ Stage 1: Maven build (compile Java → create JAR)
   │    │    └─ Stage 2: Copy JAR to lightweight JRE image
   │    │
   │    └─→ Frontend Build:
   │         ├─ Stage 1: npm install + npm build (create dist/)
   │         └─ Stage 2: Copy dist/ to Nginx web server
   │
   └─→ 3. STARTUP PHASE
        │
        ├─→ Backend starts first
        │    ├─ Connects to: MongoDB Atlas (cloud)
        │    ├─ Exposes: Port 8080
        │    └─ Health check: /actuator/health
        │
        └─→ Frontend starts after Backend is ready
             ├─ Serves: Built React app via Nginx
             ├─ Proxies API calls to: http://backend:8080
             └─ Exposes: Port 80 (mapped to host 5173)
```

### Request Flow (User → Database)

```
User's Browser
    ↓ (http://localhost:5173)
Frontend Container (Nginx)
    ↓ (Serves React SPA)
User Interacts with UI
    ↓ (API call to http://localhost:8080/api/v1/...)
Backend Container (Spring Boot)
    ↓ (Processes request, business logic)
MongoDB Atlas (Cloud Database)
    ↓ (Queries database via HTTPS/SSL)
Response flows back through the same chain
```

---

## 🚀 Setup Instructions

### Step 1: Set Up MongoDB Atlas

1. **Go to MongoDB Atlas**: https://cloud.mongodb.com/
2. **Create a free cluster** (M0 tier is free forever)
3. **Create a database user**:
   - Database Access → Add New Database User
   - Username & Password authentication
   - Save credentials securely
4. **Whitelist IP addresses**:
   - Network Access → Add IP Address
   - Allow access from anywhere: `0.0.0.0/0` (or your specific IP)
5. **Get connection string**:
   - Cluster → Connect → Drivers
   - Copy connection string (looks like `mongodb+srv://...`)
   - Replace `<password>` with your actual password

### Step 2: Prepare Environment

```powershell
# Navigate to project root
cd C:\Users\shubh\LMS

# Create .env file from example
Copy-Item .env.example .env

# Edit .env with your MongoDB Atlas connection string
notepad .env
```

**Update your `.env` file:**
```env
MONGODB_ATLAS_URI=mongodb+srv://yourusername:yourpassword@cluster0.xxxxx.mongodb.net/lms?retryWrites=true&w=majority
MONGODB_DATABASE=lms
```

### Step 3: Verify Firebase Credentials

Ensure Firebase credentials exist:
```
lms-backend/src/main/resources/firebase/firebase-adminsdk.json
```

### Step 4: Build and Start All Services

```powershell
# Build images and start containers
docker-compose up --build

# Or run in detached mode (background)
docker-compose up -d --build
```

**What happens:**
1. Downloads base images (maven, node, nginx)
2. Builds backend JAR file (~2-5 minutes)
3. Builds frontend assets (~1-3 minutes)
4. Creates network and volumes
5. Starts containers and connects to MongoDB Atlas

### Step 5: Verify Services

```powershell
# Check running containers
docker-compose ps

# Expected output:
# NAME              STATE    PORTS
# lms-backend       Up       0.0.0.0:8080->8080/tcp
# lms-frontend      Up       0.0.0.0:5173->80/tcp
```

### Step 6: Access Application

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:8080/api/v1
- **Swagger UI**: http://localhost:8080/swagger-ui/index.html
- **MongoDB Atlas**: Access via MongoDB Compass or Atlas UI

---

## 🎮 Common Commands

### Container Management

```powershell
# Start all services
docker-compose up

# Start in background
docker-compose up -d

# Stop all services
docker-compose down

# Stop and remove volumes (deletes data!)
docker-compose down -v

# Restart a specific service
docker-compose restart backend

# View logs
docker-compose logs -f              # All services
docker-compose logs -f backend      # Specific service

# Execute command in running container
docker-compose exec backend sh      # Shell into backend
docker-compose exec mongodb mongosh # MongoDB shell
```

### Rebuild & Update

```powershell
# Rebuild specific service
docker-compose build backend

# Rebuild all services
docker-compose build

# Force rebuild (no cache)
docker-compose build --no-cache

# Update and restart
docker-compose up -d --build
```

### Debugging

```powershell
# View container resource usage
docker stats

# Inspect container details
docker inspect lms-backend

# View container processes
docker-compose top

# Check container health
docker ps --format "table {{.Names}}\t{{.Status}}"
```

---

## 🌐 Networking

### How Containers Communicate

**Internal Network (lms-network):**
```
Container Name  →  Internal DNS Name  →  Port
lms-backend     →  backend             →  8080
lms-frontend    →  frontend            →  80
```

**External Connection:**
```
Backend → MongoDB Atlas (via HTTPS/SSL on port 27017)
```

**From Frontend to Backend:**
```javascript
// In axios.js
const api = axios.create({
  baseURL: "http://localhost:8080/api/v1"  // From host perspective
});

// Or via Nginx proxy:
// /api/v1/* → http://backend:8080/api/v1/*
```

**From Backend to MongoDB Atlas:**
```properties
# In application.properties (via environment variable)
spring.data.mongodb.uri=mongodb+srv://username:password@cluster.mongodb.net/lms
#                                           ↑ MongoDB Atlas cluster URL
```

### Port Mapping

```yaml
Host Port → Container Port
5173      → 80       (Frontend)
8080      → 8080     (Backend)

External:
Backend   → MongoDB Atlas (HTTPS/SSL on 27017)
```

---

## 💾 Data Persistence

### Volume Types

1. **backend_logs**: Stores application logs
   ```bash
   # View logs
   docker-compose exec backend cat /app/logs/application.log
   ```

### Backup Database (MongoDB Atlas)

**Automated Backups (Free on M10+ clusters):**
- MongoDB Atlas automatically backs up your data
- Configure via Atlas UI: Backup tab

**Manual Backup:**
```powershell
# Install MongoDB Database Tools
# Download from: https://www.mongodb.com/try/download/database-tools

# Export database
mongodump --uri="mongodb+srv://username:password@cluster.mongodb.net/lms" --out=./backup

# Restore database
mongorestore --uri="mongodb+srv://username:password@cluster.mongodb.net/lms" ./backup/lms
```

**Point-in-Time Restore:**
- Available on M10+ clusters in MongoDB Atlas
- Atlas UI → Backup → Point in Time Restore

---

## 🐛 Troubleshooting

### Common Issues

**1. Port Already in Use**
```
Error: Bind for 0.0.0.0:8080 failed: port is already allocated
```
**Solution:**
```powershell
# Find process using port
netstat -ano | findstr :8080

# Kill process
taskkill /PID <PID> /F

# Or change port in docker-compose.yml
ports:
  - "8081:8080"  # Use 8081 on host
```

**2. MongoDB Atlas Connection Failed**
```
com.mongodb.MongoTimeoutException: Timed out after 30000 ms
```
**Solution:**
- Verify connection string in `.env` file
- Check username and password are correct
- Ensure IP whitelist includes `0.0.0.0/0` or your IP
- Test connection using MongoDB Compass
- Check backend logs: `docker-compose logs backend`
- Verify network connectivity: Backend can access internet

**3. Frontend Can't Reach Backend**
```
Network Error / CORS Error
```
**Solution:**
- Ensure backend is running: `docker-compose ps`
- Check CORS configuration in SecurityConfig.java
- Verify API URL in axios.js

**4. Out of Disk Space**
```
no space left on device
```
**Solution:**
```powershell
# Clean up unused images/containers
docker system prune -a

# Remove specific volumes
docker volume rm lms_backend_logs
```

**5. Build Fails - Dependency Issues**
```
Failed to resolve dependencies
```
**Solution:**
```powershell
# Clear Docker build cache
docker builder prune

# Rebuild without cache
docker-compose build --no-cache
```

### Health Check Commands

```powershell
# Check backend health
curl http://localhost:8080/actuator/health

# Check MongoDB Atlas connection (from backend container)
docker-compose exec backend sh -c "curl -I https://cloud.mongodb.com"

# Check frontend
curl http://localhost:5173/health

# Test MongoDB Atlas connection with MongoDB Compass
# Connection String: mongodb+srv://username:password@cluster.mongodb.net/
```

---

## 📊 Monitoring

### View Real-time Logs

```powershell
# All services with colors
docker-compose logs -f --tail=100

# Specific service
docker-compose logs -f backend | Select-String "ERROR"
```

### Resource Monitoring

```powershell
# CPU, Memory, Network usage
docker stats

# Container details
docker-compose ps -a
```

---

## 🔒 Security Best Practices

1. **Never commit .env file** - Contains sensitive credentials
2. **Use secrets management** in production (Docker Secrets, Vault)
3. **Run containers as non-root** - Already configured in Dockerfiles
4. **Keep images updated** - Regularly rebuild with latest base images
5. **Scan images for vulnerabilities**:
   ```powershell
   docker scan lms-backend:latest
   ```

---

## 🚢 Production Deployment

### For Cloud Deployment (AWS, Azure, GCP):

1. **Use environment-specific configs**
2. **Set up container orchestration** (Kubernetes, ECS, Azure Container Apps)
3. **Already using MongoDB Atlas ✅** (Cloud database)
4. **Enable HTTPS** (Let's Encrypt, Cloud Load Balancer)
5. **Configure auto-scaling** based on load
6. **Set up monitoring** (Prometheus, Grafana, CloudWatch)

### Production docker-compose.yml adjustments:

```yaml
services:
  backend:
    environment:
      SPRING_DATA_MONGODB_URI: ${MONGODB_ATLAS_URI}  # Already configured ✅
      SPRING_PROFILES_ACTIVE: production
    restart: always
    deploy:
      replicas: 3
      resources:
        limits:
          cpus: '2'
          memory: 2G
```

### MongoDB Atlas Advantages

✅ **No local database container needed**
✅ **Automatic backups and point-in-time recovery**
✅ **Built-in monitoring and alerts**
✅ **Global distribution and replication**
✅ **Free tier (M0) available forever**
✅ **SSL/TLS encryption by default**
✅ **Scalable without downtime**

---

## 📚 Additional Resources

- **Docker Documentation**: https://docs.docker.com/
- **Docker Compose**: https://docs.docker.com/compose/
- **Spring Boot with Docker**: https://spring.io/guides/gs/spring-boot-docker/
- **Nginx Configuration**: https://nginx.org/en/docs/

---

## ✅ Quick Start Checklist

- [ ] Create MongoDB Atlas cluster (free tier)
- [ ] Create database user and get connection string
- [ ] Whitelist IP address (0.0.0.0/0 for development)
- [ ] Install Docker Desktop
- [ ] Copy `.env.example` to `.env`
- [ ] Update `MONGODB_ATLAS_URI` in `.env`
- [ ] Verify Firebase credentials exist
- [ ] Run `docker-compose up --build`
- [ ] Wait for all health checks to pass (~2-3 minutes)
- [ ] Access http://localhost:5173
- [ ] Test login and API calls
- [ ] Check logs if issues occur

---

**Your LMS is now fully containerized! 🎉**
