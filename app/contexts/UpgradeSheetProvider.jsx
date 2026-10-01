import { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react';
import UpgradeSheet from '@components/UpgradeSheet';

const UpgradeSheetContext = createContext(null);

// Owns the single app-wide upgrade bottom sheet. Must sit inside
// BottomSheetModalProvider.
export const UpgradeSheetProvider = ({ children }) => {
  const sheetRef = useRef(null);
  const [config, setConfig] = useState({});

  const closeUpgradeSheet = useCallback(() => sheetRef.current?.dismiss(), []);

  // config: { title, planName, description, onUpgrade }
  const openUpgradeSheet = useCallback((nextConfig = {}) => {
    setConfig(nextConfig);
    sheetRef.current?.present();
  }, []);

  const handleUpgrade = useCallback(() => {
    sheetRef.current?.dismiss();
    config.onUpgrade?.();
  }, [config]);

  const value = useMemo(
    () => ({ openUpgradeSheet, closeUpgradeSheet }),
    [openUpgradeSheet, closeUpgradeSheet]
  );

  return (
    <UpgradeSheetContext.Provider value={value}>
      {children}
      <UpgradeSheet
        ref={sheetRef}
        title={config.title}
        planName={config.planName}
        description={config.description}
        onUpgrade={handleUpgrade}
        onClose={closeUpgradeSheet}
      />
    </UpgradeSheetContext.Provider>
  );
};

export const useUpgradeSheet = () => {
  const ctx = useContext(UpgradeSheetContext);
  if (!ctx) throw new Error('useUpgradeSheet must be used within UpgradeSheetProvider');
  return ctx;
};
