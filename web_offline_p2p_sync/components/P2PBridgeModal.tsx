import React, { useState, useRef } from 'react';
import { QRCodeSVG } from '@/components/ui/qrcode-svg';
import { Scanner } from '@yudiel/react-qr-scanner';
import { QrCode, Scan, Wifi, Link as LinkIcon, Loader2 } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';
import { SyncManager } from '../core/SyncManager';

interface P2PBridgeModalProps {
  isOpen: boolean;
  onClose: () => void;
  syncManager: SyncManager;
}

type TabType = 'CREATE' | 'JOIN' | 'WIFI';
type ConnectionStep = 'IDLE' | 'GENERATING' | 'SHOWING_OFFER' | 'SCANNING_ANSWER' | 'SCANNING_OFFER' | 'GENERATING_ANSWER' | 'SHOWING_ANSWER' | 'CONNECTED';

export const P2PBridgeModal: React.FC<P2PBridgeModalProps> = ({ isOpen, onClose, syncManager }) => {
  const [activeTab, setActiveTab] = useState<TabType>('CREATE');
  const [step, setStep] = useState<ConnectionStep>('IDLE');
  const [qrPayload, setQrPayload] = useState<string>('');
  const [localIp, setLocalIp] = useState('wss://event-router.local:8080');
  const [error, setError] = useState<string>('');
  const currentPc = useRef<RTCPeerConnection | null>(null);

  if (!isOpen) return null;

  const mesh = syncManager.getMeshEngine();

  const handleCreateOffer = async () => {
    try {
      setStep('GENERATING');
      setError('');
      const { compressedOffer, pc } = await mesh.createOffer();
      currentPc.current = pc;
      setQrPayload(compressedOffer);
      setStep('SHOWING_OFFER');
    } catch (err: any) {
      setError(err.message || 'Failed to create connection offer');
      setStep('IDLE');
    }
  };

  const handleScanOffer = async (result: string) => {
    try {
      setStep('GENERATING_ANSWER');
      setError('');
      const { compressedAnswer, pc } = await mesh.acceptOffer(result);
      currentPc.current = pc;
      setQrPayload(compressedAnswer);
      setStep('SHOWING_ANSWER');
    } catch (err: any) {
      setError(err.message || 'Failed to parse connection offer');
      setStep('SCANNING_OFFER');
    }
  };

  const handleScanAnswer = async (result: string) => {
    try {
      if (!currentPc.current) throw new Error("No active connection");
      await mesh.acceptAnswer(currentPc.current, result);
      setStep('CONNECTED');
      setTimeout(onClose, 2000);
    } catch (err: any) {
      setError(err.message || 'Failed to accept connection answer');
    }
  };

  const handleConnectWs = async () => {
    setStep('GENERATING'); setError('');
    try { await mesh.connectWebSocket(localIp); onClose(); }
    catch (error: any) { setError(error.message || 'Router connection failed.'); }
    finally { setStep('IDLE'); }
  };

  const reset = () => {
    if(currentPc.current && currentPc.current.connectionState!=='connected') currentPc.current.close();
    currentPc.current=null;
    setStep('IDLE');
    setError('');
    setQrPayload('');
  };

  return (
    <Dialog open={isOpen} onOpenChange={open => { if (!open) onClose(); }}>
      <DialogContent className="workspace-bridge-dialog sm:max-w-lg">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-900/50">
          <div className="flex items-center gap-2">
            <LinkIcon className="w-5 h-5 text-indigo-500" />
            <DialogTitle>Bridge devices offline</DialogTitle>
          </div>
        </div>
        <DialogDescription className="sr-only">Create or join a device bridge, or connect using a local WiFi router.</DialogDescription>

        {/* Tabs */}
        <div className="flex p-2 gap-2 bg-slate-50 dark:bg-slate-900/50 border-b border-slate-100 dark:border-slate-800">
          <button
            aria-pressed={activeTab === 'CREATE'}
            onClick={() => { setActiveTab('CREATE'); reset(); }}
            className={`flex-1 flex justify-center items-center gap-2 py-2 text-sm font-medium rounded-lg transition-colors ${activeTab === 'CREATE' ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-sm' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800'}`}
          >
            <QrCode className="w-4 h-4" /> Create Bridge
          </button>
          <button
            aria-pressed={activeTab === 'JOIN'}
            onClick={() => { setActiveTab('JOIN'); reset(); }}
            className={`flex-1 flex justify-center items-center gap-2 py-2 text-sm font-medium rounded-lg transition-colors ${activeTab === 'JOIN' ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-sm' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800'}`}
          >
            <Scan className="w-4 h-4" /> Join Bridge
          </button>
          <button
            aria-pressed={activeTab === 'WIFI'}
            onClick={() => { setActiveTab('WIFI'); reset(); }}
            className={`flex-1 flex justify-center items-center gap-2 py-2 text-sm font-medium rounded-lg transition-colors ${activeTab === 'WIFI' ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-sm' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800'}`}
          >
            <Wifi className="w-4 h-4" /> Local WiFi
          </button>
        </div>

        {/* Body */}
        <div className="p-6 flex flex-col items-center justify-center min-h-[350px]">
          {error && <div role="alert" className="w-full p-3 mb-4 text-sm text-destructive bg-muted rounded-lg border border-border">{error}</div>}

          {/* CREATE TAB */}
          {activeTab === 'CREATE' && (
            <div className="w-full flex flex-col items-center">
              {step === 'IDLE' && (
                <>
                  <div className="w-16 h-16 bg-indigo-50 dark:bg-indigo-900/30 rounded-full flex items-center justify-center mb-4">
                    <QrCode className="w-8 h-8 text-indigo-600 dark:text-indigo-400" />
                  </div>
                  <h4 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">Host an Offline Session</h4>
                  <p className="text-sm text-slate-500 text-center mb-6">Generate a connection QR code. The other device must scan it using the &quot;Join Bridge&quot; tab.</p>
                  <button onClick={handleCreateOffer} className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-medium transition-colors shadow-sm shadow-indigo-600/20">
                    Generate Connection QR
                  </button>
                </>
              )}
              
              {step === 'GENERATING' && (
                <div className="flex flex-col items-center gap-3 text-slate-500">
                  <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
                  Generating compressed WebRTC keys...
                </div>
              )}

              {step === 'SHOWING_OFFER' && (
                <div className="flex flex-col items-center w-full">
                  <p className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-4 text-center">Step 1: Have the other device scan this code.</p>
                  <div className="p-4 bg-white rounded-2xl border-4 border-indigo-100 shadow-sm mb-6">
                    <QRCodeSVG value={qrPayload} size={200} level="L" includeMargin={false} />
                  </div>
                  <button onClick={() => setStep('SCANNING_ANSWER')} className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-medium transition-colors">
                    Next: Scan Their Response
                  </button>
                </div>
              )}

              {step === 'SCANNING_ANSWER' && (
                <div className="flex flex-col items-center w-full">
                  <p className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-4 text-center">Step 2: Scan the Answer QR code shown on the other device.</p>
                  <div className="w-full h-64 bg-slate-900 rounded-xl overflow-hidden mb-4 relative">
                    <Scanner onScan={(res) => { if(res[0]?.rawValue) void handleScanAnswer(res[0].rawValue); }} />
                  </div>
                </div>
              )}

              {step === 'CONNECTED' && (
                <div className="flex flex-col items-center gap-3 text-emerald-600">
                  <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center">
                    <LinkIcon className="w-8 h-8" />
                  </div>
                  <h4 className="text-lg font-bold">Devices Bridged!</h4>
                  <p className="text-sm text-slate-500">Offline syncing is now active.</p>
                </div>
              )}
            </div>
          )}

          {/* JOIN TAB */}
          {activeTab === 'JOIN' && (
            <div className="w-full flex flex-col items-center">
              {step === 'IDLE' && (
                <>
                  <div className="w-16 h-16 bg-sky-50 dark:bg-sky-900/30 rounded-full flex items-center justify-center mb-4">
                    <Scan className="w-8 h-8 text-sky-600 dark:text-sky-400" />
                  </div>
                  <h4 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">Join an Offline Session</h4>
                  <p className="text-sm text-slate-500 text-center mb-6">Scan a Connection QR code from the host device.</p>
                  <button onClick={() => setStep('SCANNING_OFFER')} className="ui-button ui-button-primary w-full py-2.5 px-4 font-medium">
                    Open Scanner
                  </button>
                </>
              )}

              {step === 'SCANNING_OFFER' && (
                <div className="flex flex-col items-center w-full">
                  <p className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-4 text-center">Step 1: Scan the Host&apos;s QR Code.</p>
                  <div className="w-full h-64 bg-slate-900 rounded-xl overflow-hidden mb-4 relative">
                    <Scanner onScan={(res) => { if(res[0]?.rawValue) void handleScanOffer(res[0].rawValue); }} />
                  </div>
                </div>
              )}

              {step === 'GENERATING_ANSWER' && (
                <div className="flex flex-col items-center gap-3 text-slate-500">
                  <Loader2 className="w-8 h-8 animate-spin text-sky-600" />
                  Negotiating connection...
                </div>
              )}

              {step === 'SHOWING_ANSWER' && (
                <div className="flex flex-col items-center w-full">
                  <p className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-4 text-center">Step 2: Have the Host scan this response code.</p>
                  <div className="p-4 bg-white rounded-2xl border-4 border-sky-100 shadow-sm mb-6">
                    <QRCodeSVG value={qrPayload} size={200} level="L" includeMargin={false} />
                  </div>
                  <p className="text-xs text-slate-400 text-center">Once they scan this, the devices will be bridged!</p>
                </div>
              )}
            </div>
          )}

          {/* WIFI TAB */}
          {activeTab === 'WIFI' && (
            <div className="w-full flex flex-col items-center">
              <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-4">
                <Wifi className="w-8 h-8 text-slate-600 dark:text-slate-400" />
              </div>
              <h4 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">Local WebSocket Router</h4>
              <p className="text-sm text-slate-500 text-center mb-6">Connect to a local Node.js WebSocket mesh router on your offline Wi-Fi network.</p>
              
              <div className="w-full mb-6">
                <label htmlFor="bridge-router-url" className="block text-xs font-semibold text-slate-500 mb-2">Router WebSocket URL</label>
                <input
                  id="bridge-router-url"
                  type="text"
                  value={localIp}
                  onChange={(e) => setLocalIp(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm outline-none focus:border-indigo-500 font-mono"
                  placeholder="wss://event-router.local:8080/?token=..."
                />
              </div>

              <button disabled={step === 'GENERATING'} onClick={handleConnectWs} className="w-full py-2.5 px-4 bg-slate-800 hover:bg-slate-900 dark:bg-slate-200 dark:hover:bg-white dark:text-slate-900 text-white rounded-xl font-medium transition-colors">
                {step === 'GENERATING' ? 'Connecting...' : 'Connect'}
              </button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
