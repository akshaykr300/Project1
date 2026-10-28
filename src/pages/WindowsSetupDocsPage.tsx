/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import React, { useState } from 'react';
import {
  Terminal,
  Copy,
  Check,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  BookOpen,
  FolderOpen
} from 'lucide-react';

export const WindowsSetupDocsPage: React.FC = () => {
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const copyToClipboard = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const steps = [
    {
      title: '1. Prerequisites & Required Software on Windows',
      desc: 'Download and install the following standard developer tools for Windows:',
      items: [
        'Python 3.11 (Ensure "Add Python to PATH" is checked during installation)',
        'Node.js 22 LTS (Download 64-bit Windows MSI from nodejs.org)',
        'MySQL Community Server 8.0 & MySQL Workbench (from dev.mysql.com/downloads/installer)',
        'Tesseract OCR for Windows (Download UB-Mannheim 64-bit installer from github.com/UB-Mannheim/tesseract/wiki)',
        'Visual Studio Code with Python and ESLint extensions',
      ],
      cmd: null,
    },
    {
      title: '2. Clone or Extract Project & Open in VS Code',
      desc: 'Open VS Code and choose File -> Open Folder, selecting this project directory.',
      cmd: 'cd fake-upi-shield\ncode .',
    },
    {
      title: '3. Create Python Virtual Environment (Terminal 1)',
      desc: 'In VS Code, press Ctrl + ` to open the integrated terminal and initialize an isolated Python environment:',
      cmd: 'python -m venv venv\nvenv\\Scripts\\activate',
    },
    {
      title: '4. Install Backend Python Dependencies',
      desc: 'With your virtual environment activated, install all verified packages:',
      cmd: 'python -m pip install --upgrade pip\npip install -r backend/requirements.txt',
    },
    {
      title: '5. Configure MySQL Database with schema.sql',
      desc: 'Open MySQL Workbench, connect to your Local Instance (Port 3306), open File -> Open SQL Script, select database/schema.sql, and execute (lighting icon). Or run via PowerShell:',
      cmd: 'mysql -u root -p < database/schema.sql',
    },
    {
      title: '6. Set Up Environment Variables (.env)',
      desc: 'Copy backend/.env.example to backend/.env and update your local MySQL root password:',
      cmd: 'copy backend\\.env.example backend\\.env\n# Then edit DB_PASSWORD="your_actual_mysql_password" in backend/.env',
    },
    {
      title: '7. Run Automated Pytest Test Suite',
      desc: 'Execute unit and integration tests to verify preprocessing, OCR regex parsers, and CNN fallbacks:',
      cmd: 'pytest backend/tests -v',
    },
    {
      title: '8. Start the FastAPI Backend Server',
      desc: 'Launch the backend API on http://127.0.0.1:8000 with hot-reload enabled:',
      cmd: 'uvicorn backend.app.main:app --host 127.0.0.1 --port 8000 --reload',
    },
    {
      title: '9. Install Node Dependencies & Start Frontend (Terminal 2)',
      desc: 'Open a second terminal in VS Code (click the + split terminal button) to run the Vite dev server:',
      cmd: 'npm install\nnpm run dev',
    },
    {
      title: '10. Open in Browser',
      desc: 'Navigate to http://localhost:3000 to interact with Fake UPI Shield in your browser.',
      cmd: 'http://localhost:3000',
    },
  ];

  const faqs = [
    {
      q: 'Error: "tesseract is not installed or it\'s not in your PATH"',
      a: 'Installing pytesseract via pip only installs the Python wrapper. You must run the Windows installer from UB-Mannheim (default path: C:\\Program Files\\Tesseract-OCR\\tesseract.exe) and ensure TESSERACT_CMD in backend/.env points to this exact executable.',
    },
    {
      q: 'Error: "Authentication plugin \'caching_sha2_password\' cannot be loaded"',
      a: 'Use pymysql and cryptography (included in backend/requirements.txt) or alter your MySQL user to mysql_native_password: ALTER USER \'root\'@\'localhost\' IDENTIFIED WITH mysql_native_password BY \'your_password\';',
    },
    {
      q: 'Camera permission denied or camera not loading',
      a: 'Browsers require a secure context (HTTPS) or localhost for navigator.mediaDevices.getUserMedia. Ensure you access the app via http://localhost:3000 or http://127.0.0.1:3000 and click "Allow" when prompted.',
    },
    {
      q: 'Why does CNN status say "MODEL_NOT_TRAINED"?',
      a: 'Fake UPI Shield adheres to strict transparency: without an actual trained .keras model weights file trained on your dataset, it truthfully reports MODEL_NOT_TRAINED and uses OpenCV + rule-based OCR heuristics instead of fabricating fake confidence scores.',
    },
  ];

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
          Windows + VS Code Complete Setup Guide
        </h1>
        <p className="mt-1 text-xs sm:text-sm text-slate-400">
          A step-by-step walkthrough to run the entire Fake UPI Shield application locally on Windows 10/11 with MySQL Workbench.
        </p>
      </div>

      {/* Step by step cards */}
      <div className="space-y-6">
        {steps.map((step, idx) => (
          <div key={idx} className="p-5 rounded-2xl border border-slate-800 bg-slate-900/30 space-y-3">
            <h3 className="text-sm font-semibold text-white">{step.title}</h3>
            <p className="text-xs text-slate-300 leading-relaxed">{step.desc}</p>

            {step.items && (
              <ul className="list-disc list-inside space-y-1.5 text-xs text-slate-400 pl-1">
                {step.items.map((it, i) => (
                  <li key={i}>{it}</li>
                ))}
              </ul>
            )}

            {step.cmd && (
              <div className="relative group">
                <pre className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono text-emerald-400 overflow-x-auto">
                  {step.cmd}
                </pre>
                <button
                  onClick={() => copyToClipboard(step.cmd!, idx)}
                  className="absolute right-3 top-3 p-1.5 rounded bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors cursor-pointer"
                  title="Copy command"
                >
                  {copiedIndex === idx ? (
                    <Check className="w-4 h-4 text-emerald-400" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Common Windows Troubleshooting FAQs */}
      <div className="p-6 rounded-2xl border border-slate-800 bg-slate-900/20 space-y-4">
        <div className="flex items-center gap-2">
          <HelpCircle className="w-4 h-4 text-emerald-400" />
          <h2 className="text-sm font-semibold text-white">Windows Troubleshooting & FAQs</h2>
        </div>

        <div className="space-y-4 pt-1">
          {faqs.map((faq, i) => (
            <div key={i} className="p-4 rounded-xl bg-slate-950 border border-slate-800/80 space-y-1.5">
              <span className="text-xs font-semibold text-slate-200 block">{faq.q}</span>
              <p className="text-[11px] text-slate-400 leading-relaxed">{faq.a}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
