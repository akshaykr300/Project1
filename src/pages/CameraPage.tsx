/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import React, { useState, useRef, useEffect } from 'react';
import { api } from '../services/api';
import { AnalysisRecord } from '../types';
import {
  Camera,
  RefreshCw,
  Check,
  AlertCircle,
  SwitchCamera,
  Loader2,
  X,
  ShieldAlert
} from 'lucide-react';

interface CameraPageProps {
  onAnalysisComplete: (result: AnalysisRecord) => void;
  onCancel: () => void;
}

import { motion } from 'motion/react';

export const CameraPage: React.FC<CameraPageProps> = ({
  onAnalysisComplete,
  onCancel,
}) => {
  const [streamActive, setStreamActive] = useState(false);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('environment');
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string>('');

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Stop camera tracks cleanly
  const stopTracks = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setStreamActive(false);
  };

  useEffect(() => {
    return () => {
      stopTracks();
    };
  }, []);

  const startCamera = async (mode: 'user' | 'environment' = facingMode) => {
    setErrorMessage(null);
    stopTracks();

    // Check secure context
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setErrorMessage(
        'Camera API is not supported in this browser environment. Note: Browser camera access requires localhost or a secure HTTPS connection with explicit user permission.'
      );
      return;
    }

    try {
      const constraints: MediaStreamConstraints = {
        video: {
          facingMode: mode,
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        },
        audio: false,
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
      setStreamActive(true);
    } catch (err: any) {
      console.error('Camera error:', err);
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setErrorMessage('Camera access was denied. Please allow camera permissions in your browser address bar.');
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        setErrorMessage('No camera device detected on your system.');
      } else {
        setErrorMessage(`Camera initialization error: ${err.message || 'Unable to open camera.'}`);
      }
    }
  };

  const toggleCameraFacing = () => {
    const nextMode = facingMode === 'environment' ? 'user' : 'environment';
    setFacingMode(nextMode);
    if (streamActive) {
      startCamera(nextMode);
    }
  };

  const captureFrame = () => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth || 1080;
    canvas.height = video.videoHeight || 1920;

    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL('image/png', 0.95);
      setCapturedImage(dataUrl);
      stopTracks();
    }
  };

  const retakePhoto = () => {
    setCapturedImage(null);
    startCamera(facingMode);
  };

  const submitCapturedImage = async () => {
    if (!capturedImage) return;

    setIsSubmitting(true);
    setErrorMessage(null);
    setStatusMessage('Ingesting camera snapshot...');

    try {
      const response = await fetch(capturedImage);
      const blob = await response.blob();
      const filename = `camera_upi_${Date.now()}.png`;
      const file = new File([blob], filename, { type: 'image/png' });

      setStatusMessage('Extracting text & applying OpenCV preprocessing...');
      let extractedText = '';
      try {
        const { createWorker } = await import('tesseract.js');
        const worker = await createWorker('eng');
        const ret = await worker.recognize(capturedImage);
        extractedText = ret.data.text;
        await worker.terminate();
      } catch (tessErr) {
        console.warn('OCR error during camera processing:', tessErr);
      }

      setStatusMessage('Running heuristic verification and CNN check...');
      const result = await api.analyzeImage(file, filename, {
        ocrText: extractedText,
        dimensions: `${canvasRef.current?.width || 1080}x${canvasRef.current?.height || 1920}`,
      });

      result.image_preview = capturedImage;
      onAnalysisComplete(result);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to analyze captured image. Please try again.');
    } finally {
      setIsSubmitting(false);
      setStatusMessage('');
    }
  };

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div className="flex items-center justify-between pb-4 border-b border-slate-800">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
            <span>Live Camera Scanner</span>
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Hold your camera over the customer's phone or physical POS payment receipt.
          </p>
        </div>
        <button
          onClick={() => {
            stopTracks();
            onCancel();
          }}
          className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-900 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {errorMessage && (
        <motion.div
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 rounded-xl bg-red-950/40 border border-red-800/80 text-red-300 text-xs flex items-start gap-3"
        >
          <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <span className="font-semibold text-red-200">Camera Notice</span>
            <p>{errorMessage}</p>
          </div>
        </motion.div>
      )}

      {/* Hidden processing canvas */}
      <canvas ref={canvasRef} className="hidden" />

      {/* Viewport / Live Stream Frame with Cyber Styling */}
      <div className="relative aspect-[9/16] sm:aspect-[4/3] max-h-[520px] w-full rounded-2xl overflow-hidden bg-slate-950 border border-slate-800 flex items-center justify-center shadow-2xl">
        {capturedImage ? (
          <img
            src={capturedImage}
            alt="Captured UPI Screenshot"
            className="w-full h-full object-contain bg-black"
          />
        ) : streamActive ? (
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="text-center p-6 space-y-4">
            <motion.div
              animate={{ scale: [1, 1.05, 1] }}
              transition={{ repeat: Infinity, duration: 2.5, ease: 'easeInOut' }}
              className="w-16 h-16 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-400 mx-auto shadow-inner"
            >
              <Camera className="w-8 h-8 text-emerald-400" />
            </motion.div>
            <div>
              <p className="text-sm font-semibold text-white">Camera is Standby</p>
              <p className="text-xs text-slate-400 max-w-sm mt-1">
                Click the button below to request camera permission and start the live viewfinder.
              </p>
            </div>
            <motion.button
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.96 }}
              onClick={() => startCamera(facingMode)}
              className="px-5 py-2.5 text-xs font-semibold text-slate-950 bg-emerald-400 hover:bg-emerald-300 rounded-lg shadow-[0_0_20px_rgba(52,211,153,0.3)] transition-all cursor-pointer"
            >
              Activate Camera
            </motion.button>
          </div>
        )}

        {/* Viewfinder Target Guides when active */}
        {streamActive && !capturedImage && (
          <div className="absolute inset-8 pointer-events-none border-2 border-emerald-400/30 rounded-2xl flex items-center justify-center">
            {/* Corner Bracket Reticles */}
            <div className="absolute top-0 left-0 w-6 h-6 border-t-2 border-l-2 border-emerald-400" />
            <div className="absolute top-0 right-0 w-6 h-6 border-t-2 border-r-2 border-emerald-400" />
            <div className="absolute bottom-0 left-0 w-6 h-6 border-b-2 border-l-2 border-emerald-400" />
            <div className="absolute bottom-0 right-0 w-6 h-6 border-b-2 border-r-2 border-emerald-400" />

            {/* Center target crosshair */}
            <div className="w-8 h-8 border border-emerald-400/40 rounded-full flex items-center justify-center animate-radar-pulse">
              <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full" />
            </div>

            <span className="absolute bottom-4 text-[10px] uppercase font-mono tracking-widest text-emerald-300 bg-black/60 px-3 py-1 rounded-full border border-emerald-500/30 backdrop-blur-sm">
              Align UPI Receipt Within Reticle
            </span>
          </div>
        )}
      </div>

      {/* Camera Controls Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-xl bg-slate-900/50 border border-slate-800">
        <div className="flex items-center gap-2">
          {streamActive && !capturedImage && (
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={toggleCameraFacing}
              className="px-3 py-2 text-xs font-medium text-slate-300 bg-slate-800 hover:bg-slate-700 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <SwitchCamera className="w-4 h-4" />
              <span>Flip ({facingMode === 'environment' ? 'Rear' : 'Front'})</span>
            </motion.button>
          )}

          {capturedImage && (
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={retakePhoto}
              disabled={isSubmitting}
              className="px-3.5 py-2 text-xs font-medium text-slate-300 bg-slate-800 hover:bg-slate-700 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Retake Photo</span>
            </motion.button>
          )}
        </div>

        <div className="flex items-center gap-3">
          {streamActive && !capturedImage && (
            <motion.button
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.96 }}
              onClick={captureFrame}
              className="px-5 py-2.5 text-xs font-semibold text-slate-950 bg-emerald-400 hover:bg-emerald-300 rounded-lg flex items-center gap-2 shadow-[0_0_20px_rgba(52,211,153,0.3)] transition-all cursor-pointer"
            >
              <Camera className="w-4 h-4" />
              <span>Capture Frame</span>
            </motion.button>
          )}

          {capturedImage && (
            <motion.button
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.96 }}
              onClick={submitCapturedImage}
              disabled={isSubmitting}
              className="px-5 py-2.5 text-xs font-semibold text-slate-950 bg-emerald-400 hover:bg-emerald-300 rounded-lg flex items-center gap-2 shadow-[0_0_20px_rgba(52,211,153,0.3)] transition-all cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>{statusMessage || 'Analyzing...'}</span>
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  <span>Submit for Analysis</span>
                </>
              )}
            </motion.button>
          )}
        </div>
      </div>
    </div>
  );
};
