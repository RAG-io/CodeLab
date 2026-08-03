import { createContext, useContext, useState, useEffect } from 'react';
import { authService } from '../services/authService';
import { profileService } from '../services/profileService';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = authService.onAuthStateChange(
      (event, session) => {
        setSession(session);
        
        if (session?.user) {
          // Defer fetching user data to avoid deadlock
          setTimeout(async () => {
            let profile;
            let role;
            try {
              profile = await profileService.getProfile(session.user.id);
              role = await authService.getUserRole(session.user.id);
            } catch (err) {
              console.error('Failed to fetch user context data', err);
            }
            
            setUser({
              id: session.user.id,
              email: session.user.email,
              name: profile?.name || session.user.email,
              role: role || 'developer',
              avatar: profile?.avatar_url,
            });
            setLoading(false);
          }, 0);
        } else {
          setUser(null);
          setLoading(false);
        }
      }
    );

    // THEN check for existing session
    authService.getSession().then((session) => {
      setSession(session);
      if (!session) {
        setLoading(false);
      }
    }).catch(() => setLoading(false));

    return () => subscription.unsubscribe();
  }, []);

  const logout = async () => {
    await authService.signOut();
    setUser(null);
    setSession(null);
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
