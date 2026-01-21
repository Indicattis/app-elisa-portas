import { useEffect, useRef } from 'react';

interface Particle {
  x: number;
  y: number;
  z: number;
  size: number;
  speed: number;
  opacity: number;
}

interface SpaceParticlesProps {
  slowMode?: boolean;
}

export function SpaceParticles({ slowMode = false }: SpaceParticlesProps) {
  const slowModeRef = useRef(slowMode);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationId: number;
    let particles: Particle[] = [];
    const particleCount = 150;

    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    const createParticle = (): Particle => ({
      x: Math.random() * canvas.width - canvas.width / 2,
      y: Math.random() * canvas.height - canvas.height / 2,
      z: Math.random() * 1000 + 200,
      size: Math.random() * 2 + 0.5,
      speed: Math.random() * 0.5 + 0.2,
      opacity: Math.random() * 0.5 + 0.3
    });

    const initParticles = () => {
      particles = [];
      for (let i = 0; i < particleCount; i++) {
        particles.push(createParticle());
      }
    };

    const drawParticle = (particle: Particle) => {
      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2;
      
      // Perspective projection
      const scale = 400 / particle.z;
      const screenX = centerX + particle.x * scale;
      const screenY = centerY + particle.y * scale;
      const screenSize = particle.size * scale;

      // Only draw if on screen
      if (screenX < 0 || screenX > canvas.width || screenY < 0 || screenY > canvas.height) {
        return;
      }

      // Fade based on depth
      const depthOpacity = Math.min(1, (1000 - particle.z) / 800) * particle.opacity;
      
      // Draw glow
      const gradient = ctx.createRadialGradient(
        screenX, screenY, 0,
        screenX, screenY, screenSize * 3
      );
      gradient.addColorStop(0, `rgba(59, 130, 246, ${depthOpacity})`);
      gradient.addColorStop(0.4, `rgba(59, 130, 246, ${depthOpacity * 0.4})`);
      gradient.addColorStop(1, 'rgba(59, 130, 246, 0)');
      
      ctx.beginPath();
      ctx.arc(screenX, screenY, screenSize * 3, 0, Math.PI * 2);
      ctx.fillStyle = gradient;
      ctx.fill();

      // Draw core
      ctx.beginPath();
      ctx.arc(screenX, screenY, screenSize, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(147, 197, 253, ${depthOpacity})`;
      ctx.fill();
    };

    const animate = () => {
      ctx.fillStyle = '#000000';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const speedMultiplier = slowModeRef.current ? 0.15 : 1;

      particles.forEach((particle) => {
        // Move towards viewer with speed multiplier
        particle.z -= particle.speed * speedMultiplier;

        // Reset particle when it passes the viewer
        if (particle.z < 1) {
          particle.z = 1000;
          particle.x = Math.random() * canvas.width - canvas.width / 2;
          particle.y = Math.random() * canvas.height - canvas.height / 2;
        }

        drawParticle(particle);
      });

      animationId = requestAnimationFrame(animate);
    };

    resizeCanvas();
    initParticles();
    
    // Initial clear
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    animate();

    window.addEventListener('resize', () => {
      resizeCanvas();
      ctx.fillStyle = '#000000';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    });

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener('resize', resizeCanvas);
    };
  }, []);

  // Update ref when prop changes
  useEffect(() => {
    slowModeRef.current = slowMode;
  }, [slowMode]);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 z-0"
      style={{ background: '#000000' }}
    />
  );
}
