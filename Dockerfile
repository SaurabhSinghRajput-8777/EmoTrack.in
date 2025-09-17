#
# ---------- Build Stage (Optimized for Caching) ----------
#
FROM maven:3.9.6-eclipse-temurin-17 AS build
WORKDIR /app

# 1. Copy only the files needed to download dependencies
COPY .mvn .mvn
COPY mvnw pom.xml ./

# 2. Make the Maven wrapper executable
RUN chmod +x mvnw

# 3. Download dependencies. This layer is cached as long as pom.xml doesn't change.
RUN ./mvnw dependency:go-offline

# 4. Copy the rest of your application source code
COPY src ./src

# 5. Build the application
RUN ./mvnw -B clean package -DskipTests


#
# ---------- Run Stage (Final Image) ----------
#
FROM eclipse-temurin:17-jdk-jammy
WORKDIR /app

# Copy the built JAR from the 'build' stage
COPY --from=build /app/target/*.jar app.jar

EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar"]