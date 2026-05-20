'use client'

import { useEffect } from 'react'
import { VERSION } from '@/lib/version'

export default function OfflinePage() {
  useEffect(() => {
    const timeoutIds: ReturnType<typeof setTimeout>[] = []

    const configs = [
      { id: 'orb-m1', keyframe: 'orbShoot1', duration: '5.2s', initialDelay: 600,  minDwell: 5000,  maxDwell: 15000 },
      { id: 'orb-m2', keyframe: 'orbShoot2', duration: '3.8s', initialDelay: 2500, minDwell: 8000,  maxDwell: 20000 },
      { id: 'orb-m3', keyframe: 'orbShoot3', duration: '6.5s', initialDelay: 5000, minDwell: 6000,  maxDwell: 18000 },
    ]

    function fire(el: HTMLElement, keyframe: string, duration: string, minDwell: number, maxDwell: number) {
      el.style.animation = 'none'
      void el.offsetWidth
      el.style.animation = `${keyframe} ${duration} ease-in forwards`
      
      const onEnd = () => {
        el.removeEventListener('animationend', onEnd)
        el.style.animation = 'none'
        const dwell = minDwell + Math.random() * (maxDwell - minDwell)
        const id = setTimeout(() => fire(el, keyframe, duration, minDwell, maxDwell), dwell)
        timeoutIds.push(id)
      }
      el.addEventListener('animationend', onEnd)
    }

    configs.forEach(({ id, keyframe, duration, initialDelay, minDwell, maxDwell }) => {
      const el = document.getElementById(id)
      if (!el) return
      const tid = setTimeout(() => fire(el, keyframe, duration, minDwell, maxDwell), initialDelay)
      timeoutIds.push(tid)
    })

    return () => { timeoutIds.forEach(clearTimeout) }
  }, [])

  return (
    <>
      <style>{`
        .orb-offline-container {
          position: fixed;
          inset: 0;
          z-index: 99999;
          background: radial-gradient(circle at center, #142214 0%, #080d08 100%);
          overflow: hidden;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 40px 24px;
          text-align: center;
        }

        /* ── Meteors & Twinkling Starfield ── */
        .orb-meteor {
          position: fixed;
          height: 1px;
          border-radius: 1px;
          background: linear-gradient(to right, #ffffff 0%, rgba(140, 175, 140, 0.8) 30%, transparent 100%);
          pointer-events: none;
          z-index: 3;
          opacity: 0;
        }
        #orb-m1 { top: 5vh;  right: 0; width: 150px; }
        #orb-m2 { top: 25vh; right: 0; width: 90px; }
        #orb-m3 { top: 12vh; right: 0; width: 180px; }

        @keyframes orbShoot1 {
          0% { transform: rotate(-35deg) translateX(0); opacity: 0; }
          4% { opacity: 0.8; }
          80% { opacity: 0.4; }
          100% { transform: rotate(-35deg) translateX(-280vw); opacity: 0; }
        }
        @keyframes orbShoot2 {
          0% { transform: rotate(-40deg) translateX(0); opacity: 0; }
          5% { opacity: 0.9; }
          75% { opacity: 0.3; }
          100% { transform: rotate(-40deg) translateX(-240vw); opacity: 0; }
        }
        @keyframes orbShoot3 {
          0% { transform: rotate(-32deg) translateX(0); opacity: 0; }
          3% { opacity: 0.85; }
          85% { opacity: 0.5; }
          100% { transform: rotate(-32deg) translateX(-320vw); opacity: 0; }
        }

        .orb-star {
          position: fixed;
          border-radius: 50%;
          background: #8caf8c;
          pointer-events: none;
          z-index: 2;
        }
        @keyframes orbTwinkleA { 0%, 100% { opacity: 0.15; } 50% { opacity: 0.9; } }
        @keyframes orbTwinkleB { 0%, 100% { opacity: 0.4; } 50% { opacity: 1; } }
        @keyframes orbTwinkleC { 0%, 100% { opacity: 0.1; } 50% { opacity: 0.75; } }

        .orb-sa { animation: orbTwinkleA 3.2s ease-in-out infinite; }
        .orb-sb { animation: orbTwinkleB 4.1s ease-in-out infinite 0.7s; }
        .orb-sc { animation: orbTwinkleC 2.8s ease-in-out infinite 1.4s; }
        .orb-sd { animation: orbTwinkleA 3.7s ease-in-out infinite 2.1s; }
        .orb-se { animation: orbTwinkleB 5.0s ease-in-out infinite 0.3s; }
        .orb-sf { animation: orbTwinkleC 3.5s ease-in-out infinite 1.8s; }
        .orb-sg { animation: orbTwinkleA 4.3s ease-in-out infinite 0.9s; }
        .orb-sh { animation: orbTwinkleB 2.5s ease-in-out infinite 1.1s; }
        .orb-si { animation: orbTwinkleC 4.8s ease-in-out infinite 0.5s; }
        .orb-sj { animation: orbTwinkleA 3.1s ease-in-out infinite 2.5s; }

        /* ── Rotating Planetary System ── */
        .orb-space-bg {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          width: min(500px, 92vw);
          aspect-ratio: 1;
          opacity: 0.15;
          pointer-events: none;
          z-index: 0;
        }
        .orb-space-bg svg {
          width: 100%;
          height: 100%;
        }

        .orb-spin-cw {
          transform-box: fill-box;
          transform-origin: center center;
          animation: orbRotateCw 40s linear infinite;
        }
        .orb-spin-ccw {
          transform-box: fill-box;
          transform-origin: center center;
          animation: orbRotateCcw 30s linear infinite;
        }
        .orb-spin-fast-cw {
          transform-box: fill-box;
          transform-origin: center center;
          animation: orbRotateCw 20s linear infinite;
        }

        @keyframes orbRotateCw { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes orbRotateCcw { from { transform: rotate(0deg); } to { transform: rotate(-360deg); } }

        /* ── Content Layout ── */
        .orb-content-layer {
          position: relative;
          z-index: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          max-width: 420px;
        }

        .orb-pulsing-icon {
          margin-bottom: 20px;
          animation: orbStarPulse 3s ease-in-out infinite;
        }
        @keyframes orbStarPulse {
          0%, 100% { opacity: 0.65; transform: scale(1); }
          50% { opacity: 1; transform: scale(1.15); }
        }

        .orb-wordmark {
          font-family: var(--font-ui), sans-serif;
          font-weight: 500;
          font-size: 12px;
          letter-spacing: 0.28em;
          text-transform: uppercase;
          color: #8caf8c;
          margin-bottom: 32px;
          opacity: 0;
          animation: orbFadeUp 0.8s ease forwards 0.2s;
        }

        .orb-headline {
          font-family: var(--font-display), serif;
          font-size: 44px;
          font-weight: 300;
          color: #e8ede8;
          line-height: 1.15;
          letter-spacing: -0.01em;
          margin-bottom: 20px;
          opacity: 0;
          animation: orbFadeUp 0.9s ease forwards 0.5s;
        }

        .orb-body-text {
          font-family: var(--font-ui), sans-serif;
          font-size: 15px;
          font-weight: 300;
          color: #a3b5a3;
          line-height: 1.7;
          margin-bottom: 24px;
          opacity: 0;
          animation: orbFadeUp 0.9s ease forwards 0.8s;
        }

        .orb-divider {
          width: 32px;
          height: 1px;
          background: rgba(140, 175, 140, 0.3);
          margin: 16px auto;
          opacity: 0;
          animation: orbFadeIn 1s ease forwards 1.0s;
        }

        .orb-caveat {
          font-family: var(--font-ui), sans-serif;
          font-size: 13px;
          font-weight: 300;
          font-style: italic;
          color: #7b8e7b;
          line-height: 1.6;
          opacity: 0;
          animation: orbFadeUp 0.9s ease forwards 1.1s;
        }

        .orb-status {
          margin-top: 40px;
          display: inline-flex;
          align-items: center;
          gap: 8px;
          font-family: var(--font-ui), sans-serif;
          font-size: 11px;
          font-weight: 500;
          letter-spacing: 0.16em;
          text-transform: uppercase;
          color: #8caf8c;
          border: 1px solid rgba(140, 175, 140, 0.25);
          border-radius: 20px;
          padding: 6px 14px;
          opacity: 0;
          animation: orbFadeUp 0.9s ease forwards 1.3s;
        }

        .orb-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: #8caf8c;
          box-shadow: 0 0 8px #8caf8c;
          animation: orbDotPulse 2s ease-in-out infinite;
        }
        @keyframes orbDotPulse {
          0%, 100% { opacity: 0.4; transform: scale(1); }
          50% { opacity: 1; transform: scale(1.4); }
        }

        .orb-version-footer {
          position: fixed;
          bottom: 18px;
          left: 18px;
          font-family: var(--font-ui), sans-serif;
          font-size: 11px;
          color: rgba(232, 237, 232, 0.35);
          letter-spacing: 0.05em;
          z-index: 10;
          white-space: nowrap;
        }

        @keyframes orbFadeUp {
          from { opacity: 0; transform: translateY(12px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes orbFadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
      `}</style>

      <div className="orb-offline-container">
        {/* Meteors */}
        <div id="orb-m1" className="orb-meteor" />
        <div id="orb-m2" className="orb-meteor" />
        <div id="orb-m3" className="orb-meteor" />

        {/* Twinkling Starfield */}
        <span className="orb-star orb-sa" style={{ top: '4vh',  left: '8vw',   width: '5px', height: '5px' }} />
        <span className="orb-star orb-sb" style={{ top: '3vh',  left: '20vw',  width: '3px', height: '3px' }} />
        <span className="orb-star orb-sc" style={{ top: '8vh',  left: '35vw',  width: '4px', height: '4px' }} />
        <span className="orb-star orb-sd" style={{ top: '4vh',  left: '55vw',  width: '3px', height: '3px' }} />
        <span className="orb-star orb-se" style={{ top: '7vh',  left: '70vw',  width: '5px', height: '5px' }} />
        <span className="orb-star orb-sf" style={{ top: '2vh',  left: '85vw',  width: '3px', height: '3px' }} />
        <span className="orb-star orb-sg" style={{ top: '10vh', left: '94vw',  width: '4px', height: '4px' }} />
        <span className="orb-star orb-sh" style={{ top: '22vh', left: '4vw',   width: '3px', height: '3px' }} />
        <span className="orb-star orb-si" style={{ top: '38vh', left: '3vw',   width: '2px', height: '2px' }} />
        <span className="orb-star orb-sj" style={{ top: '56vh', left: '5vw',   width: '4px', height: '4px' }} />
        <span className="orb-star orb-sa" style={{ top: '73vh', left: '4vw',   width: '3px', height: '3px' }} />
        <span className="orb-star orb-sb" style={{ top: '88vh', left: '7vw',   width: '4px', height: '4px' }} />
        <span className="orb-star orb-sc" style={{ top: '20vh', left: '95vw',  width: '4px', height: '4px' }} />
        <span className="orb-star orb-sd" style={{ top: '39vh', left: '96vw',  width: '3px', height: '3px' }} />
        <span className="orb-star orb-se" style={{ top: '59vh', left: '94vw',  width: '4px', height: '4px' }} />
        <span className="orb-star orb-sf" style={{ top: '78vh', left: '93vw',  width: '5px', height: '5px' }} />
        <span className="orb-star orb-sg" style={{ top: '90vh', left: '15vw',  width: '3px', height: '3px' }} />
        <span className="orb-star orb-sh" style={{ top: '94vh', left: '39vw',  width: '4px', height: '4px' }} />
        <span className="orb-star orb-si" style={{ top: '92vh', left: '63vw',  width: '3px', height: '3px' }} />
        <span className="orb-star orb-sj" style={{ top: '89vh', left: '85vw',  width: '4px', height: '4px' }} />
        <span className="orb-star orb-sc" style={{ top: '19vh', left: '43vw',  width: '3px', height: '3px' }} />
        <span className="orb-star orb-se" style={{ top: '29vh', left: '25vw',  width: '2px', height: '2px' }} />
        <span className="orb-star orb-sg" style={{ top: '33vh', left: '73vw',  width: '3px', height: '3px' }} />
        <span className="orb-star orb-si" style={{ top: '63vh', left: '29vw',  width: '2px', height: '2px' }} />
        <span className="orb-star orb-sb" style={{ top: '69vh', left: '59vw',  width: '3px', height: '3px' }} />
        <span className="orb-star orb-sd" style={{ top: '79vh', left: '45vw',  width: '2px', height: '2px' }} />

        {/* Rotating Orbits Background */}
        <div className="orb-space-bg" aria-hidden="true">
          <svg viewBox="0 0 500 500" fill="none" xmlns="http://www.w3.org/2000/svg">
            {/* Outer dotted ring - CW */}
            <g className="orb-spin-cw">
              <circle cx="250" cy="250" r="180" stroke="#547054" strokeWidth="1.5" strokeDasharray="3 8" />
            </g>
            {/* Middle solid ring - CCW with a planet */}
            <g className="orb-spin-ccw">
              <circle cx="250" cy="250" r="120" stroke="#8caf8c" strokeWidth="1" opacity="0.6" />
              <circle cx="250" cy="130" r="6" fill="#b8d0b8" />
            </g>
            {/* Inner dashed ring - CW with a planet */}
            <g className="orb-spin-fast-cw">
              <circle cx="250" cy="250" r="70" stroke="#e8ede8" strokeWidth="1.5" strokeDasharray="6 6" opacity="0.8" />
              <circle cx="180" cy="250" r="4" fill="#e8ede8" />
            </g>
            {/* Pulsing center Orb */}
            <defs>
              <radialGradient id="orbGlow" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#ffffff" stopOpacity="1" />
                <stop offset="40%" stopColor="#d4e4d4" stopOpacity="0.8" />
                <stop offset="80%" stopColor="#b8d0b8" stopOpacity="0.3" />
                <stop offset="100%" stopColor="#b8d0b8" stopOpacity="0" />
              </radialGradient>
            </defs>
            <circle cx="250" cy="250" r="32" fill="url(#orbGlow)" />
          </svg>
        </div>

        {/* Content Panel */}
        <main className="orb-content-layer">
          <svg className="orb-pulsing-icon" width="24" height="24" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
            <polygon points="12,1 14.5,8.5 22,11 14.5,13.5 12,21 9.5,13.5 2,11 9.5,8.5" fill="#8caf8c" />
          </svg>
          
          <div className="orb-wordmark">Orb</div>
          
          <h1 className="orb-headline">Orbit suspended</h1>
          
          <p className="orb-body-text">
            Orb needs an active connection to synchronize your backlog and converse. 
            We will restore your orbit as soon as your connection returns.
          </p>
          
          <div className="orb-divider" />
          
          <p className="orb-caveat">
            If you were mid-conversation or editing a task, those changes are safe in memory and will sync when reconnected.
          </p>
          
          <div className="orb-status">
            <div className="orb-dot" />
            Offline
          </div>
        </main>

        <div className="orb-version-footer">v{VERSION}</div>
      </div>
    </>
  )
}
