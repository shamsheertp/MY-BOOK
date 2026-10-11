import { useState, useRef, useEffect } from 'react';
import { Server, RefreshCw, CheckCircle2, AlertCircle, Wifi, WifiOff } from 'lucide-react';
import { useBackendStatus } from '../hooks/useBackendStatus';
import { API_BASE_URL } from '../services/api';

export default function BackendStatusBadge() {
  const { isOnline, isChecking, latency, details, error, lastChecked, refetch } = useBackendStatus();
  const [isOpen, setIsOpen] = useState(false);
  const popoverRef = useRef(null);

  // Close popup on click outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (popoverRef.current && !popoverRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  return (
    <div className="relative inline-block" ref={popoverRef}>
      {/* Clickable Badge */}
      <button
        onClick={() => setIsOpen((prev) => !prev)}
        type="button"
        title="Backend Connectivity Status"
        className={`flex items-center gap-2 px-2.5 py-1.5 rounded-full text-xs font-medium border transition-all shadow-sm ${
          isOnline
            ? 'bg-emerald-50/80 border-emerald-200 text-emerald-700 hover:bg-emerald-100/90'
            : isChecking
            ? 'bg-amber-50/80 border-amber-200 text-amber-700 hover:bg-amber-100/90'
            : 'bg-rose-50/80 border-rose-200 text-rose-700 hover:bg-rose-100/90'
        }`}
      >
        <span className="relative flex h-2 w-2">
          {isOnline && (
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
          )}
          <span
            className={`relative inline-flex rounded-full h-2 w-2 ${
              isOnline ? 'bg-emerald-500' : isChecking ? 'bg-amber-500' : 'bg-rose-500'
            }`}
          ></span>
        </span>

        <span className="hidden sm:inline">
          {isChecking ? 'Connecting...' : isOnline ? 'Backend Online' : 'Backend Offline'}
        </span>

        {isOnline && latency !== null && (
          <span className="text-[10px] text-emerald-600/80 font-mono hidden md:inline">
            {latency}ms
          </span>
        )}
      </button>

      {/* Popover Details */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 p-4 bg-white/95 backdrop-blur-md rounded-2xl shadow-xl border border-slate-200/80 z-50 text-slate-800 animate-in fade-in zoom-in-95 duration-200">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <Server className="w-4 h-4 text-indigo-600" />
              <h4 className="font-semibold text-sm text-slate-800">Backend API Status</h4>
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                refetch();
              }}
              disabled={isChecking}
              className="p-1 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors disabled:opacity-50"
              title="Refresh connection"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isChecking ? 'animate-spin' : ''}`} />
            </button>
          </div>

          <div className="py-3 space-y-2 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-slate-500">Status</span>
              <span className="flex items-center gap-1.5 font-medium">
                {isOnline ? (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span className="text-emerald-700">Operational</span>
                  </>
                ) : (
                  <>
                    <AlertCircle className="w-3.5 h-3.5 text-rose-600" />
                    <span className="text-rose-700">Disconnected</span>
                  </>
                )}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-slate-500">API URL</span>
              <span className="font-mono text-[11px] text-slate-700 bg-slate-100 px-1.5 py-0.5 rounded truncate max-w-[180px]" title={API_BASE_URL}>
                {API_BASE_URL}
              </span>
            </div>

            {latency !== null && (
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Latency</span>
                <span className="font-mono font-medium text-slate-700">{latency} ms</span>
              </div>
            )}

            {details?.uptime !== undefined && (
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Server Uptime</span>
                <span className="font-mono text-slate-700">
                  {Math.round(details.uptime)}s
                </span>
              </div>
            )}

            {lastChecked && (
              <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
                <span>Last verified</span>
                <span>{lastChecked.toLocaleTimeString()}</span>
              </div>
            )}

            {error && (
              <div className="mt-2 p-2 bg-rose-50 border border-rose-200 rounded-lg text-rose-700 text-[11px]">
                {error}
              </div>
            )}
          </div>

          <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
            <span>MY-BOOK API v1.0.0</span>
            <button
              onClick={() => {
                refetch();
              }}
              className="text-indigo-600 hover:text-indigo-700 font-medium"
            >
              Test Ping
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
