import { useEffect } from 'react';

function Launcher() {
  useEffect(() => {
    const timer = setTimeout(() => {
      window.location.hash = '#/dashboard';
    }, 950);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div
      className="h-screen w-screen flex flex-col items-center justify-center m-0 overflow-hidden relative"
      style={{ background: '#100D1B' }}
    >
      <style>{`
        @keyframes pulse-ring {
          0%   { transform: scale(0.85); opacity: 0.5; }
          100% { transform: scale(1.55); opacity: 0; }
        }
        .launcher-pulse {
          animation: pulse-ring 1.8s cubic-bezier(0.215, 0.61, 0.355, 1) infinite;
        }
        .launcher-glass {
          background: rgba(25, 19, 41, 0.75);
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
          border: 1px solid rgba(255, 107, 107, 0.14);
        }
        @keyframes loadingBar {
          0%   { width: 0%; }
          60%  { width: 75%; }
          100% { width: 100%; }
        }
        .launcher-bar {
          animation: loadingBar 0.88s ease-out forwards;
        }
        @keyframes floatIn {
          from { opacity: 0; transform: translateY(14px) scale(0.95); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
        .launcher-content {
          animation: floatIn 0.5s cubic-bezier(0.16, 1, 0.3, 1) both;
        }
      `}</style>

      {/* Ambient sunset glows */}
      <div
        className="absolute pointer-events-none"
        style={{
          width: '480px', height: '480px',
          top: '50%', left: '50%',
          transform: 'translate(-50%, -50%)',
          background: 'radial-gradient(circle, rgba(255,107,107,0.16) 0%, rgba(255,79,163,0.10) 40%, transparent 70%)',
          filter: 'blur(60px)',
        }}
      />
      <div
        className="absolute pointer-events-none"
        style={{
          width: '300px', height: '300px',
          top: '20%', right: '15%',
          background: 'radial-gradient(circle, rgba(255,159,67,0.10) 0%, transparent 70%)',
          filter: 'blur(50px)',
        }}
      />

      {/* Main panel */}
      <div className="launcher-glass launcher-content p-10 rounded-3xl flex flex-col items-center justify-center shadow-2xl relative z-10 w-80">

        {/* Logo with pulse ring */}
        <div className="relative flex items-center justify-center mb-6">
          <div
            className="absolute inset-0 rounded-2xl launcher-pulse"
            style={{ background: 'rgba(255, 107, 107, 0.25)' }}
          />
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center shadow-lg relative z-10"
            style={{
              background: 'linear-gradient(135deg, #FF6B6B 0%, #FF4FA3 50%, #FF9F43 100%)',
              boxShadow: '0 8px 32px rgba(255, 107, 107, 0.40)',
            }}
          >
            {/* Flame icon */}
            <svg width="28" height="28" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path
                d="M10 2C7.5 5.5 7 8 9 10C7 8.5 5 10.5 7.5 13C6 12.5 5.5 14.5 8 16C9.5 16.8 12 16.8 13.5 16C16.5 14.5 15.5 12 14 13C16.5 10.5 14 8 12 10C13.5 7.5 12 4.5 10 2Z"
                fill="white"
              />
            </svg>
          </div>
        </div>

        {/* Brand name */}
        <h1
          className="text-2xl font-extrabold mb-1 tracking-tight"
          style={{
            background: 'linear-gradient(135deg, #FF6B6B 0%, #FF4FA3 50%, #FF9F43 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}
        >
          InternWin
        </h1>
        <p className="text-[11px] font-semibold tracking-widest text-muted-text uppercase mb-5">
          Your next chapter starts here.
        </p>

        {/* Loading bar */}
        <div
          className="w-full rounded-full overflow-hidden relative"
          style={{ height: '3px', background: 'rgba(216, 204, 255, 0.10)' }}
        >
          <div
            className="launcher-bar absolute left-0 top-0 h-full rounded-full"
            style={{ background: 'linear-gradient(90deg, #FF6B6B, #FF4FA3, #FF9F43)' }}
          />
        </div>
        <p className="text-[10px] font-bold tracking-widest uppercase mt-3" style={{ color: 'rgba(166,156,184,0.5)' }}>
          Initializing workspace…
        </p>
      </div>
    </div>
  );
}

export default Launcher;
