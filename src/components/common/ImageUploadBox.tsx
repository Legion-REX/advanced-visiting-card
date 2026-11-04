import React, { useState, useRef } from 'react';
import { Upload, Camera, Image as ImageIcon, Trash2, Check, RefreshCw, AlertTriangle } from 'lucide-react';
import { validateImageUploadFile } from '../../utils/security';

interface ImageUploadBoxProps {
  id?: string;
  label: string;
  value: string;
  onChange: (dataUrl: string) => void;
  onRemove?: () => void;
  aspectRatio?: 'square' | 'banner';
  recommendedText?: string;
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
}

/**
 * Resizes an image file using browser Canvas to prevent blowing localStorage limits
 */
export function processImageFile(
  file: File,
  maxWidth: number,
  maxHeight: number,
  quality = 0.78
): Promise<string> {
  return new Promise((resolve, reject) => {
    // Strict OWASP A08 File Upload Validation
    const validation = validateImageUploadFile(file);
    if (!validation.valid) {
      reject(new Error(validation.error || 'Selected file is not an allowed image type'));
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const src = e.target?.result as string;
      const img = new Image();
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }
        if (height > maxHeight) {
          width = Math.round((width * maxHeight) / height);
          height = maxHeight;
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(src);
          return;
        }

        // Draw image smoothly
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, width, height);

        // Export strictly as compressed JPEG (PNG in canvas produces 1MB+ uncompressed Base64)
        const dataUrl = canvas.toDataURL('image/jpeg', quality);
        resolve(dataUrl);
      };
      img.onerror = () => reject(new Error('Failed to load image file'));
      img.src = src;
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });
}

export const ImageUploadBox: React.FC<ImageUploadBoxProps> = ({
  id,
  label,
  value,
  onChange,
  onRemove,
  aspectRatio = 'square',
  recommendedText,
  maxWidth = 800,
  maxHeight = 800,
  quality = 0.78,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleFile = async (file: File) => {
    // OWASP A08: Comprehensive file integrity and format verification
    const validation = validateImageUploadFile(file);
    if (!validation.valid) {
      setErrorMsg(validation.error || 'Please select a valid image file (JPG, PNG, WebP).');
      return;
    }

    setErrorMsg(null);
    setIsProcessing(true);
    try {
      const dataUrl = await processImageFile(file, maxWidth, maxHeight, quality);
      onChange(dataUrl);
    } catch (err) {
      console.error('Error processing uploaded image:', err);
      setErrorMsg('Failed to process image. Please try another file.');
    } finally {
      setIsProcessing(false);
    }
  };

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const onDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      handleFile(file);
    }
  };

  const onInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      handleFile(file);
      // reset input value so re-uploading the same file works
      e.target.value = '';
    }
  };

  const triggerUpload = () => {
    fileInputRef.current?.click();
  };

  const isBanner = aspectRatio === 'banner';

  return (
    <div className="space-y-1.5 min-w-0 w-full" id={id}>
      <div className="flex items-center justify-between gap-2 min-w-0">
        <label className="block font-semibold text-slate-700 dark:text-slate-300 text-xs truncate">
          {label}
        </label>
        {recommendedText && (
          <span className="text-[10px] text-slate-400 dark:text-slate-500 whitespace-nowrap flex-shrink-0">
            {recommendedText}
          </span>
        )}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={onInputChange}
        className="hidden"
      />

      <div
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        className={`relative group rounded-3xl border-2 transition-all p-3.5 sm:p-4 flex flex-col justify-between overflow-hidden min-w-0 w-full ${
          isDragging
            ? 'border-indigo-500 bg-indigo-50/80 dark:bg-indigo-950/60 backdrop-blur-xl'
            : 'border-dashed border-white/60 dark:border-white/20 glass-card hover:border-indigo-400 dark:hover:border-indigo-500'
        }`}
      >
        {isBanner ? (
          <div className="space-y-3 w-full min-w-0">
            {/* Full-width panoramic preview */}
            <div className="relative w-full h-28 sm:h-32 rounded-2xl overflow-hidden border border-white/60 dark:border-white/10 bg-white/40 dark:bg-slate-900/60 backdrop-blur-md flex items-center justify-center">
              {value ? (
                <img
                  src={value}
                  alt={label}
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="flex flex-col items-center justify-center text-slate-400 dark:text-slate-500 p-2 text-center">
                  <ImageIcon className="w-7 h-7" />
                  <span className="text-[10px] mt-1 font-medium">No Banner Uploaded (Using Default Theme Gradient)</span>
                </div>
              )}
              {isProcessing && (
                <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center text-white">
                  <RefreshCw className="w-5 h-5 animate-spin" />
                </div>
              )}
            </div>

            {/* Controls row */}
            <div className="flex flex-wrap items-center justify-between gap-2 min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={triggerUpload}
                  disabled={isProcessing}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 sm:px-4 sm:py-2 rounded-xl glass-btn-primary text-white font-semibold text-xs shadow-md active:scale-95 transition-all disabled:opacity-50"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>{value ? 'Change Banner' : 'Upload Banner'}</span>
                </button>

                {value && onRemove && (
                  <button
                    type="button"
                    onClick={onRemove}
                    className="inline-flex items-center gap-1 px-3 py-1.5 sm:py-2 rounded-xl glass-card hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 border border-white/50 dark:border-white/10 text-xs font-semibold transition-colors"
                    title="Remove banner"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Remove</span>
                  </button>
                )}
              </div>

              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Recommended 1200×500 px. Supports JPG, PNG, WebP.
              </p>
            </div>
          </div>
        ) : (
          /* Square / Profile / Logo / Product / QR */
          <div className="flex items-center gap-3.5 min-w-0 w-full">
            {/* Visual Thumbnail */}
            <div className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-2xl overflow-hidden border border-white/60 dark:border-white/10 bg-white/40 dark:bg-slate-900/60 backdrop-blur-md flex-shrink-0 flex items-center justify-center">
              {value ? (
                <img
                  src={value}
                  alt={label}
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="flex flex-col items-center justify-center text-slate-400 dark:text-slate-500 p-1.5 text-center">
                  <Camera className="w-5 h-5 sm:w-6 sm:h-6" />
                  <span className="text-[9px] mt-0.5 font-medium">No Image</span>
                </div>
              )}

              {isProcessing && (
                <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center text-white">
                  <RefreshCw className="w-4 h-4 sm:w-5 sm:h-5 animate-spin" />
                </div>
              )}
            </div>

            {/* Upload and File Details */}
            <div className="flex-1 min-w-0 space-y-1.5">
              <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                <button
                  type="button"
                  onClick={triggerUpload}
                  disabled={isProcessing}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-xl glass-btn-primary text-white font-semibold text-xs shadow-md active:scale-95 transition-all disabled:opacity-50 whitespace-nowrap"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>{value ? 'Change Photo' : 'Upload'}</span>
                </button>

                {value && onRemove && (
                  <button
                    type="button"
                    onClick={onRemove}
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 sm:py-2 rounded-xl glass-card hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 border border-white/50 dark:border-white/10 text-xs font-semibold transition-colors whitespace-nowrap"
                    title="Remove image"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Remove</span>
                  </button>
                )}
              </div>

              <p className="text-[10.5px] leading-tight text-slate-500 dark:text-slate-400 line-clamp-2">
                Drag & drop file or click to browse. Supports JPG, PNG.
              </p>
            </div>
          </div>
        )}

        {errorMsg && (
          <div className="mt-2 text-[11px] font-medium text-rose-600 dark:text-rose-400">
            {errorMsg}
          </div>
        )}
      </div>
    </div>
  );
};
