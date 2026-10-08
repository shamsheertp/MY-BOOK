import { useState, useEffect, useCallback } from 'react';
import profileData from '../db/profile.json';

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
  if (typeof window === 'undefined' || !window.localStorage) return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
  window.dispatchEvent(new Event(EVENT_NAME));
};

export const resetCompanyProfile = () => {
  if (typeof window === 'undefined' || !window.localStorage) return;
  localStorage.removeItem(STORAGE_KEY);
  window.dispatchEvent(new Event(EVENT_NAME));
};

/** Formats the multi-part address into display lines */
export const formatAddressLines = (p) => {
  const cityLine = [p.city, p.state].filter(Boolean).join(', ') + (p.pincode ? ` - ${p.pincode}` : '');
  return [p.addressLine1, p.addressLine2, cityLine.trim(), p.country].filter(Boolean);
};

/** React hook — stays in sync whenever the profile is saved anywhere */
export function useCompanyProfile() {
  const [profile, setProfile] = useState(getCompanyProfile);

  const refresh = useCallback(() => setProfile(getCompanyProfile()), []);

  useEffect(() => {
    window.addEventListener(EVENT_NAME, refresh);
    window.addEventListener('storage', refresh);
    return () => {
      window.removeEventListener(EVENT_NAME, refresh);
      window.removeEventListener('storage', refresh);
    };
  }, [refresh]);

  return profile;
}
