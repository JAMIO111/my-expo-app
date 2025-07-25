import { createContext, useContext, useState, useEffect } from 'react';
import { useAuthUserProfile } from '@hooks/useAuthUserProfile2';

const UserContext = createContext(null);

export const UserProvider = ({ children }) => {
  const { data, isLoading, isError, refetch } = useAuthUserProfile();
  const [currentRole, setCurrentRole] = useState(null);

  // Set the default role if there's only one and nothing has been selected yet
  useEffect(() => {
    if (data?.roles?.length === 1 && !currentRole) {
      setCurrentRole(data.roles[0]);
    }
  }, [data?.roles, currentRole]);

  return (
    <UserContext.Provider
      value={{
        user: data?.user || null,
        player: data?.playerProfile || null,
        roles: data?.roles || [],
        currentRole,
        setCurrentRole,
        loading: isLoading,
        isError,
        refetch,
      }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => useContext(UserContext);
