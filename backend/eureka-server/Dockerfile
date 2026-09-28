# ==========================================
# CampusIQ+ Eureka Service Registry
# ==========================================
# Multi-stage Dockerfile
# Build context: ./backend (or repo root with context ./backend)

# Stage 1: Build
FROM maven:3.9.6-eclipse-temurin-17-alpine AS builder
WORKDIR /build

# Copy parent POM and eureka-server source
COPY pom.xml .
COPY eureka-server/ eureka-server/

# Build eureka-server
RUN mvn clean package -pl eureka-server -am -DskipTests

# Stage 2: Runtime
FROM eclipse-temurin:17-jre-alpine
WORKDIR /app
RUN apk add --no-cache curl

# Copy packaged JAR
COPY --from=builder /build/eureka-server/target/*.jar app.jar

ENV PORT=8761
EXPOSE 8761

# Run with container-aware heap optimization
ENTRYPOINT ["sh", "-c", "java -Xms64m -Xmx256m -XX:+UseG1GC -Dserver.port=${PORT} -jar app.jar"]
