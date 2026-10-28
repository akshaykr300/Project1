# Fake UPI Shield 🛡️
### AI-Based Fake UPI Payment Screenshot Detector — Complete Integrated System

Fake UPI Shield is an end-to-end, production-grade cybersecurity and fraud prevention platform designed to detect suspicious, manipulated, or counterfeit UPI payment confirmation screenshots (Google Pay, PhonePe, Paytm, BHIM). It pairs **OpenCV computer vision preprocessing**, **Tesseract OCR text extraction**, **a TensorFlow/Keras Convolutional Neural Network (CNN)**, and **transparent rule-based heuristic verification** backed by a **MySQL 8.0 relational database**.

---

## 1. System Architecture & Sequential Verification Flow

```
+-----------------------------------------------------------------------------------+
|                            1. USER ACQUISITION                                    |
|   - File upload (JPEG / PNG / WebP) OR Live camera (getUserMedia canvas frame)   |
+-----------------------------------------+-----------------------------------------+
                                          |
                                          v
+-----------------------------------------+-----------------------------------------+
|                       2. FASTAPI INGESTION & DECODING                             |
|   - File size / MIME limit validation                                             |
|   - Pillow & OpenCV safe byte decoding & corrupted chunk check                    |
+-----------------------------------------+-----------------------------------------+
                                          |
                                          v
+-----------------------------------------+-----------------------------------------+
|                     3. OPENCV COMPUTER VISION PREPROCESSING                       |
|   - RGB / BGR / Grayscale conversion                                              |
|   - CLAHE (Contrast Limited Adaptive Histogram Equalization)                      |
|   - Laplacian variance blur detection & Otsu adaptive thresholding                |
+-----------------------------------------+-----------------------------------------+
                                          |
                                          v
+-----------------------------------------+-----------------------------------------+
|                        4. TESSERACT OCR EXTRACTION                                |
|   - Full text extraction with whitespace normalization                            |
|   - Regex parsing: 12-digit UTR, UPI handles (@okaxis, @ybl), Amount, Timestamp  |
+-----------------------------------------+-----------------------------------------+
                                          |
                                          v
+-----------------------------------------+-----------------------------------------+
|                  5. CNN INFERENCE & HEURISTIC ENGINE                              |
|   - 3-Block CNN classifier (when trained weights are present)                     |
|   - Missing UTR checks, spoof app signatures (FakePay/PrankPay), resolution audit |
+-----------------------------------------+-----------------------------------------+
                                          |
                                          v
+-----------------------------------------+-----------------------------------------+
|                    6. SYNTHESIS & MYSQL AUDIT STORAGE                             |
|   - Verdict: SUSPICIOUS | NO_OBVIOUS_ISSUES | INCONCLUSIVE | INCOMPLETE           |
|   - Persisted to MySQL table: `fake_upi_detector.analysis_history`               |
|   - Interactive React dashboard & detail report rendered                          |
+-----------------------------------------------------------------------------------+
```

---

## 2. Directory Structure

```
fake-upi-shield/
├── backend/
│   ├── app/
│   │   ├── api/
│   │   │   └── routes/
│   │   │       ├── analyze.py        # POST /analyze image upload & inference
│   │   │       ├── health.py         # GET /health & /health/database
│   │   │       ├── history.py        # GET & DELETE /history pagination
│   │   │       ├── model.py          # GET /model/status
│   │   │       ├── stats.py          # GET /stats dashboard counts
│   │   │       └── training.py       # POST /training/start & job logs
│   │   ├── core/
│   │   │   └── config.py             # Typed Pydantic Settings
│   │   ├── db/
│   │   │   └── database.py           # SQLAlchemy engine & MySQL health check
│   │   ├── ml/
│   │   │   ├── dataset.py            # Dataset split, check & augmentation
│   │   │   ├── evaluate.py           # Precision, Recall, F1 & Confusion matrix
│   │   │   ├── model.py              # TensorFlow / Keras CNN architecture
│   │   │   ├── predict.py            # Model inference with honest fallback
│   │   │   ├── train.py              # CNN training pipeline with callbacks
│   │   │   └── weights/              # Saved model checkpoints & class_mapping.json
│   │   ├── models/                   # SQLAlchemy ORM database models
│   │   ├── schemas/                  # Pydantic request / response schemas
│   │   └── services/
│   │       ├── analyzer.py           # Evidence synthesis & decision logic
│   │       ├── ocr.py                # Tesseract OCR & regex pattern parsers
│   │       └── preprocessing.py      # OpenCV CLAHE, blur, & Otsu thresholding
│   ├── tests/                        # Automated Pytest test suite
│   ├── requirements.txt              # Pinned Python 3.10/3.11 dependencies
│   └── .env.example                  # Backend MySQL & Tesseract configuration template
├── database/
│   └── schema.sql                    # Complete executable MySQL 8.0 schema script
├── data/
│   └── dataset/
│       ├── genuine/                  # Authentic payment screenshots
│       └── suspicious/               # Counterfeit / mock receipt screenshots
├── src/                              # React 19 + TypeScript + Tailwind v4 frontend
│   ├── components/                   # Header, Footer, Viewport controls
│   ├── pages/                        # Dashboard, Analyze, Camera, Results, History, Model, Docs
│   ├── services/                     # Unified API client
│   └── types/                        # TypeScript domain schemas
├── server.ts                         # Express + Vite Full-Stack dev server
├── package.json                      # Frontend & server scripts
└── README.md
```

---

## 3. Windows 10/11 + VS Code Complete Setup Guide

