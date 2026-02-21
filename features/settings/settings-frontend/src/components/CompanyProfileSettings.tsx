/**
 * CompanyProfileSettings – Company profile management for tenant admins
 *
 * Features:
 *   - Logo upload with client-side compression & cropping (max 50KB)
 *   - Company details: name, description, industry, GST, website
 *   - Contact info: email, phone
 *   - Address: line1, line2, city, state, country, postal code
 *   - Validation for all fields
 *   - Works on both mobile (React Native) and web (via Platform detection)
 */
import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View, Text, TextInput, Pressable, ScrollView, Image, Platform, ActivityIndicator,
} from 'react-native';
import {
  Building2, Upload, Trash2, Save, Camera, CheckCircle, AlertCircle, Globe, Mail, Phone, MapPin, FileText, Hash,
} from 'lucide-react-native';
import { Alert } from '@zipybills/ui-components';
import { useAuthStore } from '@zipybills/ui-store';
import { apiFetch } from '@zipybills/factory-api-client';
import { useLocale } from '@zipybills/i18n-engine';

// ─── Types ────────────────────────────────────

interface TenantProfile {
  company_name: string;
  description: string;
  logo_url: string | null;
  contact_email: string;
  contact_phone: string;
  address_line1: string;
  address_line2: string;
  city: string;
  state: string;
  country: string;
  postal_code: string;
  gst_number: string;
  industry: string;
  website: string;
  domain: string;
}

const INDUSTRY_OPTIONS = [
  'Manufacturing', 'Textile', 'Automotive', 'Electronics', 'Food & Beverage',
  'Pharmaceutical', 'Chemical', 'Construction', 'Packaging', 'Plastics',
  'Metal & Steel', 'Paper & Printing', 'Other',
];

const MAX_LOGO_SIZE_KB = 50;

// ─── Field Component ──────────────────────────

function FormField({ label, icon, children, required }: {
  label: string; icon?: React.ReactNode; children: React.ReactNode; required?: boolean;
}) {
  return (
    <View className="mb-4">
      <View className="flex-row items-center mb-1.5">
        {icon && <View className="mr-1.5 opacity-50">{icon}</View>}
        <Text className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
          {label}{required && <Text className="text-red-500"> *</Text>}
        </Text>
      </View>
      {children}
    </View>
  );
}

function FormInput({ value, onChangeText, placeholder, multiline, maxLength, keyboardType, autoCapitalize }: {
  value: string; onChangeText: (t: string) => void; placeholder?: string;
  multiline?: boolean; maxLength?: number; keyboardType?: 'default' | 'email-address' | 'phone-pad' | 'url';
  autoCapitalize?: 'none' | 'sentences' | 'words';
}) {
  return (
    <TextInput
      value={value}
      onChangeText={onChangeText}
      placeholder={placeholder}
      placeholderTextColor="#9CA3AF"
      maxLength={maxLength}
      multiline={multiline}
      keyboardType={keyboardType}
      autoCapitalize={autoCapitalize ?? 'sentences'}
      className={`border border-gray-200 dark:border-gray-700 rounded-lg px-3 text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-800 ${multiline ? 'py-3 min-h-[80px]' : 'py-2.5'}`}
      style={multiline ? { textAlignVertical: 'top' } : undefined}
    />
  );
}

// ─── Logo Image Compressor (Web) ──────────────

async function compressImageWeb(file: File, maxSizeKB: number): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new (globalThis as any).Image();
      img.onload = () => {
        const canvas = (globalThis as any).document.createElement('canvas');
        // Resize to max 200×200 while keeping aspect ratio
        const maxDim = 200;
        let w = img.width;
        let h = img.height;
        if (w > maxDim || h > maxDim) {
          if (w > h) { h = Math.round(h * maxDim / w); w = maxDim; }
          else { w = Math.round(w * maxDim / h); h = maxDim; }
        }
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d')!;
        ctx.drawImage(img, 0, 0, w, h);

        // Try WebP first, fallback to JPEG with decreasing quality
        let quality = 0.85;
        let dataUri = canvas.toDataURL('image/webp', quality);

        // If WebP not supported, fallback to JPEG
        if (!dataUri.startsWith('data:image/webp')) {
          dataUri = canvas.toDataURL('image/jpeg', quality);
        }

        // Keep reducing quality until under max size
        while (dataUri.length > maxSizeKB * 1024 && quality > 0.1) {
          quality -= 0.1;
          dataUri = canvas.toDataURL('image/webp', quality);
          if (!dataUri.startsWith('data:image/webp')) {
            dataUri = canvas.toDataURL('image/jpeg', quality);
          }
        }

        if (dataUri.length > maxSizeKB * 1024) {
          reject(new Error(`Cannot compress image below ${maxSizeKB}KB. Try a simpler logo.`));
        } else {
          resolve(dataUri);
        }
      };
      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = e.target?.result as string;
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });
}

