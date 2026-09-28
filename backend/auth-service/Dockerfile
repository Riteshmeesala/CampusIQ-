# ==========================================
# CampusIQ+ Auth & User Service
# ==========================================
# Multi-stage Dockerfile
# Build context: ./backend (or repo root with context ./backend)

# Stage 1: Build
FROM maven:3.9.6-eclipse-temurin-17-alpine AS builder
WORKDIR /build

# Copy parent POM and common-lib dependency
COPY pom.xml .
COPY common-lib/ common-lib/

# Copy auth-service source
COPY auth-service/ auth-service/

# Build common-lib and auth-service
RUN mvn clean package -pl auth-service -am -DskipTests

# Stage 2: Runtime
FROM eclipse-temurin:17-jre-alpine
WORKDIR /app
RUN apk add --no-cache curl

# Copy packaged JAR
COPY --from=builder /build/auth-service/target/*.jar app.jar

ENV PORT=8081
EXPOSE 8081

# Run with container-aware heap optimization
ENTRYPOINT ["sh", "-c", "java -Xms64m -Xmx256m -XX:+UseG1GC -Dserver.port=${PORT} -jar app.jar"]
