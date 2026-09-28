# ==========================================
# CampusIQ+ API Gateway
# ==========================================
# Multi-stage Dockerfile
# Build context: ./backend (or repo root with context ./backend)

# Stage 1: Build
FROM maven:3.9.6-eclipse-temurin-17-alpine AS builder
WORKDIR /build

# Copy parent POM and api-gateway source
COPY pom.xml .
COPY api-gateway/ api-gateway/

# Build api-gateway
RUN mvn clean package -pl api-gateway -am -DskipTests

# Stage 2: Runtime
FROM eclipse-temurin:17-jre-alpine
WORKDIR /app
RUN apk add --no-cache curl

# Copy packaged JAR
COPY --from=builder /build/api-gateway/target/*.jar app.jar

ENV PORT=8080
EXPOSE 8080

# Run with container-aware heap optimization
ENTRYPOINT ["sh", "-c", "java -Xms96m -Xmx256m -XX:+UseG1GC -Dserver.port=${PORT} -jar app.jar"]
