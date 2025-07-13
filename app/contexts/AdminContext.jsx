import { createContext, useContext, useState } from 'react';

const defaultConfig = {
  frequency: null,
  matchDays: [],
  monthlyMatchDays: [],
  reverseGapWeeks: 4,
  matchTimes: {},
  teams: [],
  startDate: new Date(),
  excludedRanges: [],
  seasonId: null,
  districtId: null,
};

const AdminContext = createContext();

export function AdminProvider({ children }) {
  const [fixtureConfig, setFixtureConfig] = useState(defaultConfig);

  return (
    <AdminContext.Provider value={{ fixtureConfig, setFixtureConfig }}>
      {children}
    </AdminContext.Provider>
  );
}

export function useFixtureConfig() {
  const context = useContext(AdminContext);
  if (!context) {
    throw new Error('useFixtureConfig must be used within an AdminProvider');
  }
  return context;
}
