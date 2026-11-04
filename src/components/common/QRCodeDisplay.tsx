import React, { useEffect, useRef, useState } from 'react';
import QRCode from 'qrcode';
import { Download, Copy, Check, QrCode } from 'lucide-react';

interface QRCodeDisplayProps {
  url: string;
  title?: string;
  subtitle?: string;
  size?: number;
  isActive?: boolean;
}

export const QRCodeDisplay: React.FC<QRCodeDisplayProps> = ({
  url,
  title = 'Scan to Open Mini Website',
  subtitle = 'Point any smartphone camera at this code to view and save this card instantly.',
  size = 220,
  isActive = true,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [copied, setCopied] = useState(false);
  const [downloadUrl, setDownloadUrl] = useState<string>('');
  const [inactiveNotice, setInactiveNotice] = useState<string | null>(null);

  const showInactiveAlert = (message: string) => {
    setInactiveNotice(message);
    setTimeout(() => setInactiveNotice(null), 3500);
  };

  useEffect(() => {
    if (canvasRef.current && url) {
      QRCode.toCanvas(
        canvasRef.current,
        url,
        {
          width: size,
          margin: 2,
          color: {
            dark: '#0f172a',
            light: '#ffffff',
          },
        },
        (error) => {
          if (error) {
            console.error('QR Code error:', error);
          } else if (canvasRef.current) {
            setDownloadUrl(canvasRef.current.toDataURL('image/png'));
          }
        }
      );
    }
  }, [url, size]);

  const handleCopy = async () => {
    if (!isActive) {
      showInactiveAlert('Card is pending admin activation. Link copying is disabled until activated by Admin.');
      return;
    }
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
      setCopied(false);
    }
  };

  const handleDownload = () => {
    if (!isActive) {
      showInactiveAlert('Card is pending admin activation. QR code download is disabled until activated by Admin.');
      return;
    }
    if (!downloadUrl) return;
    const a = document.createElement('a');
    a.href = downloadUrl;
    a.download = 'Mini_Website_QR_Code.png';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div className="glass-panel rounded-3xl p-6 text-center shadow-xl border border-white/60 dark:border-white/15 relative">
      {inactiveNotice && (
        <div className="absolute inset-x-4 top-3 z-30 p-2.5 rounded-xl bg-amber-500/95 text-slate-950 text-xs font-bold shadow-xl border border-amber-400 animate-in fade-in slide-in-from-top-2">
          ⚠️ {inactiveNotice}
        </div>
      )}

      <div className="flex items-center justify-center gap-2 mb-2">
        <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
          <QrCode className="w-5 h-5" />
        </div>
        <h4 className="font-bold text-slate-900 dark:text-slate-100 text-base">{title}</h4>
      </div>

      {!isActive && (
        <div className="mb-2">
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/40">
            ⏳ Pending Admin Activation (Inactive)
          </span>
        </div>
      )}

      <p className="text-xs text-slate-500 dark:text-slate-400 mb-5 max-w-xs mx-auto">
        {subtitle}
      </p>

      {/* QR Canvas wrapped in clean frosted container */}
      <div className="inline-block p-4 bg-white dark:bg-white rounded-2xl shadow-xl border border-white/80 dark:border-white/20 mb-5 relative">
        <canvas ref={canvasRef} className="mx-auto block" />
        {!isActive && (
          <div className="absolute inset-0 bg-slate-950/20 backdrop-blur-[1px] rounded-2xl flex items-center justify-center">
            <span className="bg-slate-900/90 text-amber-300 text-[10px] font-bold px-2 py-1 rounded-md border border-amber-500/40 shadow-lg">
              Pending Activation
            </span>
          </div>
        )}
      </div>

      {/* URL bar & actions */}
      <div className="flex flex-col sm:flex-row items-center justify-center gap-2 max-w-sm mx-auto">
        <button
          type="button"
          onClick={handleCopy}
          className={`w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-xl border transition-all shadow-xs ${
            !isActive
              ? 'bg-amber-500/10 hover:bg-amber-500/20 text-amber-800 dark:text-amber-300 border-amber-500/30'
              : 'glass-card hover:bg-white/80 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 border-white/60 dark:border-white/15'
          }`}
          title={!isActive ? 'Disabled until activated by Admin' : 'Copy link'}
        >
          {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
          <span>{copied ? 'Copied Link!' : 'Copy Link'}</span>
        </button>

        <button
          type="button"
          onClick={handleDownload}
          className={`w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-xl border transition-all shadow-md active:scale-95 ${
            !isActive
              ? 'bg-slate-700 text-slate-300 border-slate-600'
              : 'glass-btn-primary text-white border-indigo-400/30'
          }`}
          title={!isActive ? 'Disabled until activated by Admin' : 'Download QR PNG'}
        >
          <Download className="w-3.5 h-3.5" />
          <span>Download QR PNG</span>
        </button>
      </div>
    </div>
  );
};
