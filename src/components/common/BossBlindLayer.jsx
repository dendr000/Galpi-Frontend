// src/components/common/BossBlindLayer.jsx
import React, { useEffect, useRef } from 'react';
import useSettingStore from '../../store/useSettingStore';
import Icon from './icons/Icon';

const BossBlindLayer = () => {
  const { isBlindActive, blindTheme } = useSettingStore();
  const canvasRef = useRef(null);

  useEffect(() => {
    if (!isBlindActive || blindTheme === 'blackout') return;
    const ctx = canvasRef.current.getContext('2d');
    let frameId;
    const resize = () => { canvasRef.current.width = window.innerWidth; canvasRef.current.height = window.innerHeight; };
    window.addEventListener('resize', resize); resize();

    if (blindTheme === 'matrix') {
      const chars = '0123456789'.split('');
      const drops = Array(Math.floor(window.innerWidth / 16) + 1).fill(0).map(() => Math.random() * -100);
      let count = 0;
      const loop = () => {
        frameId = requestAnimationFrame(loop);
        if (count++ % 4 !== 0) return;
        ctx.fillStyle = 'rgba(0, 0, 0, 0.08)'; ctx.fillRect(0, 0, window.innerWidth, window.innerHeight);
        ctx.fillStyle = '#0F0'; ctx.font = '16px monospace';
        drops.forEach((y, i) => {
          ctx.fillText(chars[Math.floor(Math.random() * chars.length)], i * 16, y * 16);
          if (y * 16 > window.innerHeight && Math.random() > 0.975) drops[i] = 0;
          drops[i]++;
        });
      }; loop();
    } else {
      const p = Array(Math.min(60, Math.floor(window.innerWidth / 25))).fill(0).map((_, i) => ({
        x: Math.random() * window.innerWidth, y: Math.random() * window.innerHeight,
        r: Math.random() * 80 + 40, vx: (Math.random() - 0.5) * 0.8, vy: (Math.random() - 0.5) * 0.8,
        c: i % 2 === 0 ? 'rgba(59, 91, 219, 0.04)' : 'rgba(16, 185, 129, 0.03)'
      }));
      const loop = () => {
        frameId = requestAnimationFrame(loop);
        ctx.fillStyle = 'rgba(11, 15, 25, 0.08)'; ctx.fillRect(0, 0, window.innerWidth, window.innerHeight);
        p.forEach(pt => {
          pt.x += pt.vx; pt.y += pt.vy;
          if (pt.x < 0 || pt.x > window.innerWidth) pt.vx *= -1;
          if (pt.y < 0 || pt.y > window.innerHeight) pt.vy *= -1;
          const g = ctx.createRadialGradient(pt.x, pt.y, 0, pt.x, pt.y, pt.r);
          g.addColorStop(0, pt.c); g.addColorStop(1, 'transparent');
          ctx.fillStyle = g; ctx.beginPath(); ctx.arc(pt.x, pt.y, pt.r, 0, Math.PI * 2); ctx.fill();
        });
      }; loop();
    }
    return () => { window.removeEventListener('resize', resize); cancelAnimationFrame(frameId); };
  }, [isBlindActive, blindTheme]);

  if (!isBlindActive) return null;
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 9999999, background: blindTheme === 'blackout' ? '#000' : '#0b0f19' }}>
      {blindTheme !== 'blackout' && <canvas ref={canvasRef} style={{ display: 'block', width: '100%', height: '100%' }} />}
      <div style={{ position: 'absolute', bottom: '30px', left: '50%', transform: 'translateX(-50%)', color: 'rgba(255,255,255,0.25)', fontWeight: 'bold' }}><Icon name="lock" lead /> SECURITY BLIND ACTIVE</div>
    </div>
  );
};
export default BossBlindLayer;