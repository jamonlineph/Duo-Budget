
import React, { useRef, useState, useEffect, useImperativeHandle, forwardRef } from 'react';
import { Camera, X, RefreshCw } from 'lucide-react';

export interface FileUploadHandle {
  openCamera: () => void;
  openGallery: () => void;
}

interface FileUploadProps {
  onUpload: (base64: string) => void;
  isLoading: boolean;
}

export const FileUpload = forwardRef<FileUploadHandle, FileUploadProps>(({ onUpload, isLoading }, ref) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);

  useImperativeHandle(ref, () => ({
    openCamera: () => {
      startCamera();
    },
    openGallery: () => {
      fileInputRef.current?.click();
    }
  }));

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        onUpload(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' }, 
        audio: false 
      });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
      setIsCameraOpen(true);
    } catch (err) {
      console.error("Error accessing camera:", err);
      alert("Could not access camera. Please ensure you've granted permissions.");
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    setIsCameraOpen(false);
  };

  const takePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');
      
      if (context) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/png');
        onUpload(dataUrl);
        stopCamera();
      }
    }
  };

  useEffect(() => {
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [stream]);

  return (
    <>
      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={handleFileChange} 
        className="hidden" 
        accept="image/*"
      />
      <canvas ref={canvasRef} className="hidden" />

      {/* Live Camera Modal */}
      {isCameraOpen && (
        <div className="fixed inset-0 z-[200] bg-slate-900/90 backdrop-blur-xl flex flex-col items-center justify-center p-4">
          <div className="relative w-full max-w-md aspect-[3/4] glass-card rounded-[3rem] overflow-hidden shadow-2xl border-white/20">
            <video 
              ref={videoRef} 
              autoPlay 
              playsInline 
              className="w-full h-full object-cover"
            />
            
            <div className="absolute top-6 left-0 right-0 px-6 flex justify-between items-center">
              <div className="bg-slate-900/40 backdrop-blur-md px-4 py-2 rounded-full border border-white/10 flex items-center gap-2">
                <div className="w-2 h-2 bg-rose-500 rounded-full animate-pulse" />
                <span className="text-[10px] font-black text-white uppercase tracking-widest">Receipt Scanner</span>
              </div>
              <button 
                onClick={stopCamera}
                className="p-3 bg-white/10 hover:bg-white/20 backdrop-blur-md rounded-full text-white border border-white/20 transition-all"
              >
                <X size={20} />
              </button>
            </div>

            <div className="absolute bottom-8 left-0 right-0 flex justify-center items-center gap-8">
              <div className="w-12 h-12" /> 
              <button 
                onClick={takePhoto}
                className="w-20 h-20 rounded-full border-4 border-white p-1 hover:scale-105 active:scale-90 transition-all"
              >
                <div className="w-full h-full bg-white rounded-full shadow-lg" />
              </button>
              <button 
                onClick={startCamera} 
                className="p-3 bg-white/10 backdrop-blur-md rounded-full text-white border border-white/20"
              >
                <RefreshCw size={20} />
              </button>
            </div>
            <div className="absolute inset-12 border-2 border-white/20 rounded-[2rem] pointer-events-none border-dashed" />
          </div>
          <p className="mt-8 text-white/60 text-xs font-black uppercase tracking-[0.2em] animate-pulse">
            Align receipt for auto-detection
          </p>
        </div>
      )}
    </>
  );
});
