# ==========================================
# CampusIQ+ API Gateway Microservice
# Multi-stage Dockerfile for Render Deployment
# Build Context: Repository Root (.)
# ==========================================

# ── Stage 1: Build Stage ──
FROM maven:3.9.6-eclipse-temurin-17-alpine AS builder
WORKDIR /workspace

# Copy parent POM
COPY backend/pom.xml backend/pom.xml

# Copy all submodule POMs so the Maven reactor can resolve all declared modules
COPY backend/common-lib/pom.xml backend/common-lib/pom.xml
COPY backend/eureka-server/pom.xml backend/eureka-server/pom.xml
COPY backend/api-gateway/pom.xml backend/api-gateway/pom.xml
COPY backend/auth-service/pom.xml backend/auth-service/pom.xml
COPY backend/academic-service/pom.xml backend/academic-service/pom.xml
COPY backend/assessment-service/pom.xml backend/assessment-service/pom.xml
COPY backend/finance-service/pom.xml backend/finance-service/pom.xml
COPY backend/campus-ai-service/pom.xml backend/campus-ai-service/pom.xml

# Copy source code ONLY for common-lib and api-gateway
COPY backend/common-lib/src backend/common-lib/src
COPY backend/api-gateway/src backend/api-gateway/src

# Package API Gateway and required dependencies (skips all other services)
RUN mvn -f backend/pom.xml -pl api-gateway -am clean package -DskipTests

# ── Stage 2: Minimal Runtime Stage ──
FROM eclipse-temurin:17-jre-alpine
WORKDIR /app

# Install curl for Render health check probing
RUN apk add --no-cache curl

# Create non-root system user for production security
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

# Copy compiled executable Spring Boot JAR
COPY --from=builder /workspace/backend/api-gateway/target/api-gateway-*.jar app.jar

# Set file ownership to non-root user
RUN chown appuser:appgroup /app/app.jar

USER appuser

# Render dynamically passes the PORT environment variable (default: 8080)
ENV PORT=8080
EXPOSE 8080

# Production-safe JVM settings tailored for a 512MB RAM container:
# - Max heap 65% (~330MB), leaving headroom for Netty direct memory & Metaspace
# - Container-aware memory ergonomics & G1 Garbage Collector
ENTRYPOINT ["sh", "-c", "java -XX:InitialRAMPercentage=25.0 -XX:MaxRAMPercentage=65.0 -XX:+UseG1GC -XX:+ExitOnOutOfMemoryError -Dserver.port=${PORT} -jar app.jar"]
