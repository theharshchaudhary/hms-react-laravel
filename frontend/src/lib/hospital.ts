import { useEffect, useState } from 'react';
import { publicApi, type HospitalProfile } from '@/services/api';

let cached: Promise<HospitalProfile> | null = null;

export function useHospitalProfile(): HospitalProfile | null {
  const [profile, setProfile] = useState<HospitalProfile | null>(null);

  useEffect(() => {
    let active = true;
    if (!cached) {
      cached = publicApi.hospital().catch((err) => { cached = null; throw err; });
    }
    cached.then((p) => { if (active) setProfile(p); }).catch(() => {});
    return () => { active = false; };
  }, []);

  return profile;
}
