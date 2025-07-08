import { createContext, useContext } from 'react';
import { useAuthUserProfile } from '@hooks/useAuthUserProfile';

const UserContext = createContext(null);

export const UserProvider = ({ children }) => {
  const { data: player, isLoading, isError, refetch } = useAuthUserProfile();

  return (
    <UserContext.Provider value={{ player, loading: isLoading, isError, refetch }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => useContext(UserContext);