// ─── Component ────────────────────────────────

export function CompanyProfileSettings() {
  const { t } = useLocale();
  const { user, setTenantInfo } = useAuthStore();
  const fileInputRef = useRef<any>(null);

  const [profile, setProfile] = useState<TenantProfile>({
    company_name: '', description: '', logo_url: null,
    contact_email: '', contact_phone: '',
    address_line1: '', address_line2: '',
    city: '', state: '', country: '', postal_code: '',
    gst_number: '', industry: '', website: '', domain: '',
  });
  const [originalProfile, setOriginalProfile] = useState<TenantProfile | null>(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [showIndustryPicker, setShowIndustryPicker] = useState(false);

  // ─── Fetch current profile ─────────────────
  const fetchProfile = useCallback(async () => {
    try {
      setLoading(true);
      const data = await apiFetch<{ success: boolean; tenant: any }>('/api/tenant/me');
      if (data.success && data.tenant) {
        const p: TenantProfile = {
          company_name: data.tenant.company_name || '',
          description: data.tenant.description || '',
          logo_url: data.tenant.logo_url || null,
          contact_email: data.tenant.contact_email || '',
          contact_phone: data.tenant.contact_phone || '',
          address_line1: data.tenant.address_line1 || '',
          address_line2: data.tenant.address_line2 || '',
          city: data.tenant.city || '',
          state: data.tenant.state || '',
          country: data.tenant.country || '',
          postal_code: data.tenant.postal_code || '',
          gst_number: data.tenant.gst_number || '',
          industry: data.tenant.industry || '',
          website: data.tenant.website || '',
          domain: data.tenant.domain || '',
        };
        setProfile(p);
        setOriginalProfile(p);
      }
    } catch (err) {
      setErrorMsg('Failed to load company profile');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchProfile(); }, [fetchProfile]);

  // ─── Validation ────────────────────────────
  const validate = (): string | null => {
    if (!profile.company_name.trim() || profile.company_name.trim().length < 2) {
      return 'Company name is required (min 2 characters)';
    }
    if (profile.contact_email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(profile.contact_email)) {
      return 'Invalid email address';
    }
    if (profile.website && !/^https?:\/\/.+/.test(profile.website)) {
      return 'Website must start with http:// or https://';
    }
    if (profile.description.length > 1000) {
      return 'Description must be under 1000 characters';
    }
    if (profile.gst_number && profile.gst_number.length > 50) {
      return 'GST/Tax ID is too long';
    }
    return null;
  };

  // ─── Save Profile ─────────────────────────
  const handleSave = async () => {
    const err = validate();
    if (err) { setErrorMsg(err); return; }

    try {
      setSaving(true);
      setErrorMsg(null);
      setSuccessMsg(null);

      const { logo_url, ...profileFields } = profile;
      const data = await apiFetch<{ success: boolean; tenant: any }>('/api/tenant/me', {
        method: 'PATCH',
        body: JSON.stringify(profileFields),
      });

      if (data.success) {
        setSuccessMsg(t('companyProfile.saved'));
        setOriginalProfile({ ...profile, logo_url: data.tenant?.logo_url ?? profile.logo_url });
        // Update auth store tenant name
        if (data.tenant?.company_name) {
          setTenantInfo({ tenant_name: data.tenant.company_name });
        }
        setTimeout(() => setSuccessMsg(null), 3000);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to save profile');
    } finally {
      setSaving(false);
    }
  };

  // ─── Logo Upload ──────────────────────────
  const handleLogoUpload = async () => {
    if (Platform.OS === 'web') {
      // Trigger hidden file input
      fileInputRef.current?.click();
    } else {
      // For native: use expo-image-picker
      try {
        // @ts-ignore — expo-image-picker is a peer dependency, available at runtime in the Expo app
        const ImagePicker = await import('expo-image-picker');
        const result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: 'images',
          allowsEditing: true,
          aspect: [1, 1],
          quality: 0.5,
          base64: true,
        });
        if (!result.canceled && result.assets[0]?.base64) {
          const mimeType = result.assets[0].mimeType || 'image/jpeg';
          const dataUri = `data:${mimeType};base64,${result.assets[0].base64}`;
          await uploadLogoDataUri(dataUri);
        }
      } catch (err: any) {
        setErrorMsg(err.message || 'Failed to pick image');
      }
    }
  };

  const handleWebFileSelected = async (event: any) => {
    const file = event.target?.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setErrorMsg('Please select an image file (PNG, JPEG, WebP)');
      return;
    }

    try {
      setUploadingLogo(true);
      setErrorMsg(null);
      const dataUri = await compressImageWeb(file, MAX_LOGO_SIZE_KB);
      await uploadLogoDataUri(dataUri);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to process image');
    } finally {
      setUploadingLogo(false);
      // Reset file input value so re-selecting same file works
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const uploadLogoDataUri = async (dataUri: string) => {
    try {
      setUploadingLogo(true);
      setErrorMsg(null);
      const data = await apiFetch<{ success: boolean; logo_url: string }>('/api/tenant/me/logo', {
        method: 'POST',
        body: JSON.stringify({ logo: dataUri }),
      });
      if (data.success) {
        setProfile(prev => ({ ...prev, logo_url: data.logo_url }));
        setTenantInfo({ tenant_logo_url: data.logo_url });
        setSuccessMsg(t('companyProfile.logoUploaded'));
        setTimeout(() => setSuccessMsg(null), 3000);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to upload logo');
    } finally {
      setUploadingLogo(false);
    }
  };

  const handleDeleteLogo = async () => {
    try {
      setUploadingLogo(true);
      setErrorMsg(null);
      const data = await apiFetch<{ success: boolean }>('/api/tenant/me/logo', {
        method: 'DELETE',
      });
      if (data.success) {
        setProfile(prev => ({ ...prev, logo_url: null }));
        setTenantInfo({ tenant_logo_url: undefined });
        setSuccessMsg(t('companyProfile.logoRemoved'));
        setTimeout(() => setSuccessMsg(null), 3000);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to remove logo');
    } finally {
      setUploadingLogo(false);
    }
  };

  // ─── Dirty check ──────────────────────────
  const isDirty = originalProfile
    ? JSON.stringify({ ...profile, logo_url: null }) !== JSON.stringify({ ...originalProfile, logo_url: null })
    : false;

  // ─── Loading State ────────────────────────
  if (loading) {
    return (
      <View className="flex-1 items-center justify-center py-20">
        <ActivityIndicator size="large" color="#3B82F6" />
        <Text className="text-sm text-gray-400 mt-3">{t('companyProfile.loading')}</Text>
      </View>
    );
  }

  const isAdmin = user?.role === 'ADMIN';

  return (
    <View className="flex-1">
      {/* Title */}
      <View className="mb-6">
        <Text className="text-xl font-bold text-gray-900 dark:text-white">
          {t('companyProfile.title')}
        </Text>
        <Text className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          {t('companyProfile.subtitle')}
        </Text>
      </View>

      {/* Alerts */}
      {successMsg && (
        <View className="mb-4">
          <Alert variant="success" message={successMsg} onDismiss={() => setSuccessMsg(null)} />
        </View>
      )}
      {errorMsg && (
        <View className="mb-4">
          <Alert variant="error" message={errorMsg} onDismiss={() => setErrorMsg(null)} />
        </View>
      )}

      {!isAdmin && (
        <View className="mb-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-3">
          <Text className="text-xs text-amber-700 dark:text-amber-300">
            {t('companyProfile.adminOnly')}
          </Text>
        </View>
      )}

      {/* ─── Logo Section ──────────────────── */}
      <View className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-4 mb-6 border border-gray-200 dark:border-gray-700">
        <Text className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
          {t('companyProfile.companyLogo')}
        </Text>
        <View className="flex-row items-center gap-4">
          {/* Logo Preview */}
          <View className="w-20 h-20 rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-600 items-center justify-center overflow-hidden bg-white dark:bg-gray-900">
            {profile.logo_url ? (
              <Image
                source={{ uri: profile.logo_url }}
                style={{ width: 80, height: 80 }}
                resizeMode="contain"
              />
            ) : (
              <Building2 size={28} color="#9CA3AF" />
            )}
          </View>

          <View className="flex-1">
            <Text className="text-xs text-gray-500 dark:text-gray-400 mb-2">
              {t('companyProfile.logoHint')}
            </Text>
            <View className="flex-row gap-2">
              {isAdmin && (
                <Pressable
                  onPress={handleLogoUpload}
                  disabled={uploadingLogo}
                  className="flex-row items-center px-3 py-2 bg-blue-600 rounded-lg active:opacity-80"
                >
                  {uploadingLogo ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <>
                      <Upload size={14} color="#fff" />
                      <Text className="text-xs font-semibold text-white ml-1.5">
                        {t('companyProfile.uploadLogo')}
                      </Text>
                    </>
                  )}
                </Pressable>
              )}
              {profile.logo_url && isAdmin && (
                <Pressable
                  onPress={handleDeleteLogo}
                  disabled={uploadingLogo}
                  className="flex-row items-center px-3 py-2 bg-red-100 dark:bg-red-900/30 rounded-lg active:opacity-80"
                >
                  <Trash2 size={14} color="#EF4444" />
                  <Text className="text-xs font-semibold text-red-600 dark:text-red-400 ml-1.5">
                    {t('common.remove')}
                  </Text>
                </Pressable>
              )}
            </View>
          </View>
        </View>

        {/* Hidden file input for web */}
        {Platform.OS === 'web' && (
          <input
            ref={fileInputRef as any}
            type="file"
            accept="image/png,image/jpeg,image/webp,image/svg+xml"
            style={{ display: 'none' }}
            onChange={handleWebFileSelected}
          />
        )}
      </View>

      {/* ─── Company Details ───────────────── */}
      <View className="mb-6">
        <Text className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
          {t('companyProfile.companyDetails')}
        </Text>

        <FormField label={t('companyProfile.companyName')} icon={<Building2 size={12} color="#6B7280" />} required>
          <FormInput
            value={profile.company_name}
            onChangeText={(v) => setProfile(p => ({ ...p, company_name: v }))}
            placeholder={t('companyProfile.companyNamePlaceholder')}
            maxLength={300}
            autoCapitalize="words"
          />
        </FormField>

        <FormField label={t('companyProfile.description')} icon={<FileText size={12} color="#6B7280" />}>
          <FormInput
            value={profile.description}
            onChangeText={(v) => setProfile(p => ({ ...p, description: v }))}
            placeholder={t('companyProfile.descriptionPlaceholder')}
            multiline
            maxLength={1000}
          />
          <Text className="text-[10px] text-gray-400 mt-1 text-right">
            {profile.description.length}/1000
          </Text>
        </FormField>

        <FormField label={t('companyProfile.industry')}>
          <Pressable
            onPress={() => setShowIndustryPicker(!showIndustryPicker)}
            className="border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2.5 bg-white dark:bg-gray-800"
          >
            <Text className={profile.industry ? 'text-gray-900 dark:text-gray-100 text-sm' : 'text-gray-400 text-sm'}>
              {profile.industry || t('companyProfile.selectIndustry')}
            </Text>
          </Pressable>
          {showIndustryPicker && (
            <View className="mt-1 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 overflow-hidden max-h-48">
              <ScrollView nestedScrollEnabled>
                {INDUSTRY_OPTIONS.map((ind) => (
                  <Pressable
                    key={ind}
                    onPress={() => {
                      setProfile(p => ({ ...p, industry: ind }));
                      setShowIndustryPicker(false);
                    }}
                    className={`px-3 py-2.5 border-b border-gray-100 dark:border-gray-700 active:bg-gray-50 dark:active:bg-gray-700 ${profile.industry === ind ? 'bg-blue-50 dark:bg-blue-900/30' : ''}`}
                  >
                    <Text className={`text-sm ${profile.industry === ind ? 'text-blue-600 dark:text-blue-400 font-semibold' : 'text-gray-700 dark:text-gray-300'}`}>
                      {ind}
                    </Text>
                  </Pressable>
                ))}
              </ScrollView>
            </View>
          )}
        </FormField>

        <FormField label={t('companyProfile.gstNumber')} icon={<Hash size={12} color="#6B7280" />}>
          <FormInput
            value={profile.gst_number}
            onChangeText={(v) => setProfile(p => ({ ...p, gst_number: v }))}
            placeholder={t('companyProfile.gstPlaceholder')}
            maxLength={50}
            autoCapitalize="none"
          />
        </FormField>

        <FormField label={t('companyProfile.website')} icon={<Globe size={12} color="#6B7280" />}>
          <FormInput
            value={profile.website}
            onChangeText={(v) => setProfile(p => ({ ...p, website: v }))}
            placeholder="https://example.com"
            maxLength={500}
            keyboardType="url"
            autoCapitalize="none"
          />
        </FormField>
      </View>

      {/* ─── Contact Info ──────────────────── */}
      <View className="mb-6">
        <Text className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
          {t('companyProfile.contactInfo')}
        </Text>

        <FormField label={t('companyProfile.email')} icon={<Mail size={12} color="#6B7280" />}>
          <FormInput
            value={profile.contact_email}
            onChangeText={(v) => setProfile(p => ({ ...p, contact_email: v }))}
            placeholder="info@company.com"
            keyboardType="email-address"
            autoCapitalize="none"
          />
        </FormField>

        <FormField label={t('companyProfile.phone')} icon={<Phone size={12} color="#6B7280" />}>
          <FormInput
            value={profile.contact_phone}
            onChangeText={(v) => setProfile(p => ({ ...p, contact_phone: v }))}
            placeholder="+91 98765 43210"
            keyboardType="phone-pad"
          />
        </FormField>
      </View>

      {/* ─── Address ───────────────────────── */}
      <View className="mb-6">
        <Text className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
          {t('companyProfile.address')}
        </Text>

        <FormField label={t('companyProfile.addressLine1')} icon={<MapPin size={12} color="#6B7280" />}>
          <FormInput
            value={profile.address_line1}
            onChangeText={(v) => setProfile(p => ({ ...p, address_line1: v }))}
            placeholder={t('companyProfile.addressPlaceholder')}
          />
        </FormField>

        <FormField label={t('companyProfile.addressLine2')}>
          <FormInput
            value={profile.address_line2}
            onChangeText={(v) => setProfile(p => ({ ...p, address_line2: v }))}
            placeholder={t('companyProfile.addressLine2Placeholder')}
          />
        </FormField>

        <View className="flex-row gap-3">
          <View className="flex-1">
            <FormField label={t('companyProfile.city')}>
              <FormInput
                value={profile.city}
                onChangeText={(v) => setProfile(p => ({ ...p, city: v }))}
                placeholder={t('companyProfile.city')}
                autoCapitalize="words"
              />
            </FormField>
          </View>
          <View className="flex-1">
            <FormField label={t('companyProfile.state')}>
              <FormInput
                value={profile.state}
                onChangeText={(v) => setProfile(p => ({ ...p, state: v }))}
                placeholder={t('companyProfile.state')}
                autoCapitalize="words"
              />
            </FormField>
          </View>
        </View>

        <View className="flex-row gap-3">
          <View className="flex-1">
            <FormField label={t('companyProfile.country')}>
              <FormInput
                value={profile.country}
                onChangeText={(v) => setProfile(p => ({ ...p, country: v }))}
                placeholder={t('companyProfile.country')}
                autoCapitalize="words"
              />
            </FormField>
          </View>
          <View className="flex-1">
            <FormField label={t('companyProfile.postalCode')}>
              <FormInput
                value={profile.postal_code}
                onChangeText={(v) => setProfile(p => ({ ...p, postal_code: v }))}
                placeholder="110001"
                keyboardType="default"
              />
            </FormField>
          </View>
        </View>
      </View>

      {/* ─── Save Button ──────────────────── */}
      {isAdmin && (
        <Pressable
          onPress={handleSave}
          disabled={saving || !isDirty}
          className={`flex-row items-center justify-center px-6 py-3.5 rounded-xl mb-8 ${isDirty ? 'bg-blue-600 active:bg-blue-700' : 'bg-gray-300 dark:bg-gray-700'}`}
        >
          {saving ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <>
              <Save size={18} color={isDirty ? '#fff' : '#9CA3AF'} />
              <Text className={`text-base font-semibold ml-2 ${isDirty ? 'text-white' : 'text-gray-400'}`}>
                {t('companyProfile.saveChanges')}
              </Text>
            </>
          )}
        </Pressable>
      )}
    </View>
  );
}
