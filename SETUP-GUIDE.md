# 🎓 CampusIQ+ — Complete Setup Guide

> **AI-Powered Smart Campus Management Platform**  
> Spring Boot 3.2 · Java 17+ · React 18 · MySQL 8 · Groq Cloud AI · Light Theme

---

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Step 1 — Database Setup](#step-1--database-setup)
3. [Step 2 — Backend Configuration](#step-2--backend-configuration)
4. [Step 3 — Frontend Configuration](#step-3--frontend-configuration)
5. [Step 4 — Running the Application (1-Click or Manual)](#step-4--running-the-application)
6. [Demo Login Credentials](#demo-login-credentials)
7. [Groq AI & Third-Party Keys](#groq-ai--third-party-keys)
8. [Troubleshooting & FAQs](#troubleshooting--faqs)

---

## Prerequisites

Ensure the following tools are installed before starting:

| Software | Version | Download Link | Verification Command |
|---|---|---|---|
| **Java JDK** | 17 or higher (tested on 17, 21, 25) | [Adoptium JDK](https://adoptium.net) | `java -version` |
| **Apache Maven** | 3.8+ | [Apache Maven](https://maven.apache.org) | `mvn -version` |
| **MySQL Server** | 8.0+ | [MySQL Community Server](https://dev.mysql.com/downloads/mysql/) | `mysql -V` |
| **Node.js** | 18+ (tested on Node 22) | [Node.js](https://nodejs.org) | `node -v` |
| **npm** | 9+ | Bundled with Node.js | `npm -v` |
| **Git** | Any | [git-scm.com](https://git-scm.com) | `git --version` |

---

## Step 1 — Database Setup

### 1.1 Create the MySQL Database

Open your terminal or MySQL Workbench and log in:

```bash
mysql -u root -p
```

Execute the database creation statement:

```sql
CREATE DATABASE campusiq_v6 CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
EXIT;
```

### 1.2 Import Schema & Migrations

From the root project directory (`campusAI/`):

```bash
# 1. Import base schema
mysql -u root -p campusiq_v6 < database/campusiq_schema.sql

# 2. Import CGPA migration
mysql -u root -p campusiq_v6 < "database/student cgpa.sql"
```

> **Note**: Demo data is **automatically seeded** on the first launch of the backend by `DataInitializer.java`. You do not need to manually insert sample records.

---

## Step 2 — Backend Configuration

### 2.1 Edit application.properties

Open [`backend/src/main/resources/application.properties`](file:///d:/NewPro/campusAI/campusAI/backend/src/main/resources/application.properties) and verify your local settings:

```properties
# Database Credentials
spring.datasource.url=jdbc:mysql://${DB_HOST:localhost}:${DB_PORT:3306}/campusiq_v6?useSSL=false&serverTimezone=UTC&allowPublicKeyRetrieval=true
spring.datasource.username=${DB_USERNAME:root}
spring.datasource.password=${DB_PASSWORD:root}

# Groq Cloud AI Configuration
grok.api-key=${GROQ_API_KEY:your_groq_api_key_here}
grok.model=qwen/qwen3.6-27b
grok.base-url=https://api.groq.com/openai

# Razorpay Test Keys
razorpay.key.id=${RAZORPAY_KEY_ID:your_razorpay_key_id}
razorpay.key.secret=${RAZORPAY_KEY_SECRET:your_razorpay_secret}
```

### 2.2 Optional: Gmail SMTP for Two-Factor OTP

If using OTP email authentication:
1. Go to your Google Account → **Security** → Enable **2-Step Verification**.
2. Create an **App Password** for "Mail".
3. Update `spring.mail.username` and `spring.mail.password` in `application.properties`.

---

## Step 3 — Frontend Configuration

### 3.1 Verify Environment Settings

Open [`frontend/.env`](file:///d:/NewPro/campusAI/campusAI/frontend/.env):

```env
BROWSER=none
PORT=3000
FAST_REFRESH=true
```

### 3.2 Install Dependencies (First-time setup only)

From the project root:

```bash
cd frontend
npm install
cd ..
```

---

## Step 4 — Running the Application

### ⚡ Method A: The 1-Click Launchers (Recommended)

From the project root folder:

- **Windows Batch (Command Prompt or Explorer)**:
  ```cmd
  start-dev.bat
  ```
  *(Or double-click `start-dev.bat` in File Explorer)*

- **PowerShell**:
  ```powershell
  .\start-dev.ps1
  ```

This will automatically open two dedicated windows running the Backend (:8080) and Frontend (:3000).

---

### 💻 Method B: Manual Startup in Two Terminals

#### **Terminal 1: Backend**
```powershell
cd d:\NewPro\campusAI\campusAI\backend
mvn spring-boot:run
```
*Backend is ready when you see:* `Started CampusIQApplication in X seconds`

#### **Terminal 2: Frontend**
```powershell
cd d:\NewPro\campusAI\campusAI\frontend
npm start
```
*Frontend is ready when you see:* `Compiled successfully!`

---

### 🛑 How to Stop All Services

To cleanly terminate both servers and free ports `8080` and `3000`:

```powershell
.\stop-dev.bat
```
*(Or double-click `stop-dev.bat`)*

---

## Demo Login Credentials

| Role | Username | Password | Access Area |
|---|---|---|---|
| **Admin** | `admin` | `Admin@123` | Full Administrative & ERP Console |
| **Faculty** | `faculty_raj` | `Admin@123` | Computer Science Department |
| **Student** | `24CS001` | `Student@123` | B.Tech CSE (Aarav Varma) |
| **Student** | `Ritesh@0512` | `Student@123` | B.Tech CSE (Meesala Ritesh) |

---

## Groq AI & Third-Party Keys

- **Groq Cloud AI**: Fast conversational responses with streaming API endpoints.
  - Console: [console.groq.com](https://console.groq.com)
  - Models supported: `qwen/qwen3.6-27b`, `llama-3.3-70b-versatile`, `mixtral-8x7b-32768`.
- **Razorpay Sandbox**: Integrated test gateway with instant order verification and payment status callbacks.
  - Dashboard: [dashboard.razorpay.com](https://dashboard.razorpay.com)

---

## Troubleshooting & FAQs

### Q1: "Port 8080 was already in use"
**Solution**: Run `.\stop-dev.bat` to kill any orphaned Java or Node processes holding the ports, then restart.

### Q2: "CommandNotFoundException: stop-dev.bat" in PowerShell
**Solution**: In PowerShell, files in the current folder must be prefixed with `.\` (e.g. `.\stop-dev.bat`).

### Q3: Database connection refused on port 3306
**Solution**: Ensure your MySQL Server service is running:
- Open Windows Services (`services.msc`) and start `MySQL80`.
- Verify credentials in `backend/src/main/resources/application.properties`.

### Q4: UI font or layout styling updates
**Solution**: The frontend uses **Roboto typography** and **Enterprise Light Theme** configured in `frontend/src/theme/theme.js`. Clear your browser cache or hard reload (`Ctrl + F5`) to refresh styles.
