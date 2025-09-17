# Use official OpenJDK image
FROM openjdk:17-jdk-slim

# Set working directory
WORKDIR /app

# Copy everything
COPY . .

# Build with Maven wrapper
RUN ./mvnw -B clean package -DskipTests

# Run the generated JAR
CMD ["java", "-jar", "target/EmoTrack.in-0.0.1-SNAPSHOT.jar"]
