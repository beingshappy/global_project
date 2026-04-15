# 🛡️ Sentinel AI - Unified AI Surveillance System

**Sentinel AI** is a state-of-the-art security and surveillance ecosystem designed to enhance public safety (specifically focusing on **Women's Safety**) through real-time AI computer vision. The system detects risk gestures, monitors crowd density, and identifies demographic patterns to provide proactive security alerts.

---

## 🚀 Key Features

*   **Real-time Risk Detection**: AI-powered gesture and behavioral analysis (YOLOv8 + DeepFace).
*   **Dual-DNA Dashboard**: Fully responsive administrative interface that adapts from high-density data tables (Desktop) to tactical card feeds (Mobile).
*   **Multi-Node Control**: Manage multiple CCTV sources (USB, IP, RTSP) from a centralized hub.
*   **Tactical Reporting**: Generate professional PDF audit reports with incident snapshots.
*   **Dynamic AI Parameters**: Real-time adjustment of detection confidence and AI model parameters via the dashboard.
*   **Live Socket Alerts**: Instant notification system with visual and audible risk cues.

---

## 🏗️ System Architecture

The project is divided into three core micro-containers:

### 1. 🐍 AI Engine (`/ai-module`)
The "Brain" of the system. Written in Python, it handles high-frequency frame processing.
- **YOLOv8 & OpenCv**: For real-time human and gesture detection.
- **DeepFace**: For hierarchical demographic grouping.
- **Risk Protocols**: Custom logic to identify SOS signals (e.g., raised hands, crowd surrounding).

### 2. ⚡ Backend API (`/server`)
The "Command Center" powered by Node.js and Express.
- **MongoDB**: Persistent storage for incident logs and system configuration.
- **Socket.io**: Real-time bridge between the AI Module and the Frontend.
- **JWT Auth**: Secure administrative access.

### 3. 🎨 Frontend CLI (`/client`)
The "Interface" built with React, Vite, and Tailwind CSS.
- **Tactical UI**: Dark-mode glassmorphism aesthetic for high-stakes monitoring.
- **Responsive Core**: Custom-built breakpoints for high portability on mobile.

---

## 🛠️ Quick Start

### 1. Prerequisites
- Node.js (v18+)
- Python 3.9+
- MongoDB (Running locally or via Atlas)

### 2. Installation

#### Backend
```bash
cd server
npm install
# Create .env file with: PORT, MONGODB_URI, JWT_SECRET, USER_EMAIL, USER_PASS
```

#### Frontend
```bash
cd client
npm install
npm run dev
```

#### AI Module
```bash
cd ai-module
pip install -r requirements.txt
python main.py
```

---

## 🛡️ Administrative Security
The system includes a master reset protocol and data purge capabilities located in the **Settings** menu. 

---

## 🧪 Development Team
Designed and Engineered as a high-performance **Fullstack AI Project**.

> [!IMPORTANT]
> This system is designed for ethical surveillance. Ensure proper compliance with local privacy laws and regulations.
