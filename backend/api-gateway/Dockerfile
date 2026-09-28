# ==========================================
# CampusIQ+ API Gateway Microservice
# Multi-stage Dockerfile for Render Deployment
# Build Context: Repository Root (.)
# ==========================================

# ── Stage 1: Maven Build Stage ──
FROM maven:3.9.6-eclipse-temurin-17-alpine AS builder
WORKDIR /workspace

# Copy parent POM for dependency & plugin management
COPY backend/pom.xml backend/pom.xml

# Copy common-lib (required by multi-module structure)
COPY backend/common-lib/pom.xml backend/common-lib/pom.xml
COPY backend/common-lib/src backend/common-lib/src

# Copy api-gateway POM and source tree
COPY backend/api-gateway/pom.xml backend/api-gateway/pom.xml
COPY backend/api-gateway/src backend/api-gateway/src

# Package API Gateway JAR (Spring Boot executable repackage)
RUN mvn clean package -f backend/api-gateway/pom.xml -DskipTests

# ── Stage 2: Lightweight JRE Runtime Stage ──
FROM eclipse-temurin:17-jre-alpine
WORKDIR /app

# Install curl for health check probes
RUN apk add --no-cache curl

# Create non-root system user for production security
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

# Copy compiled executable JAR using wildcard to support versioning
COPY --from=builder /workspace/backend/api-gateway/target/api-gateway-*.jar app.jar

# Set file ownership
RUN chown appuser:appgroup /app/app.jar

USER appuser

# Render dynamically passes the PORT environment variable (default: 8080)
ENV PORT=8080
EXPOSE 8080

# Container-aware JVM options optimized for Spring Cloud Gateway (Netty reactive engine)
ENTRYPOINT ["sh", "-c", "java -Xms128m -Xmx384m -XX:+UseG1GC -XX:+ExitOnOutOfMemoryError -Dserver.port=${PORT} -jar app.jar"]
