import React, { createContext, useContext, useState, useEffect } from 'react';
import { ElderlyProfile } from '../types';
import { profileService } from '../services/api';
import { useAuth } from './AuthContext';

interface ProfileContextType {
  profiles: ElderlyProfile[];
  currentProfile: ElderlyProfile | null;
  loading: boolean;
  setCurrentProfileId: (id: number) => void;
  refreshProfiles: () => Promise<void>;
}

const ProfileContext = createContext<ProfileContextType | undefined>(undefined);

export const ProfileProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [profiles, setProfiles] = useState<ElderlyProfile[]>([]);
  const [currentProfile, setCurrentProfile] = useState<ElderlyProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchProfiles = async () => {
    if (!user) {
      setProfiles([]);
      setCurrentProfile(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const list = await profileService.listProfiles();
      setProfiles(list);

      const savedId = localStorage.getItem('carecircle_active_profile_id');
      if (savedId) {
        const found = list.find((p) => p.id === Number(savedId));
        if (found) {
          setCurrentProfile(found);
          return;
        }
      }

      if (list.length > 0) {
        setCurrentProfile(list[0]);
        localStorage.setItem('carecircle_active_profile_id', String(list[0].id));
      } else {
        setCurrentProfile(null);
      }
    } catch (e) {
      console.error('Failed to load profiles:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfiles();
  }, [user]);

  const setCurrentProfileId = (id: number) => {
    const found = profiles.find((p) => p.id === id);
    if (found) {
      setCurrentProfile(found);
      localStorage.setItem('carecircle_active_profile_id', String(found.id));
    }
  };

  return (
    <ProfileContext.Provider
      value={{
        profiles,
        currentProfile,
        loading,
        setCurrentProfileId,
        refreshProfiles: fetchProfiles,
      }}
    >
      {children}
    </ProfileContext.Provider>
  );
};

export const useProfile = () => {
  const context = useContext(ProfileContext);
  if (!context) {
    throw new Error('useProfile must be used within a ProfileProvider');
  }
  return context;
};
