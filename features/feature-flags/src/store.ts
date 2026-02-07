import { create } from 'zustand';

export type FeatureFlagValue = boolean | string | number;

export interface FeatureFlags {
  [key: string]: FeatureFlagValue;
}

interface FeatureFlagStore {
  flags: FeatureFlags;
  setFlags: (flags: FeatureFlags) => void;
  setFlag: (key: string, value: FeatureFlagValue) => void;
  getFlag: (key: string, defaultValue?: FeatureFlagValue) => FeatureFlagValue;
  isEnabled: (key: string) => boolean;
}

export const useFeatureFlagStore = create<FeatureFlagStore>((set, get) => ({
  flags: {},

  setFlags: (flags) => set({ flags }),

  setFlag: (key, value) =>
    set((state) => ({
      flags: { ...state.flags, [key]: value },
    })),

  getFlag: (key, defaultValue = false) => {
    const { flags } = get();
    return flags[key] !== undefined ? flags[key] : defaultValue;
  },

  isEnabled: (key) => {
    const { flags } = get();
    return Boolean(flags[key]);
  },
}));