Follow this beginner-friendly step-by-step procedure to run both the FastAPI backend and React frontend locally on Windows.

### Step 1: Install Required Software
1. **Python 3.11**: Download from [python.org](https://www.python.org/downloads/).  
   ⚠️ **CRITICAL**: On the first installer dialog, check the box:  
   `[x] Add python.exe to PATH`
2. **Node.js 22 LTS**: Download 64-bit Windows installer from [nodejs.org](https://nodejs.org/).
3. **MySQL Community Server 8.0 & MySQL Workbench**: Download installer from [dev.mysql.com](https://dev.mysql.com/downloads/installer/).  
   During installation, note down your root password (e.g. `Root@123`).
4. **Tesseract OCR Windows Binary**:  
   Download the installer from [UB-Mannheim GitHub](https://github.com/UB-Mannheim/tesseract/wiki).  
   Install to default path: `C:\Program Files\Tesseract-OCR`.
5. **Visual Studio Code**: Download from [code.visualstudio.com](https://code.visualstudio.com/).

---

### Step 2: Open Project in VS Code
Open VS Code, click **File** -> **Open Folder...**, and select the `fake-upi-shield` directory.

---

### Step 3: Configure MySQL Database
1. Open **MySQL Workbench** and connect to your local MySQL instance (`127.0.0.1:3306`).
2. Go to **File** -> **Open SQL Script...** and select `database/schema.sql`.
3. Click the ⚡ **Execute** icon (or press `Ctrl + Shift + Enter`).
4. Verify that database `fake_upi_detector` and tables (`analysis_history`, `model_versions`, `training_jobs`) are created.

*(Alternative via Command Prompt)*:
```cmd
mysql -u root -p < database\schema.sql
```

---

### Step 4: Configure Backend Environment Variables
Create your local `.env` configuration file from the template:
```powershell
copy backend\.env.example backend\.env
```
Open `backend/.env` in VS Code and set your actual MySQL root password:
```ini
DB_HOST="127.0.0.1"
DB_PORT=3306
DB_NAME="fake_upi_detector"
DB_USER="root"
DB_PASSWORD="YourActualMySQLPasswordHere"

# Confirm Tesseract path on Windows:
TESSERACT_CMD="C:\\Program Files\\Tesseract-OCR\\tesseract.exe"
```

---

### Step 5: Setup Python Virtual Environment (Terminal 1)
In VS Code, press `Ctrl + ~` to open the terminal:
```powershell
# Create virtual environment
python -m venv venv

# Activate on Windows
venv\Scripts\activate

# Upgrade pip and install all backend requirements
python -m pip install --upgrade pip
pip install -r backend/requirements.txt
```

---

### Step 6: Run Automated Backend Tests
Verify all preprocessing, OCR, database connectivity, and ML modules:
```powershell
pytest backend/tests -v
```
All unit tests should pass.

---

### Step 7: Launch the FastAPI Backend Server
In Terminal 1 (with virtual environment activated):
```powershell
uvicorn backend.app.main:app --host 127.0.0.1 --port 8000 --reload
```
You can now visit interactive Swagger API documentation at:  
👉 **http://127.0.0.1:8000/docs**

---

### Step 8: Start the Frontend Application (Terminal 2)
In VS Code, click the **+ (New Terminal)** icon or split terminal:
```powershell
# Install Node.js dependencies
npm install

# Start the application server
npm run dev
```

Open your browser at:  
👉 **http://localhost:3000**

---

## 4. How to Train the CNN Model

1. **Populate Dataset**:
   Place at least 10–50 authentic screenshots in `data/dataset/genuine/` and at least 10–50 mock/counterfeit screenshots in `data/dataset/suspicious/`.
2. **Open Model Registry**:
   In the web interface, click the **CNN Model** tab in the top navigation.
3. **Configure Hyperparameters**:
   Set epochs (e.g. 10), batch size (16), learning rate (0.001).
4. **Click "Start CNN Training Job"**:
   The backend trains the convolutional network in the background, generates loss/accuracy logs, saves the checkpoint to `backend/app/ml/weights/fake_upi_cnn_active.keras`, evaluates on the held-out test split, and updates MySQL.

---

## 5. Troubleshooting Common Windows Errors

- **`tesseract is not installed or it's not in your PATH`**:  
  Installing `pytesseract` via pip is only a wrapper. You must run the installer from UB-Mannheim (`C:\Program Files\Tesseract-OCR\tesseract.exe`) and set `TESSERACT_CMD` in `backend/.env`.
- **`Authentication plugin caching_sha2_password cannot be loaded`**:  
  Execute in MySQL Workbench:  
  `ALTER USER 'root'@'localhost' IDENTIFIED WITH mysql_native_password BY 'your_password';`
- **`Camera permission denied`**:  
  Ensure you access the app via `http://localhost:3000` or HTTPS, and grant camera permissions when prompted by your browser.
- **`Why does the status say MODEL_NOT_TRAINED?`**:  
  Fake UPI Shield never fabricates fake model predictions or synthetic accuracy numbers. Until a real model is trained on your dataset, it truthfully reports `MODEL_NOT_TRAINED` while continuing to use OpenCV and OCR rule-based verification.

---

## 6. Security & Legal Disclaimer

*Screenshots alone cannot legally or operationally prove that an electronic fund transfer occurred. Fraudulent actors frequently use spoof generators to manufacture convincing visual receipts. Always independently verify incoming payments by cross-referencing the 12-digit UTR reference with your official bank statement or UPI merchant settlement console.*
