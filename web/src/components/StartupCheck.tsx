import { useState, useEffect, useCallback } from 'react';
import { isTauri } from '../api/client';

type BackendStatus = 'checking' | 'ready' | 'timeout' | 'error';

export default function StartupCheck({ children }: { children: React.ReactNode }) {
  const [status, setStatus] = useState<BackendStatus>('checking');
  const [attempts, setAttempts] = useState(0);

  const baseUrl = isTauri ? 'http://127.0.0.1:3000' : 'http://localhost:3000';

  const checkHealth = useCallback(async () => {
    try {
      const res = await fetch(`${baseUrl}/health`);
      if (res.ok) {
        setStatus('ready');
        return true;
      }
    } catch {
      // not ready
    }
    return false;
  }, [baseUrl]);

  useEffect(() => {
    // In browser dev mode, skip the startup check
    if (!isTauri) {
      setStatus('ready');
      return;
    }

    let cancelled = false;
    const maxAttempts = 30; // 15 seconds at 500ms intervals

    const poll = async () => {
      for (let i = 0; i < maxAttempts && !cancelled; i++) {
        setAttempts(i + 1);
        const ok = await checkHealth();
        if (ok) return;
        await new Promise(r => setTimeout(r, 500));
      }
      if (!cancelled) {
        setStatus('timeout');
      }
    };

    poll();
    return () => { cancelled = true; };
  }, [checkHealth]);

  const handleRetry = () => {
    setStatus('checking');
    setAttempts(0);
    checkHealth().then(ok => {
      if (!ok) {
        // Restart polling
        let cancelled = false;
        const maxAttempts = 30;
        const poll = async () => {
          for (let i = 0; i < maxAttempts && !cancelled; i++) {
            setAttempts(i + 1);
            const ok2 = await checkHealth();
            if (ok2) return;
            await new Promise(r => setTimeout(r, 500));
          }
          if (!cancelled) setStatus('timeout');
        };
        poll();
        return () => { cancelled = true; };
      }
    });
  };

  if (status === 'ready') return <>{children}</>;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 to-primary-100">
      <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center space-y-6">
        {/* Logo area */}
        <div className="flex justify-center">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center shadow-lg">
            <svg className="w-10 h-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.003 8.003 0 017.071 3.999M12 3a8.003 8.003 0 00-7.071 3.999" />
            </svg>
          </div>
        </div>

        <h1 className="text-2xl font-bold text-gray-800">OCMIS</h1>
        <p className="text-sm text-gray-500">OurKanisa Church Management Information System</p>

        {status === 'checking' && (
          <div className="space-y-3">
            <div className="flex justify-center">
              <div className="animate-spin rounded-full h-10 w-10 border-4 border-primary-200 border-t-primary-600" />
            </div>
            <p className="text-gray-600 font-medium">Starting backend server...</p>
            <p className="text-xs text-gray-400">Attempt {attempts} of 30</p>
          </div>
        )}

        {status === 'timeout' && (
          <div className="space-y-4">
            <div className="w-14 h-14 mx-auto rounded-full bg-amber-100 flex items-center justify-center">
              <svg className="w-7 h-7 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
              </svg>
            </div>
            <p className="text-gray-700 font-medium">Backend server is taking longer than expected</p>
            <p className="text-xs text-gray-400">Please ensure PostgreSQL is running and accessible</p>
            <button
              onClick={handleRetry}
              className="w-full py-2.5 px-4 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-medium transition-colors"
            >
              Retry Connection
            </button>
          </div>
        )}

        {status === 'error' && (
          <div className="space-y-4">
            <div className="w-14 h-14 mx-auto rounded-full bg-red-100 flex items-center justify-center">
              <svg className="w-7 h-7 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126z" />
              </svg>
            </div>
            <p className="text-gray-700 font-medium">Failed to connect to backend</p>
            <button
              onClick={handleRetry}
              className="w-full py-2.5 px-4 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-medium transition-colors"
            >
              Retry Connection
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
