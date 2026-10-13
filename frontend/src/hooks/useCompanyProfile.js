import { useState, useEffect, useCallback } from 'react';
import profileData from '../db/profile.json';
import { companyService } from '../services/api';

const STORAGE_KEY = 'mybook_company_profile';
const EVENT_NAME = 'company-profile-updated';

// Base company data comes from src/db/profile.json
export const defaultCompanyProfile = profileData;

export const getCompanyProfile = () => {
  try {
    if (typeof window === 'undefined' || !window.localStorage) return defaultCompanyProfile;
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null');
    return saved ? { ...defaultCompanyProfile, ...saved } : defaultCompanyProfile;
  } catch {
    return defaultCompanyProfile;
  }
};

export const saveCompanyProfile = (profile) => {
  // Sync to PostgreSQL DB, then persist locally on confirmation
  companyService.updateProfile(profile)
    .then((res) => {
      const updatedProfile = res?.data?.companyProfile || profile;
      if (typeof window !== 'undefined' && window.localStorage) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedProfile));
        window.dispatchEvent(new Event(EVENT_NAME));
      }
    })
    .catch((err) => {
      console.warn('Could not sync company profile to backend DB:', err.message);
    });
};

export const saveCompanyProfileAsync = async (profile) => {
  // Persist directly to DB
  const res = await companyService.updateProfile(profile);
  const updatedProfile = res?.data?.companyProfile || profile;

  if (typeof window !== 'undefined' && window.localStorage) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedProfile));
    window.dispatchEvent(new Event(EVENT_NAME));
  }
  return updatedProfile;
};

export const resetCompanyProfile = async () => {
  const res = await companyService.updateProfile(defaultCompanyProfile);
  const updatedProfile = res?.data?.companyProfile || defaultCompanyProfile;

  if (typeof window !== 'undefined' && window.localStorage) {
    localStorage.removeItem(STORAGE_KEY);
    window.dispatchEvent(new Event(EVENT_NAME));
  }
  return updatedProfile;
};

/** Formats the multi-part address into display lines */
export const formatAddressLines = (p) => {
  if (!p) return [];
  const cityLine = [p.city, p.state].filter(Boolean).join(', ') + (p.pincode ? ` - ${p.pincode}` : '');
  return [p.addressLine1, p.addressLine2, cityLine.trim(), p.country].filter(Boolean);
};

/** React hook — stays in sync with DB and localStorage */
export function useCompanyProfile() {
  const [profile, setProfile] = useState(getCompanyProfile);

  const refresh = useCallback(() => setProfile(getCompanyProfile()), []);

  useEffect(() => {
    // Initial fetch from backend PostgreSQL DB
    let isMounted = true;
    companyService.getProfile()
      .then((res) => {
        if (isMounted && res?.data?.companyProfile) {
          const dbProfile = { ...defaultCompanyProfile, ...res.data.companyProfile };
          localStorage.setItem(STORAGE_KEY, JSON.stringify(dbProfile));
          setProfile(dbProfile);
        }
      })
      .catch(() => {
        // Fallback to local cache silently
      });

    window.addEventListener(EVENT_NAME, refresh);
    window.addEventListener('storage', refresh);
    return () => {
      isMounted = false;
      window.removeEventListener(EVENT_NAME, refresh);
      window.removeEventListener('storage', refresh);
    };
  }, [refresh]);

  return profile;
}

