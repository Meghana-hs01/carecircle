import React, { createContext, useContext, useState, useEffect } from 'react';

interface AccessibilityContextType {
  highContrast: boolean;
  largeText: boolean;
  screenReaderHelp: boolean;
  toggleHighContrast: () => void;
  toggleLargeText: () => void;
  toggleScreenReaderHelp: () => void;
  resetAccessibility: () => void;
}

const AccessibilityContext = createContext<AccessibilityContextType | undefined>(undefined);

export const AccessibilityProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [highContrast, setHighContrast] = useState<boolean>(() => {
    return localStorage.getItem('carecircle_high_contrast') === 'true';
  });

  const [largeText, setLargeText] = useState<boolean>(() => {
    return localStorage.getItem('carecircle_large_text') === 'true';
  });

  const [screenReaderHelp, setScreenReaderHelp] = useState<boolean>(() => {
    return localStorage.getItem('carecircle_sr_help') === 'true';
  });

  useEffect(() => {
    const root = document.documentElement;
    if (highContrast) {
      root.classList.add('contrast-more', 'high-contrast');
    } else {
      root.classList.remove('contrast-more', 'high-contrast');
    }
    localStorage.setItem('carecircle_high_contrast', String(highContrast));
  }, [highContrast]);

  useEffect(() => {
    const root = document.documentElement;
    if (largeText) {
      root.classList.add('text-lg-mode');
    } else {
      root.classList.remove('text-lg-mode');
    }
    localStorage.setItem('carecircle_large_text', String(largeText));
  }, [largeText]);

  useEffect(() => {
    localStorage.setItem('carecircle_sr_help', String(screenReaderHelp));
  }, [screenReaderHelp]);

  const toggleHighContrast = () => setHighContrast((prev) => !prev);
  const toggleLargeText = () => setLargeText((prev) => !prev);
  const toggleScreenReaderHelp = () => setScreenReaderHelp((prev) => !prev);
  const resetAccessibility = () => {
    setHighContrast(false);
    setLargeText(false);
    setScreenReaderHelp(false);
  };

  return (
    <AccessibilityContext.Provider
      value={{
        highContrast,
        largeText,
        screenReaderHelp,
        toggleHighContrast,
        toggleLargeText,
        toggleScreenReaderHelp,
        resetAccessibility,
      }}
    >
      {children}
    </AccessibilityContext.Provider>
  );
};

export const useAccessibility = () => {
  const context = useContext(AccessibilityContext);
  if (!context) {
    throw new Error('useAccessibility must be used within an AccessibilityProvider');
  }
  return context;
};
