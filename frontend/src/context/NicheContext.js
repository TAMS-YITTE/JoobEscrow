'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { instances, defaultInstance } from '../config/instances';
import { useParams, usePathname } from 'next/navigation';

const NicheContext = createContext();

export function NicheProvider({ children }) {
  const params = useParams();
  const pathname = usePathname();
  
  // Extract niche from URL (e.g. /influence/contracts -> influence)
  // If no params (e.g. maybe on a custom 404), fallback to default
  let currentSlug = defaultInstance;
  if (params && params.niche) {
    currentSlug = params.niche;
  } else if (pathname) {
    const parts = pathname.split('/').filter(Boolean);
    if (parts.length > 0 && instances[parts[0]]) {
      currentSlug = parts[0];
    }
  }

  // Ensure slug exists in config, otherwise fallback
  const activeNiche = instances[currentSlug] || instances[defaultInstance];

  return (
    <NicheContext.Provider value={activeNiche}>
      <div className={`min-h-screen text-white font-sans ${activeNiche.theme.bg} transition-colors duration-300`}>
        {children}
      </div>
    </NicheContext.Provider>
  );
}

export function useNiche() {
  const context = useContext(NicheContext);
  if (!context) {
    throw new Error('useNiche must be used within a NicheProvider');
  }
  return context;
}
