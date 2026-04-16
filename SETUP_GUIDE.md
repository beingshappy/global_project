# 🛡️ Women Safety Analytics: Official Setup Guide
> **Protecting Women from Safety Threats using AI & Computer Vision**

Ise guide ki madad se aap apne system ko kisi bhi Windows laptop par zero se setup kar sakte hain.

---

## 🔗 1. Required Softwares (Direct Links)
Aapko ye standard softwares pehle download aur install karne honge:

1.  **Python 3.11.9**: [Download Python](https://www.python.org/ftp/python/3.11.9/python-3.11.9-amd64.exe)
    -   *Installation Tip*: "Add Python to PATH" checkbox ko zaroori click karein.
2.  **Node.js v20**: [Download Node v20](https://nodejs.org/dist/v20.12.2/node-v20.12.2-x64.msi)
3.  **MongoDB Server**: [Download MongoDB](https://fastdl.mongodb.org/windows/mongodb-windows-x86_64-7.0.9-signed.msi)
4.  **VS Code**: [Download VS Code](https://code.visualstudio.com/sha/download?build=stable&os=win32-x64-user)

---

## 🏗️ 2. Core Architecture
Project **3 main parts** mein divided hai:
1.  **`client/`**: React-based futuristic dashboard.
2.  **`server/`**: Node.js & Socket.io backend server.
3.  **`ai-module/`**: Python-based AI Engine (YOLOv8 + DeepFace).

---

## 🛰️ 3. Backend Setup (server)
1.  `server` folder ke andar terminal kholiye.
2.  Type: `npm install`
3.  `.env` file create karein (agar nahi hai) aur ye code paste karein:
    ```env
    PORT=5000
    MONGODB_URI=mongodb://localhost:27017/womensafety
    JWT_SECRET=super_secret_key_12345
    PYTHON_PATH=C:\Users\<Name>\AppData\Local\Programs\Python\Python311\python.exe
    ```
    > [!IMPORTANT]
    > **PYTHON_PATH**: Apne computer ka sahi python path `where python` command se nikal kar yahan likhein.

---

## 📊 4. Dashboard Setup (client)
1.  `client` folder mein terminal kholiye.
2.  Type: `npm install`
3.  Backend connection check karein (default `localhost:5000`).

---

## 🧠 5. AI Engine Setup (ai-module)
Python AI dependencies install karein:
1.  `ai-module` folder mein terminal kholiye.
2.  Type: `pip install -r requirements.txt`
3.  *Manual libraries (agar requirements miss ho jaye)*: `pip install ultralytics deepface opencv-python requests socketio-client`

---

## 🚀 6. System Kaise Run Karein? (Starting)

Aapko **3 alag terminals** ki zaroorat padegi:

### Step A: Backend
`cd server` -> `npm start`
*(Console par "MongoDB connected" dikhna chahiye)*

### Step B: Frontend
`cd client` -> `npm run dev`
*(Browser mein http://localhost:5173 khulein)*

### Step C: Camera
Dashboard par **"Add New Camera"** karein aur uska **Power (Red Button)** dabayein. AI automatically start ho jayega.

---

## 🔦 7. Featured AI Protocols
- **SOS Detection**: Top 33% screen zone mein hand raise hone par activate hota hai.
- **Night Mode**: Raat 8 PM ke baad Lone Woman hone par alert bhejta hai.
- **Low Light Enhancement**: Andhere mein automatic CLAHE filtering apply karta hai.

---

## ⚠️ Troubleshooting (Common Issues)

> [!WARNING]
> **Video Lag**: Agar video lag kar rahi hai, toh `main.py` mein `FRAME_SKIP_HEAVY` ko badha dein (e.g. 15).

> [!TIP]
> **Database**: Agar logs store nahi ho rahe, toh ensure karein ki `MongoDB Service` Windows Services mein running hai.

---

**System Ready!** Ab aapka Women Safety Analytics kisi bhi machine par par deploy hone ke liye taiyaar hai. 🛡️🦾📊
