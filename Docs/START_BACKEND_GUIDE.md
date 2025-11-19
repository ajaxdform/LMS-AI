# Backend Startup Guide

## Issue: Java Version Compatibility

You're getting a compilation error because:
- Your system has **Java 24** installed
- The project requires **Java 21**
- There's a compatibility issue with the Maven compiler plugin

## Solutions

### Option 1: Use Java 21 (Recommended)

1. **Install Java 21**:
   - Download from: https://www.oracle.com/java/technologies/downloads/#java21
   - Or use OpenJDK: https://adoptium.net/temurin/releases/?version=21

2. **Set JAVA_HOME**:
   ```powershell
   # Check current Java
   java -version
   
   # Set JAVA_HOME to Java 21 installation path
   $env:JAVA_HOME = "C:\Program Files\Java\jdk-21"
   ```

3. **Build and Run**:
   ```powershell
   cd lms-backend
   .\mvnw.cmd clean install -DskipTests
   .\mvnw.cmd spring-boot:run
   ```

### Option 2: Update pom.xml for Java 24 (Quick Fix)

If you want to use Java 24, update the `pom.xml`:

1. Change Java version in `pom.xml`:
   ```xml
   <properties>
       <java.version>24</java.version>
       <!-- rest of properties -->
   </properties>
   ```

2. Update Maven compiler plugin version:
   ```xml
   <plugin>
       <groupId>org.apache.maven.plugins</groupId>
       <artifactId>maven-compiler-plugin</artifactId>
       <version>3.13.0</version>  <!-- Update to latest version -->
       <configuration>
           <source>24</source>
           <target>24</target>
           <!-- rest of configuration -->
       </configuration>
   </plugin>
   ```

### Option 3: Use IDE (IntelliJ IDEA / Eclipse)

If you're using an IDE:
1. Import the project as Maven project
2. Let the IDE handle the build
3. Run `LcmApplication.java` directly from the IDE

## Starting the Backend

Once compilation is fixed:

```powershell
cd lms-backend
.\mvnw.cmd spring-boot:run
```

The backend will start on: **http://localhost:8080**

## Starting Both Frontend and Backend

### Terminal 1 - Backend:
```powershell
cd lms-backend
.\mvnw.cmd spring-boot:run
```

### Terminal 2 - Frontend:
```powershell
cd lcm-frontend
npm install
npm run dev
```

## Verify Backend is Running

1. Check if it's running: http://localhost:8080
2. Check API docs: http://localhost:8080/swagger-ui.html (if Swagger is enabled)
3. Test endpoint: http://localhost:8080/public/signup (should return error without body, but confirms server is up)

## Common Issues

### Issue: "SpringApplication cannot be resolved"
**Solution**: Run `mvn clean install` first to download dependencies and compile

### Issue: Port 8080 already in use
**Solution**: 
- Change port in `application.properties`: `server.port=8081`
- Or stop the process using port 8080

### Issue: MongoDB connection error
**Solution**: 
- Check MongoDB connection string in `application.properties`
- Ensure MongoDB Atlas cluster is accessible
- Check network/firewall settings

## Quick Test

Once backend is running, test with:
```bash
curl http://localhost:8080/public/signup
```

Or use Postman to test the API endpoints.

