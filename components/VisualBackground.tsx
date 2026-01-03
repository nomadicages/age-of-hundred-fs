
import React, { useEffect, useRef } from 'react';
import { ThemeType } from '../types';

interface Props {
  percentage: number;
  theme?: ThemeType;
}

const VisualBackground: React.FC<Props> = ({ percentage, theme = 'standard' }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const percentageRef = useRef(percentage);
  const themeRef = useRef(theme);
  const mouseRef = useRef({ x: 0, y: 0 });

  useEffect(() => {
    percentageRef.current = percentage;
  }, [percentage]);

  useEffect(() => {
    themeRef.current = theme;
  }, [theme]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      mouseRef.current = {
        x: (e.clientX / window.innerWidth) - 0.5,
        y: (e.clientY / window.innerHeight) - 0.5
      };
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) return;

    let animationFrameId: number;
    let particles: Particle[] = [];
    let starfield: { x: number, y: number, z: number, size: number, brightness: number, pulse: number }[] = [];
    
    const HUES = [
      { h1: 191, h2: 210 }, { h1: 89, h2: 120 }, { h1: 27, h2: 45 },
      { h1: 341, h2: 10 }, { h1: 300, h2: 280 }, { h1: 180, h2: 200 },
      { h1: 230, h2: 250 }, { h1: 350, h2: 15 }, { h1: 280, h2: 320 },
      { h1: 45, h2: 55 }
    ];
    const SHAPES = [0, 2, 1, 3, 4, 5, 0, 5, 4, 3];
    const SPEEDS = [0.4, 0.8, 1.2, 0.7, 1.5, 0.6, 0.3, 0.5, 2.0, 0.2];
    const SIZES = [1.0, 1.2, 0.8, 1.5, 1.0, 2.0, 0.6, 2.5, 0.5, 4.0];

    class Particle {
      x: number;
      y: number;
      sizeMult: number;
      baseSpeedX: number;
      baseSpeedY: number;
      hueOffset: number;
      opacity: number;
      margin: number;

      constructor() {
        this.margin = 100;
        this.x = Math.random() * (canvas!.width + this.margin * 2) - this.margin;
        this.y = Math.random() * (canvas!.height + this.margin * 2) - this.margin;
        this.sizeMult = Math.random() * 0.5 + 0.75;
        const angle = Math.random() * Math.PI * 2;
        this.baseSpeedX = Math.cos(angle);
        this.baseSpeedY = Math.sin(angle);
        this.hueOffset = Math.random() > 0.5 ? 0 : 1;
        this.opacity = 0.15 + Math.random() * 0.45;
      }

      update(speedMult: number) {
        this.x += this.baseSpeedX * speedMult;
        this.y += this.baseSpeedY * speedMult;
        if (this.x > canvas!.width + this.margin) this.x = -this.margin;
        else if (this.x < -this.margin) this.x = canvas!.width + this.margin;
        if (this.y > canvas!.height + this.margin) this.y = -this.margin;
        else if (this.y < -this.margin) this.y = canvas!.height + this.margin;
      }

      draw(stage: number) {
        if (!ctx) return;
        const currentHue = HUES[stage];
        const hue = this.hueOffset === 0 ? currentHue.h1 : currentHue.h2;
        const size = SIZES[stage] * this.sizeMult * 2.5;
        const shape = SHAPES[stage];
        ctx.fillStyle = `hsla(${hue}, 90%, 60%, ${this.opacity})`;
        ctx.strokeStyle = `hsla(${hue}, 90%, 60%, ${this.opacity})`;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        switch(shape) {
          case 0: ctx.arc(this.x, this.y, size, 0, Math.PI * 2); ctx.fill(); break;
          case 1: ctx.fillRect(this.x - size, this.y - size, size * 2, size * 2); break;
          case 2: ctx.moveTo(this.x, this.y - size); ctx.lineTo(this.x + size, this.y + size); ctx.lineTo(this.x - size, this.y + size); ctx.closePath(); ctx.fill(); break;
          case 3: ctx.moveTo(this.x, this.y - size * 1.5); ctx.lineTo(this.x + size, this.y); ctx.lineTo(this.x, this.y + size * 1.5); ctx.lineTo(this.x - size, this.y); ctx.closePath(); ctx.fill(); break;
          case 4: ctx.fillRect(this.x - size, this.y - 0.5, size * 2, 1); ctx.fillRect(this.x - 0.5, this.y - size, 1, size * 2); break;
          case 5: ctx.arc(this.x, this.y, size, 0, Math.PI * 2); ctx.stroke(); break;
        }
      }
    }

    const initParticles = () => {
      particles = [];
      const density = 15000;
      const count = Math.floor((window.innerWidth * window.innerHeight) / density);
      for (let i = 0; i < count; i++) particles.push(new Particle());
      
      starfield = [];
      for (let i = 0; i < 600; i++) {
        starfield.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          z: Math.random() * 0.4 + 0.1,
          size: Math.random() * 1.2 + 0.3,
          brightness: Math.random() * 0.5 + 0.5,
          pulse: Math.random() * Math.PI * 2
        });
      }
    };

    const drawAurora = (stageHue: {h1: number, h2: number}, time: number) => {
      const { x, y } = mouseRef.current;
      
      // Multi-layered light curtains
      ctx.globalCompositeOperation = 'screen';
      
      for (let layer = 0; layer < 3; layer++) {
        const h = layer % 2 === 0 ? stageHue.h1 : stageHue.h2;
        const opacity = 0.08 - layer * 0.02;
        const layerTime = time * (0.4 + layer * 0.2);
        
        ctx.beginPath();
        ctx.moveTo(-100, canvas.height + 100);
        
        // Use segments to draw a waving organic ribbon
        const segments = 24;
        const step = (canvas.width + 200) / segments;
        
        for (let i = 0; i <= segments; i++) {
          const px = -100 + i * step;
          const wave1 = Math.sin(i * 0.3 + layerTime) * 60;
          const wave2 = Math.cos(i * 0.1 - layerTime * 0.5) * 40;
          const py = (canvas.height * 0.6) + wave1 + wave2 + (layer * 80) - (y * 200 * (layer + 1));
          
          if (i === 0) ctx.moveTo(px, py);
          else {
            const cp1x = px - step / 2;
            ctx.quadraticCurveTo(cp1x, py, px, py);
          }
        }
        
        ctx.lineTo(canvas.width + 100, canvas.height + 100);
        ctx.lineTo(-100, canvas.height + 100);
        ctx.closePath();
        
        const auroraGrad = ctx.createLinearGradient(0, canvas.height * 0.3, 0, canvas.height);
        auroraGrad.addColorStop(0, 'transparent');
        auroraGrad.addColorStop(0.5, `hsla(${h}, 100%, 60%, ${opacity})`);
        auroraGrad.addColorStop(1, 'transparent');
        
        ctx.fillStyle = auroraGrad;
        ctx.fill();
        
        // Add a "shimmer" stroke to the top edge
        ctx.strokeStyle = `hsla(${h + 10}, 80%, 80%, ${opacity * 0.5})`;
        ctx.lineWidth = 1;
        ctx.stroke();
      }
      
      ctx.globalCompositeOperation = 'source-over';
    };

    const drawPanorama = (stageHue: {h1: number, h2: number}) => {
      const { x, y } = mouseRef.current;
      const time = Date.now() / 2000;
      
      // Cinematic Deep Background
      const bgGrad = ctx.createRadialGradient(
        canvas.width / 2 - x * 200, canvas.height / 2 - y * 200, 0,
        canvas.width / 2, canvas.height / 2, canvas.width
      );
      bgGrad.addColorStop(0, `hsl(${stageHue.h1}, 80%, 4%)`);
      bgGrad.addColorStop(1, '#000');
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Twinkling Starfield with Parallax
      starfield.forEach(star => {
        const sx = (star.x - x * star.z * 150 + canvas.width) % canvas.width;
        const sy = (star.y - y * star.z * 150 + canvas.height) % canvas.height;
        const flicker = Math.sin(time * 2 + star.pulse) * 0.3 + 0.7;
        
        ctx.fillStyle = `rgba(255, 255, 255, ${star.brightness * flicker})`;
        ctx.beginPath();
        ctx.arc(sx, sy, star.size, 0, Math.PI * 2);
        ctx.fill();
        
        // Rare star glow
        if (star.size > 1.1) {
          const glow = ctx.createRadialGradient(sx, sy, 0, sx, sy, star.size * 4);
          glow.addColorStop(0, `rgba(255, 255, 255, ${0.1 * flicker})`);
          glow.addColorStop(1, 'transparent');
          ctx.fillStyle = glow;
          ctx.fill();
        }
      });

      // Render the procedural Aurora
      drawAurora(stageHue, time);

      // Vignette effect for focus
      const vignette = ctx.createRadialGradient(canvas.width / 2, canvas.height / 2, canvas.width * 0.3, canvas.width / 2, canvas.height / 2, canvas.width * 0.8);
      vignette.addColorStop(0, 'transparent');
      vignette.addColorStop(1, 'rgba(0,0,0,0.6)');
      ctx.fillStyle = vignette;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    };

    const animate = () => {
      const currentPct = percentageRef.current;
      const stage = Math.min(Math.floor(currentPct / 10), 9);
      const stageHue = HUES[stage];
      const stageSpeed = SPEEDS[stage];

      if (themeRef.current === 'panorama') {
        drawPanorama(stageHue);
      } else {
        ctx.globalCompositeOperation = 'source-over';
        const grad = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
        grad.addColorStop(0, `hsla(${stageHue.h1}, 70%, 4%, 1)`);
        grad.addColorStop(1, `hsla(${stageHue.h2}, 60%, 2%, 1)`);
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        ctx.globalCompositeOperation = 'screen';
        particles.forEach(p => {
          p.update(stageSpeed);
          p.draw(stage);
        });

        const pulse = Math.sin(Date.now() / 2500) * 15;
        const orbSize = (140 + (currentPct * 3.8) + pulse) * (window.innerWidth / 1920);
        const orbGrad = ctx.createRadialGradient(canvas.width / 2, canvas.height / 2, 0, canvas.width / 2, canvas.height / 2, orbSize);
        orbGrad.addColorStop(0, `hsla(${stageHue.h1}, 100%, 50%, 0.1)`);
        orbGrad.addColorStop(0.5, `hsla(${stageHue.h2}, 100%, 40%, 0.03)`);
        orbGrad.addColorStop(1, 'transparent');
        ctx.fillStyle = orbGrad;
        ctx.beginPath();
        ctx.arc(canvas.width / 2, canvas.height / 2, orbSize, 0, Math.PI * 2);
        ctx.fill();
      }
      
      animationFrameId = requestAnimationFrame(animate);
    };

    const handleResize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      initParticles();
    };

    window.addEventListener('resize', handleResize);
    handleResize();
    animate();

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return <canvas ref={canvasRef} className="fixed inset-0 w-full h-full pointer-events-none" />;
};

export default VisualBackground;
