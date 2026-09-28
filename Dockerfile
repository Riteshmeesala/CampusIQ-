# Multi-stage Dockerfile for CampusIQ+ Backend on Render
# Stage 1: Build JAR artifacts using Maven
FROM maven:3.9.6-eclipse-temurin-17-alpine AS builder
WORKDIR /workspace

# Copy POMs and common-lib for dependency caching
COPY backend/pom.xml backend/pom.xml
COPY backend/common-lib/pom.xml backend/common-lib/pom.xml
COPY backend/eureka-server/pom.xml backend/eureka-server/pom.xml
COPY backend/api-gateway/pom.xml backend/api-gateway/pom.xml
COPY backend/auth-service/pom.xml backend/auth-service/pom.xml
COPY backend/academic-service/pom.xml backend/academic-service/pom.xml
COPY backend/assessment-service/pom.xml backend/assessment-service/pom.xml
COPY backend/finance-service/pom.xml backend/finance-service/pom.xml
COPY backend/campus-ai-service/pom.xml backend/campus-ai-service/pom.xml

# Copy full source tree and build packages
COPY backend /workspace/backend
RUN cd /workspace/backend && mvn clean package -DskipTests

# Stage 2: Minimal JRE Runtime
FROM eclipse-temurin:17-jre-alpine
WORKDIR /app

# Install bash/curl for health checks
RUN apk add --no-cache curl bash

# Copy built JARs from builder
COPY --from=builder /workspace/backend/eureka-server/target/*.jar /app/eureka-server.jar
COPY --from=builder /workspace/backend/api-gateway/target/*.jar /app/api-gateway.jar
COPY --from=builder /workspace/backend/auth-service/target/*.jar /app/auth-service.jar
COPY --from=builder /workspace/backend/academic-service/target/*.jar /app/academic-service.jar
COPY --from=builder /workspace/backend/assessment-service/target/*.jar /app/assessment-service.jar
COPY --from=builder /workspace/backend/finance-service/target/*.jar /app/finance-service.jar
COPY --from=builder /workspace/backend/campus-ai-service/target/*.jar /app/campus-ai-service.jar

# Copy entrypoint runner
COPY backend/start-production.sh /app/start-production.sh
RUN chmod +x /app/start-production.sh

# Render dynamically allocates $PORT (default 8080)
EXPOSE 8080

ENTRYPOINT ["/bin/sh", "/app/start-production.sh"]
