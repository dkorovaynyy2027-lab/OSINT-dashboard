'use client';

import { useEffect, useRef } from 'react';

export function BackgroundOrbs() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let W = window.innerWidth;
    let H = window.innerHeight;
    const orbs: { x: number, y: number, r: number, dx: number, dy: number, alpha: number }[] = [];

    const resize = () => {
      W = canvas.width = window.innerWidth;
      H = canvas.height = window.innerHeight;
    };

    window.addEventListener('resize', resize);
    resize();

    for (let i = 0; i < 5; i++) {
      orbs.push({
        x: Math.random() * W,
        y: Math.random() * H,
        r: 200 + Math.random() * 260,
        dx: (Math.random() - 0.5) * 0.35,
        dy: (Math.random() - 0.5) * 0.35,
        alpha: 0.04 + Math.random() * 0.05
      });
    }

    const draw = () => {
      ctx.clearRect(0, 0, W, H);
      orbs.forEach(o => {
        const g = ctx.createRadialGradient(o.x, o.y, 0, o.x, o.y, o.r);
        g.addColorStop(0, `rgba(255,255,255,${o.alpha})`);
        g.addColorStop(1, 'rgba(255,255,255,0)');
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(o.x, o.y, o.r, 0, Math.PI * 2);
        ctx.fill();
        
        o.x += o.dx;
        o.y += o.dy;
        if (o.x < -o.r || o.x > W + o.r) o.dx *= -1;
        if (o.y < -o.r || o.y > H + o.r) o.dy *= -1;
      });
      requestAnimationFrame(draw);
    };

    draw();

    return () => window.removeEventListener('resize', resize);
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 w-full h-full pointer-events-none z-0"
    />
  );
}
