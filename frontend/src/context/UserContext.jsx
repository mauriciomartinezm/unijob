import React, { createContext, useContext, useState, useEffect } from 'react';

const UserContext = createContext(null);

export const UserProvider = ({ children }) => {
  const [user, setUser] = useState(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem('user_data');
      if (raw) setUser(JSON.parse(raw));
    } catch (err) {
      console.warn('Failed to parse user_data from localStorage', err);
    }
  }, []);

  const saveUser = (u) => {
    setUser(u);
    try {
      if (u) localStorage.setItem('user_data', JSON.stringify(u));
      else localStorage.removeItem('user_data');
    } catch (err) {
      console.warn('Failed to persist user_data', err);
    }
  };

  const logout = () => {
    saveUser(null);
    localStorage.removeItem('isLogged');
  };

  return (
    <UserContext.Provider value={{ user, setUser: saveUser, logout }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => {
  return useContext(UserContext);
};

export default UserContext;
