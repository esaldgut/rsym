'use client';

import { ReactNode } from 'react';

interface MainContentWrapperProps {
  children: ReactNode;
}

export function MainContentWrapper({ children }: MainContentWrapperProps) {
  // No aplicamos padding global - cada página maneja su propio espaciado
  // Esto permite que las páginas con hero sections puedan extenderse hasta arriba
  // y las páginas administrativas pueden agregar su propio padding
  
  return (
    <main>
      {children}
    </main>
  );
}