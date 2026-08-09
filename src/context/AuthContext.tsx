import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, onAuthStateChanged } from 'firebase/auth';
import { auth, syncUserRoleOnLogin, isAdmin as checkIsAdmin, isTeacher as checkIsTeacher, isActiveUser as checkIsActive } from '../lib/firebase';
import { AppUser, UserRole, UserStatus } from '../types';

interface AuthContextType {
  currentUser: User | null;
  appUser: AppUser | null;
  userRole: UserRole;
  userStatus: UserStatus;
  isAdmin: boolean;
  isTeacher: boolean;
  isActiveUser: boolean;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType>({
  currentUser: null,
  appUser: null,
  userRole: 'teacher',
  userStatus: 'active',
  isAdmin: false,
  isTeacher: true,
  isActiveUser: true,
  loading: true,
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [appUser, setAppUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      if (user) {
        try {
          const syncedAppUser = await syncUserRoleOnLogin(user);
          setAppUser(syncedAppUser);
        } catch (error) {
          console.error("AuthContext sync error:", error);
          setAppUser({
            uid: user.uid,
            displayName: user.displayName || '',
            email: user.email || '',
            role: 'teacher',
            status: 'active',
          });
        }
      } else {
        setAppUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const role: UserRole = appUser?.role || 'teacher';
  const status: UserStatus = appUser?.status || 'active';

  const value: AuthContextType = {
    currentUser,
    appUser,
    userRole: role,
    userStatus: status,
    isAdmin: checkIsAdmin(role),
    isTeacher: checkIsTeacher(role),
    isActiveUser: checkIsActive(status),
    loading,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => useContext(AuthContext);
