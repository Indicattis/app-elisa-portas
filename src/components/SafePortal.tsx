
import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

interface SafePortalProps {
  children: React.ReactNode;
  container?: HTMLElement;
}

export function SafePortal({ children, container }: SafePortalProps) {
  const [portalContainer, setPortalContainer] = useState<HTMLElement | null>(null);

  useEffect(() => {
    const targetContainer = container || document.body;
    
    // Verificar se o container existe e está no DOM
    if (targetContainer && document.contains(targetContainer)) {
      setPortalContainer(targetContainer);
    } else {
      console.warn('Portal container not found or not in DOM');
    }

    return () => {
      setPortalContainer(null);
    };
  }, [container]);

  if (!portalContainer) {
    return null;
  }

  try {
    return createPortal(children, portalContainer);
  } catch (error) {
    console.error('Error creating portal:', error);
    return null;
  }
}
