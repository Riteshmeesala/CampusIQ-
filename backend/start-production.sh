#!/bin/sh
set -e

echo "=========================================================="
echo " Starting CampusIQ+ Enterprise Suite on Render"
echo " Assigned Port: ${PORT:-8080}"
echo " Database URL: ${SPRING_DATASOURCE_URL:-${DATABASE_URL:-not_set}}"
echo "=========================================================="

JVM_OPTS="-Xms64m -Xmx128m -XX:+UseG1GC -XX:+ExitOnOutOfMemoryError"

# 1. Start Eureka Service Registry
echo "[1/7] Launching Eureka Server (port 8761)..."
java $JVM_OPTS -jar /app/eureka-server.jar > /tmp/eureka.log 2>&1 &

# Wait for Eureka to bind port 8761
echo "Waiting for Eureka discovery server to initialize..."
sleep 10

# 2. Start Microservices in background with optimized heap
echo "[2/7] Launching Auth Service (port 8081)..."
java $JVM_OPTS -jar /app/auth-service.jar > /tmp/auth.log 2>&1 &

echo "[3/7] Launching Academic Service (port 8082)..."
java $JVM_OPTS -jar /app/academic-service.jar > /tmp/academic.log 2>&1 &

echo "[4/7] Launching Assessment Service (port 8083)..."
java $JVM_OPTS -jar /app/assessment-service.jar > /tmp/assessment.log 2>&1 &

echo "[5/7] Launching Finance Service (port 8084)..."
java $JVM_OPTS -jar /app/finance-service.jar > /tmp/finance.log 2>&1 &

echo "[6/7] Launching Campus AI Service (port 8085)..."
java $JVM_OPTS -jar /app/campus-ai-service.jar > /tmp/ai.log 2>&1 &

# Give microservices a few seconds to register with Eureka
sleep 8

# 3. Start API Gateway in foreground (bound to Render's dynamic $PORT)
echo "[7/7] Launching Spring Cloud API Gateway on Port ${PORT:-8080}..."
exec java -Xms96m -Xmx192m -XX:+UseG1GC -jar /app/api-gateway.jar
