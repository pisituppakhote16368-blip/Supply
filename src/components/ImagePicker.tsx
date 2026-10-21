import React, { useRef, useState } from 'react';
import { Camera, Image as ImageIcon, Trash2, Video, RefreshCw, X } from 'lucide-react';
import { compressImageFile } from '../utils/imageUtils';

interface ImagePickerProps {
  label: string;
  value: string;
  onChange: (dataUrl: string) => void;
  presetImages?: { label: string; url: string }[];
  helperText?: string;
}

export const ImagePicker: React.FC<ImagePickerProps> = ({
  label,
  value,
  onChange,
  presetImages,
  helperText = 'สามารถถ่ายภาพจากกล้อง หรือเลือกจากแกลเลอรี่ในเครื่อง',
}) => {
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  const [isWebcamOpen, setIsWebcamOpen] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [urlInput, setUrlInput] = useState('');

  // Handle file input change (camera or gallery)
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsProcessing(true);
      const compressedDataUrl = await compressImageFile(file, 800, 800, 0.8);
      onChange(compressedDataUrl);
    } catch (err) {
      console.error('Error processing image:', err);
    } finally {
      setIsProcessing(false);
      // Reset input value so same file can be selected again
      e.target.value = '';
    }
  };

  // Open direct WebRTC camera (for laptops/desktops without native capture)
  const openWebcam = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false,
      });
      setStream(mediaStream);
      setIsWebcamOpen(true);
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream;
          videoRef.current.play();
        }
      }, 100);
    } catch (err) {
      console.warn('Direct webcam error, falling back to camera input:', err);
      // Trigger camera input with capture attribute
      cameraInputRef.current?.click();
    }
  };

  const captureWebcamPhoto = () => {
    if (!videoRef.current) return;
    const video = videoRef.current;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.82);
      onChange(dataUrl);
    }
    closeWebcam();
  };

  const closeWebcam = () => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }
    setIsWebcamOpen(false);
  };

  return (
    <div className="space-y-2">
      <label className="block text-xs font-semibold text-slate-700">
        {label}
      </label>

      {/* Hidden file inputs */}
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFileChange}
        className="hidden"
      />
      <input
        ref={galleryInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
      />

      {/* Image Preview & Action Controls */}
      <div className="flex flex-col sm:flex-row items-start gap-4 p-3.5 bg-slate-50 border border-slate-200 rounded-xl">
        {/* Preview Thumbnail */}
        <div className="relative shrink-0">
          {value ? (
            <img
              src={value}
              alt={label}
              referrerPolicy="no-referrer"
              className="w-24 h-24 sm:w-28 sm:h-28 rounded-xl object-cover border border-slate-200 bg-white shadow-2xs"
            />
          ) : (
            <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-xl border-2 border-dashed border-slate-300 bg-white flex flex-col items-center justify-center text-slate-400">
              <ImageIcon className="w-8 h-8 stroke-1" />
              <span className="text-[10px] mt-1">ยังไม่มีรูป</span>
            </div>
          )}

          {isProcessing && (
            <div className="absolute inset-0 bg-slate-900/50 rounded-xl flex items-center justify-center text-white">
              <RefreshCw className="w-5 h-5 animate-spin" />
            </div>
          )}
        </div>

        {/* Buttons: Camera & Gallery */}
        <div className="flex-1 space-y-2.5">
          <div className="text-xs text-slate-500">
            {helperText}
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* 📷 ถ่ายจากกล้อง (Camera) */}
            <button
              type="button"
              onClick={() => {
                // If on mobile device with native camera support, use cameraInputRef
                if (/Android|iPhone|iPad|iPod/i.test(navigator.userAgent)) {
                  cameraInputRef.current?.click();
                } else {
                  openWebcam();
                }
              }}
              className="px-3 py-1.5 bg-teal-600 hover:bg-teal-700 text-white text-xs font-medium rounded-lg shadow-2xs transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <Camera className="w-3.5 h-3.5" />
              <span>ถ่ายภาพจากกล้อง</span>
            </button>

            {/* 🖼️ เลือกจากแกลเลอรี่ (Gallery) */}
            <button
              type="button"
              onClick={() => galleryInputRef.current?.click()}
              className="px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-700 text-xs font-medium rounded-lg border border-slate-300 shadow-2xs transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <ImageIcon className="w-3.5 h-3.5 text-slate-500" />
              <span>เลือกจากแกลเลอรี่ / ไฟล์รูป</span>
            </button>

            {/* URL toggle */}
            <button
              type="button"
              onClick={() => setShowUrlInput(!showUrlInput)}
              className="px-2.5 py-1.5 bg-white hover:bg-slate-100 text-slate-600 text-xs font-medium rounded-lg border border-slate-200 transition-colors cursor-pointer"
            >
              <span>{showUrlInput ? 'ซ่อนใส่ลิงก์' : 'ใส่ URL รูปภาพ'}</span>
            </button>

            {/* ลบรูป (Clear) */}
            {value && (
              <button
                type="button"
                onClick={() => onChange('')}
                className="px-2.5 py-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 text-xs font-medium rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                title="ลบรูปภาพนี้"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>ลบรูป</span>
              </button>
            )}
          </div>

          {/* Direct URL input if toggled */}
          {showUrlInput && (
            <div className="flex gap-2 pt-1">
              <input
                type="url"
                placeholder="วางลิงก์รูปภาพ เช่น https://example.com/photo.jpg"
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                className="flex-1 px-2.5 py-1 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-teal-500"
              />
              <button
                type="button"
                onClick={() => {
                  if (urlInput.trim()) {
                    onChange(urlInput.trim());
                    setUrlInput('');
                    setShowUrlInput(false);
                  }
                }}
                className="px-3 py-1 bg-teal-600 text-white text-xs font-semibold rounded-lg hover:bg-teal-700 cursor-pointer"
              >
                ใช้รูปนี้
              </button>
            </div>
          )}

          {/* Preset Images Option (if provided) */}
          {presetImages && presetImages.length > 0 && (
            <div className="pt-1.5 border-t border-slate-200">
              <div className="text-[11px] text-slate-500 mb-1.5">หรือเลือกภาพตัวอย่างอุปกรณ์มาตรฐาน:</div>
              <div className="flex items-center gap-1.5 flex-wrap">
                {presetImages.map((preset, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => onChange(preset.url)}
                    className={`text-[11px] px-2 py-0.5 rounded border transition-colors cursor-pointer ${
                      value === preset.url
                        ? 'bg-teal-600 text-white border-teal-600 font-medium'
                        : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Live Webcam Modal for desktop/laptop capture */}
      {isWebcamOpen && (
        <div className="fixed inset-0 z-60 bg-slate-900/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden animate-in fade-in">
            <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2 font-bold text-slate-800 text-sm">
                <Video className="w-4 h-4 text-teal-600" />
                <span>ถ่ายภาพจากกล้อง</span>
              </div>
              <button
                type="button"
                onClick={closeWebcam}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="relative bg-black flex items-center justify-center min-h-[300px]">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full max-h-[420px] object-cover"
              />
            </div>

            <div className="p-4 bg-slate-50 flex items-center justify-center gap-3">
              <button
                type="button"
                onClick={closeWebcam}
                className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-800 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
              >
                ยกเลิก
              </button>
              <button
                type="button"
                onClick={captureWebcamPhoto}
                className="px-6 py-2 bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold rounded-lg shadow-sm transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <Camera className="w-4 h-4" />
                <span>กดถ่ายภาพนี้</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
