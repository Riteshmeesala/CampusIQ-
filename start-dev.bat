@echo off
title CampusIQ+ Microservices Launcher
echo ===================================================================
echo             Starting CampusIQ+ Microservices Suite
echo ===================================================================
echo.

cd /d "%~dp0"

if exist .env (
    for /f "usebackq tokens=1,* delims==" %%a in (".env") do (
        if "%%a"=="XAI_API_KEY" set "XAI_API_KEY=%%b"
        if "%%a"=="GROK_API_KEY" set "GROK_API_KEY=%%b"
    )
)

echo [1/8] Starting Eureka Discovery Server (Port 8761)...
start "Eureka Server [8761]" cmd /k "cd /d %~dp0backend\eureka-server && mvn spring-boot:run"
ping 127.0.0.1 -n 9 >nul

echo [2/8] Starting Spring Cloud API Gateway (Port 8080)...
start "API Gateway [8080]" cmd /k "cd /d %~dp0backend\api-gateway && mvn spring-boot:run"
ping 127.0.0.1 -n 6 >nul

echo [3/8] Starting Auth Service (Port 8081)...
start "Auth Service [8081]" cmd /k "cd /d %~dp0backend\auth-service && mvn spring-boot:run"

echo [4/8] Starting Academic Service (Port 8082)...
start "Academic Service [8082]" cmd /k "cd /d %~dp0backend\academic-service && mvn spring-boot:run"

echo [5/8] Starting Assessment ^& Analytics Service (Port 8083)...
start "Assessment Service [8083]" cmd /k "cd /d %~dp0backend\assessment-service && mvn spring-boot:run"

echo [6/8] Starting Finance ^& Payments Service (Port 8084)...
start "Finance Service [8084]" cmd /k "cd /d %~dp0backend\finance-service && mvn spring-boot:run"

echo [7/8] Starting AI ^& Notifications Service (Port 8085)...
start "AI Service [8085]" cmd /k "cd /d %~dp0backend\campus-ai-service && mvn spring-boot:run"

echo [8/8] Starting React Frontend (Port 3000)...
start "React Frontend [3000]" cmd /k "cd /d %~dp0frontend && npm start"

echo.
echo ===================================================================
echo  All 8 Services are launching:
echo  - Frontend App:    http://localhost:3000
echo  - API Gateway:     http://localhost:8080/api
echo  - Eureka Registry: http://localhost:8761
echo  - Auth Service:    http://localhost:8081/api/auth
echo  - Academic:        http://localhost:8082/api/courses
echo  - Assessment:      http://localhost:8083/api/results
echo  - Finance:         http://localhost:8084/api/fees
echo  - Campus AI:       http://localhost:8085/api/chatbot
echo ===================================================================
echo.
