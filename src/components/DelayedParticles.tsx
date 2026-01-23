import { useState, useEffect } from 'react';
import { SpaceParticles } from './SpaceParticles';

interface DelayedParticlesProps {
  delay?: number;
  fadeDuration?: number;
}

export function DelayedParticles({ delay = 5000, fadeDuration = 2000 }: DelayedParticlesProps) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setShow(true), delay);
    return () => clearTimeout(timer);
  }, [delay]);

  return (
    <div 
      className="fixed inset-0 z-0"
      style={{ 
        opacity: show ? 1 : 0,
        transition: `opacity ${fadeDuration}ms ease-out`
      }}
    >
      <SpaceParticles slowMode />
    </div>
  );
}
