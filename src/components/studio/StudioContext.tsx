'use client';

/**
 * StudioContext — lightweight ambient flag.
 *
 * When the user is inside the Content Studio workspace, generative-UI cards
 * (PptxGenerationCard, DocumentGenerationCard) check this context to skip
 * their inline preview, since the workspace already shows the artifact in
 * the dedicated right pane.
 */

import React, { createContext, useContext } from 'react';

interface StudioContextValue {
  inStudio: boolean;
}

const StudioContext = createContext<StudioContextValue>({ inStudio: false });

export function StudioProvider({ children }: { children: React.ReactNode }) {
  return <StudioContext.Provider value={{ inStudio: true }}>{children}</StudioContext.Provider>;
}

export function useInStudio(): boolean {
  return useContext(StudioContext).inStudio;
}
