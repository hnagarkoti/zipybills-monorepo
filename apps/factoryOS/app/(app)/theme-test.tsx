/**
 * Theme Test – Interactive Theme Engine Test Bench
 *
 * This screen exercises every layer of the FactoryOS multi-layer theming engine:
 *   1. Base Theme switching (light / dark / high-contrast)
 *   2. Role theme switching (operator / supervisor / maintenance / admin / executive)
 *   3. Environment theme switching (factory-floor / control-room / office / mobile)
 *   4. Compliance mode switching (standard / audit-mode / validation-mode / traceability-mode)
 *   5. User preferences (font scale, reduced motion, high contrast)
 *   6. Token visualization (colors, typography, spacing, radius, shadows)
 *   7. CSS variable inspection (web only)
 *   8. Applied layers audit trail
 *   9. Component preview with live theme tokens
 *
 * Access: /theme-test (authenticated route)
 */
import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  Platform,
  useWindowDimensions,
} from 'react-native';
import {
  useTheme,
  useThemeColors,
  useThemeTypography,
  useThemeSpacing,
  useThemeRadius,
  useThemeShadows,
  useThemeLayout,
  useThemeBehavior,
  useThemeBranding,
  useIsDark,
  useThemeStyles,
  useScaledFontSize,
  useComplianceWatermark,
  useAnimationsEnabled,
  useAppliedLayers,
} from '@zipybills/theme-engine';
import type {
  BaseThemeId,
  RoleThemeId,
  EnvironmentThemeId,
  ComplianceThemeId,
} from '@zipybills/theme-engine';

/* ─── Constants ─────────────────────────────── */

const BASE_THEMES: BaseThemeId[] = ['light', 'dark', 'high-contrast'];

const ROLES: RoleThemeId[] = [
  'operator',
  'supervisor',
  'maintenance',
  'admin',
  'executive',
];

const ENVIRONMENTS: EnvironmentThemeId[] = [
  'factory-floor',
  'control-room',
  'office',
  'mobile',
];

const COMPLIANCE_MODES: ComplianceThemeId[] = [
  'standard',
  'audit-mode',
  'validation-mode',
  'traceability-mode',
];

const FONT_SCALES = [0.8, 0.9, 1.0, 1.1, 1.2, 1.5];

/* ─── Reusable Sub-Components ──────────────── */

function SectionTitle({ children }: { children: string }) {
  const colors = useThemeColors();
  return (
    <Text
      style={{
        fontSize: 18,
        fontWeight: '700',
        color: colors.surface?.foreground ?? colors.gray[900],
        marginTop: 24,
        marginBottom: 12,
        borderBottomWidth: 1,
        borderBottomColor: colors.surface?.border ?? colors.gray[200],
        paddingBottom: 8,
      }}
    >
      {children}
    </Text>
  );
}

function Chip({
  label,
  isActive,
  onPress,
  color,
}: {
  label: string;
  isActive: boolean;
  onPress: () => void;
  color?: string;
}) {
  const colors = useThemeColors();
  const radius = useThemeRadius();
  const activeColor = color ?? colors.brand?.primary ?? colors.primary[500];

  return (
    <Pressable
      onPress={onPress}
      style={{
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderRadius: radius.md,
        backgroundColor: isActive ? activeColor : colors.surface?.muted ?? colors.gray[100],
        borderWidth: 1,
        borderColor: isActive ? activeColor : colors.surface?.border ?? colors.gray[200],
        marginRight: 8,
        marginBottom: 8,
        minHeight: 40,
        justifyContent: 'center',
      }}
    >
      <Text
        style={{
          fontSize: 13,
          fontWeight: isActive ? '700' : '500',
          color: isActive
            ? colors.brand?.primaryForeground ?? colors.white
            : colors.surface?.foreground ?? colors.gray[700],
        }}
      >
        {label}
      </Text>
    </Pressable>
  );
}

function ColorSwatch({
  label,
  color,
}: {
  label: string;
  color: string;
}) {
  const colors = useThemeColors();
  return (
    <View style={{ alignItems: 'center', marginRight: 8, marginBottom: 12 }}>
      <View
        style={{
          width: 48,
          height: 48,
          borderRadius: 8,
          backgroundColor: color,
          borderWidth: 1,
          borderColor: colors.surface?.border ?? colors.gray[200],
        }}
      />
      <Text
        style={{
          fontSize: 9,
          color: colors.surface?.mutedForeground ?? colors.gray[500],
          marginTop: 4,
          textAlign: 'center',
          maxWidth: 56,
        }}
        numberOfLines={2}
      >
        {label}
      </Text>
    </View>
  );
}

function TokenRow({
  label,
  value,
}: {
  label: string;
  value: string | number | boolean;
}) {
  const colors = useThemeColors();
  return (
    <View
      style={{
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: 6,
        borderBottomWidth: 1,
        borderBottomColor: colors.surface?.border ?? colors.gray[100],
      }}
    >
      <Text
        style={{
          fontSize: 12,
          color: colors.surface?.mutedForeground ?? colors.gray[500],
          fontFamily: Platform.OS === 'web' ? 'monospace' : 'Menlo',
        }}
      >
        {label}
      </Text>
      <Text
        style={{
          fontSize: 12,
          fontWeight: '600',
          color: colors.surface?.foreground ?? colors.gray[900],
          fontFamily: Platform.OS === 'web' ? 'monospace' : 'Menlo',
        }}
      >
        {String(value)}
      </Text>
    </View>
  );
}

/* ─── Main Component ──────────────────────────── */

export default function ThemeTestScreen() {
  const { width } = useWindowDimensions();
  const isWide = width > 768;

  // ─── Theme hooks ──────────────────
  const {
    tokens,
    context,
    isReady,
    isDark,
    setBaseTheme,
    setRole,
    setEnvironment,
    setComplianceMode,
    setUserPreferences,
    toggleDarkMode,
    reset,
  } = useTheme();

  const colors = useThemeColors();
  const typography = useThemeTypography();
  const spacing = useThemeSpacing();
  const radius = useThemeRadius();
  const shadows = useThemeShadows();
  const layout = useThemeLayout();
  const behavior = useThemeBehavior();
  const branding = useThemeBranding();
  const themeStyles = useThemeStyles();
  const appliedLayers = useAppliedLayers();
  const complianceWatermark = useComplianceWatermark();
  const animationsEnabled = useAnimationsEnabled();
  const scaledBase = useScaledFontSize('base');

  // Local state for expanded sections
  const [expanded, setExpanded] = useState<Record<string, boolean>>({
    controls: true,
    colors: true,
    typography: false,
    spacing: false,
    layout: false,
    behavior: false,
    components: true,
    layers: true,
  });

  const toggle = (key: string) =>
    setExpanded((prev) => ({ ...prev, [key]: !prev[key] }));

  // ─── Background & text colors from tokens ──
  const bg = colors.surface?.background ?? colors.white;
  const fg = colors.surface?.foreground ?? colors.gray[900];
  const cardBg = colors.surface?.card ?? colors.white;
  const border = colors.surface?.border ?? colors.gray[200];
  const muted = colors.surface?.mutedForeground ?? colors.gray[500];

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: bg }}
      contentContainerStyle={{ padding: isWide ? 32 : 16, paddingBottom: 80 }}
    >
      {/* ─── Header ───────────────────────── */}
      <View style={{ marginBottom: 24 }}>
        <Text style={{ fontSize: 28, fontWeight: '800', color: fg }}>
          🎨 Theme Test Bench
        </Text>
        <Text style={{ fontSize: 14, color: muted, marginTop: 4 }}>
          Interactive testing for the FactoryOS multi-layer theming engine
        </Text>
        <View
          style={{
            flexDirection: 'row',
            flexWrap: 'wrap',
            marginTop: 12,
            gap: 8,
          }}
        >
          <StatusBadge label={`Ready: ${isReady ? '✅' : '❌'}`} />
          <StatusBadge label={`Mode: ${isDark ? '🌙 Dark' : '☀️ Light'}`} />
          <StatusBadge label={`Role: ${context.role ?? 'none'}`} />
          <StatusBadge label={`Env: ${context.environment ?? 'none'}`} />
          <StatusBadge label={`Compliance: ${context.complianceMode ?? 'standard'}`} />
          <StatusBadge label={`Font Scale: ${typography.fontScale ?? 1}x`} />
          <StatusBadge label={`Layers: ${appliedLayers.length}`} />
        </View>
      </View>

      {/* ─── 1. Theme Controls ────────────── */}
      <CollapsibleSection
        title="1. Theme Controls"
        isOpen={expanded.controls}
        onToggle={() => toggle('controls')}
        bg={cardBg}
        border={border}
        fg={fg}
      >
        {/* Base Theme */}
        <SubHeading color={fg}>Base Theme</SubHeading>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
          {BASE_THEMES.map((t) => (
            <Chip
              key={t}
              label={t}
              isActive={context.baseTheme === t}
              onPress={() => setBaseTheme(t)}
            />
          ))}
        </View>

        {/* Quick Dark Mode Toggle */}
        <Pressable
          onPress={toggleDarkMode}
          style={{
            backgroundColor: isDark ? colors.gray[700] : colors.gray[200],
            paddingHorizontal: 16,
            paddingVertical: 10,
            borderRadius: radius.md,
            alignSelf: 'flex-start',
            marginBottom: 16,
          }}
        >
          <Text style={{ color: isDark ? colors.white : colors.gray[900], fontWeight: '600' }}>
            {isDark ? '🌙 Switch to Light' : '☀️ Switch to Dark'}
          </Text>
        </Pressable>

        {/* Role Theme */}
        <SubHeading color={fg}>Role Theme</SubHeading>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
          <Chip
            label="None"
            isActive={!context.role}
            onPress={() => setRole(undefined)}
            color={colors.gray[500]}
          />
          {ROLES.map((r) => (
            <Chip
              key={r}
              label={r}
              isActive={context.role === r}
              onPress={() => setRole(r)}
            />
          ))}
        </View>

        {/* Environment Theme */}
        <SubHeading color={fg}>Environment Theme</SubHeading>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
          <Chip
            label="None"
            isActive={!context.environment}
            onPress={() => setEnvironment(undefined)}
            color={colors.gray[500]}
          />
          {ENVIRONMENTS.map((e) => (
            <Chip
              key={e}
              label={e}
              isActive={context.environment === e}
              onPress={() => setEnvironment(e)}
            />
          ))}
        </View>

        {/* Compliance Mode */}
        <SubHeading color={fg}>Compliance Mode</SubHeading>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
          {COMPLIANCE_MODES.map((m) => (
            <Chip
              key={m}
              label={m}
              isActive={context.complianceMode === m}
              onPress={() => setComplianceMode(m)}
              color={m !== 'standard' ? colors.warning[500] : undefined}
            />
          ))}
        </View>

        {/* Font Scale */}
        <SubHeading color={fg}>Font Scale (User Preference)</SubHeading>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
          {FONT_SCALES.map((s) => (
            <Chip
              key={s}
              label={`${s}x`}
              isActive={(typography.fontScale ?? 1) === s}
              onPress={() =>
                setUserPreferences({ typography: { fontScale: s } })
              }
            />
          ))}
        </View>

        {/* Reset */}
        <Pressable
          onPress={reset}
          style={{
            backgroundColor: colors.error[500],
            paddingHorizontal: 20,
            paddingVertical: 10,
            borderRadius: radius.md,
            alignSelf: 'flex-start',
            marginTop: 12,
          }}
        >
          <Text style={{ color: colors.white, fontWeight: '700' }}>
            🔄 Reset All to Defaults
          </Text>
        </Pressable>
      </CollapsibleSection>

      {/* ─── 2. Color Tokens ─────────────── */}
      <CollapsibleSection
        title="2. Color Tokens"
        isOpen={expanded.colors}
        onToggle={() => toggle('colors')}
        bg={cardBg}
        border={border}
        fg={fg}
      >
        {/* Primary Scale */}
        <SubHeading color={fg}>Primary</SubHeading>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
          {Object.entries(colors.primary).map(([shade, val]) => (
            <ColorSwatch key={shade} label={`P-${shade}`} color={val} />
          ))}
        </View>

        {/* Secondary Scale */}
        <SubHeading color={fg}>Secondary</SubHeading>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
          {Object.entries(colors.secondary).map(([shade, val]) => (
            <ColorSwatch key={shade} label={`S-${shade}`} color={val} />
          ))}
        </View>

        {/* Gray Scale */}
        <SubHeading color={fg}>Gray</SubHeading>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
          {Object.entries(colors.gray).map(([shade, val]) => (
            <ColorSwatch key={shade} label={`G-${shade}`} color={val} />
          ))}
        </View>

        {/* Semantic Colors */}
        <SubHeading color={fg}>Semantic</SubHeading>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
          {(['success', 'warning', 'error', 'info'] as const).map((name) => {
            const sem = colors[name];
            return (
              <React.Fragment key={name}>
                <ColorSwatch label={`${name}-50`} color={sem[50]} />
                <ColorSwatch label={`${name}-500`} color={sem[500]} />
                <ColorSwatch label={`${name}-700`} color={sem[700]} />
              </React.Fragment>
            );
          })}
        </View>

        {/* Surface Colors */}
        {colors.surface && (
          <>
            <SubHeading color={fg}>Surface</SubHeading>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
              {Object.entries(colors.surface).map(([key, val]) => (
                <ColorSwatch key={key} label={key} color={val as string} />
              ))}
            </View>
          </>
        )}

        {/* Brand Colors */}
        {colors.brand && (
          <>
            <SubHeading color={fg}>Brand</SubHeading>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
              {Object.entries(colors.brand).map(([key, val]) => (
                <ColorSwatch key={key} label={key} color={val as string} />
              ))}
            </View>
          </>
        )}
      </CollapsibleSection>

      {/* ─── 3. Typography Tokens ────────── */}
      <CollapsibleSection
        title="3. Typography Tokens"
        isOpen={expanded.typography}
        onToggle={() => toggle('typography')}
        bg={cardBg}
        border={border}
        fg={fg}
      >
        <SubHeading color={fg}>Font Families</SubHeading>
        <TokenRow label="sans" value={typography.fontFamily.sans} />
        <TokenRow label="mono" value={typography.fontFamily.mono} />
        {typography.fontFamily.display && (
          <TokenRow label="display" value={typography.fontFamily.display} />
        )}

        <SubHeading color={fg}>Font Sizes (px × scale)</SubHeading>
        {Object.entries(typography.fontSize).map(([key, val]) => (
          <View key={key} style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 6 }}>
            <Text style={{ fontSize: 12, color: muted, width: 50 }}>{key}</Text>
            <Text style={{ fontSize: val * (typography.fontScale ?? 1), color: fg }}>
              Sample Text ({val}px → {(val * (typography.fontScale ?? 1)).toFixed(0)}px)
            </Text>
          </View>
        ))}

        <SubHeading color={fg}>Font Weights</SubHeading>
        {Object.entries(typography.fontWeight).map(([key, val]) => (
          <Text key={key} style={{ fontSize: 14, fontWeight: val as any, color: fg, paddingVertical: 4 }}>
            {key}: {val} — The quick brown fox
          </Text>
        ))}

        <SubHeading color={fg}>Scaled Base Font</SubHeading>
        <TokenRow label="useScaledFontSize('base')" value={`${scaledBase}px`} />
      </CollapsibleSection>

      {/* ─── 4. Spacing & Radius ─────────── */}
      <CollapsibleSection
        title="4. Spacing & Radius"
        isOpen={expanded.spacing}
        onToggle={() => toggle('spacing')}
        bg={cardBg}
        border={border}
        fg={fg}
      >
        <SubHeading color={fg}>Spacing Scale</SubHeading>
        {Object.entries(spacing).map(([key, val]) => (
          <View key={key} style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
            <Text style={{ fontSize: 11, color: muted, width: 40 }}>{key}</Text>
            <View
              style={{
                width: val as number,
                height: 16,
                backgroundColor: colors.primary[500],
                borderRadius: 2,
              }}
            />
            <Text style={{ fontSize: 11, color: muted, marginLeft: 8 }}>{val as number}px</Text>
          </View>
        ))}

        <SubHeading color={fg}>Border Radius</SubHeading>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
          {Object.entries(radius).map(([key, val]) => (
            <View key={key} style={{ alignItems: 'center' }}>
              <View
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: Math.min(val as number, 24),
                  backgroundColor: colors.primary[200],
                  borderWidth: 2,
                  borderColor: colors.primary[500],
                }}
              />
              <Text style={{ fontSize: 10, color: muted, marginTop: 4 }}>
                {key} ({val as number})
              </Text>
            </View>
          ))}
        </View>
      </CollapsibleSection>

      {/* ─── 5. Layout & Behavior ────────── */}
      <CollapsibleSection
        title="5. Layout & Behavior"
        isOpen={expanded.layout}
        onToggle={() => toggle('layout')}
        bg={cardBg}
        border={border}
        fg={fg}
      >
        <SubHeading color={fg}>Layout Tokens</SubHeading>
        <TokenRow label="sidebarWidth" value={`${layout.sidebarWidth}px`} />
        <TokenRow label="headerHeight" value={`${layout.headerHeight}px`} />
        <TokenRow label="maxContentWidth" value={`${layout.maxContentWidth}px`} />
        <TokenRow label="contentPadding" value={`${layout.contentPadding}px`} />
        <TokenRow label="cardRadius" value={`${layout.cardRadius ?? 'default'}px`} />
        <TokenRow label="buttonRadius" value={`${layout.buttonRadius ?? 'default'}px`} />

        <SubHeading color={fg}>Behavior Flags</SubHeading>
        <TokenRow label="animationsEnabled" value={behavior.animationsEnabled} />
        <TokenRow label="reducedMotion" value={behavior.reducedMotion} />
        <TokenRow label="highContrast" value={behavior.highContrast} />
        <TokenRow label="complianceWatermark" value={behavior.complianceWatermark} />
        <TokenRow label="auditTrailVisible" value={behavior.auditTrailVisible} />
        <TokenRow label="readOnlyMode" value={behavior.readOnlyMode} />
        <TokenRow label="autoLockTimeout" value={`${behavior.autoLockTimeout}s`} />
        <TokenRow label="minTouchTarget" value={`${behavior.minTouchTarget}px`} />

        <SubHeading color={fg}>Computed Hooks</SubHeading>
        <TokenRow label="useComplianceWatermark()" value={complianceWatermark} />
        <TokenRow label="useAnimationsEnabled()" value={animationsEnabled} />
        <TokenRow label="useIsDark()" value={isDark} />

        <SubHeading color={fg}>Branding</SubHeading>
        <TokenRow label="name" value={branding.name} />
        <TokenRow label="poweredBy" value={branding.poweredBy ?? '(none)'} />
        {branding.logoLight && <TokenRow label="logoLight" value={branding.logoLight} />}
        {branding.logoDark && <TokenRow label="logoDark" value={branding.logoDark} />}
      </CollapsibleSection>

      {/* ─── 6. Component Preview ────────── */}
      <CollapsibleSection
        title="6. Component Preview (Theme Styles)"
        isOpen={expanded.components}
        onToggle={() => toggle('components')}
        bg={cardBg}
        border={border}
        fg={fg}
      >
        <SubHeading color={fg}>useThemeStyles() — Pre-computed RN styles</SubHeading>

        {/* Screen Background */}
        <Text style={{ fontSize: 12, color: muted, marginBottom: 4 }}>screenBackground</Text>
        <View
          style={{
            ...themeStyles.screenBackground,
            flex: undefined,
            height: 60,
            borderRadius: 8,
            borderWidth: 1,
            borderColor: border,
            marginBottom: 16,
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          <Text style={themeStyles.textPrimary}>Screen Background</Text>
        </View>

        {/* Card */}
        <Text style={{ fontSize: 12, color: muted, marginBottom: 4 }}>cardStyle</Text>
        <View style={{ ...themeStyles.cardStyle, padding: 16, marginBottom: 16 }}>
          <Text style={themeStyles.textHeading}>Card Heading</Text>
          <Text style={{ ...themeStyles.textPrimary, marginTop: 4 }}>
            Primary body text in a themed card.
          </Text>
          <Text style={{ ...themeStyles.textMuted, marginTop: 2 }}>
            Muted secondary text.
          </Text>
        </View>

        {/* Button Primary */}
        <Text style={{ fontSize: 12, color: muted, marginBottom: 4 }}>buttonPrimary</Text>
        <View style={{ flexDirection: 'row', gap: 12, marginBottom: 16 }}>
          <Pressable style={{ ...themeStyles.buttonPrimary, alignItems: 'center' }}>
            <Text style={themeStyles.buttonPrimaryText}>Primary Button</Text>
          </Pressable>
          <Pressable
            style={{
              ...themeStyles.buttonPrimary,
              alignItems: 'center',
              backgroundColor: colors.secondary[500],
            }}
          >
            <Text style={themeStyles.buttonPrimaryText}>Secondary</Text>
          </Pressable>
          <Pressable
            style={{
              ...themeStyles.buttonPrimary,
              alignItems: 'center',
              backgroundColor: colors.error[500],
            }}
          >
            <Text style={themeStyles.buttonPrimaryText}>Destructive</Text>
          </Pressable>
        </View>

        {/* Divider */}
        <View style={themeStyles.divider} />

        {/* Shadow Preview */}
        <SubHeading color={fg}>Shadows</SubHeading>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 16 }}>
          {(['sm', 'md', 'lg', 'xl'] as const).map((size) => (
            <View
              key={size}
              style={{
                width: 80,
                height: 80,
                backgroundColor: cardBg,
                borderRadius: radius.lg,
                ...shadows[size],
                justifyContent: 'center',
                alignItems: 'center',
              }}
            >
              <Text style={{ fontSize: 12, color: fg, fontWeight: '600' }}>{size}</Text>
            </View>
          ))}
        </View>
      </CollapsibleSection>

      {/* ─── 7. Applied Layers Audit ─────── */}
      <CollapsibleSection
        title="7. Applied Layers (Audit Trail)"
        isOpen={expanded.layers}
        onToggle={() => toggle('layers')}
        bg={cardBg}
        border={border}
        fg={fg}
      >
        <SubHeading color={fg}>Resolution Context</SubHeading>
        <TokenRow label="baseTheme" value={context.baseTheme} />
        <TokenRow label="role" value={context.role ?? '(none)'} />
        <TokenRow label="environment" value={context.environment ?? '(none)'} />
        <TokenRow label="complianceMode" value={context.complianceMode ?? 'standard'} />
        <TokenRow label="tenantId" value={context.tenantId ?? '(none)'} />
        <TokenRow label="deploymentMode" value={context.deploymentMode ?? 'saas'} />

        <SubHeading color={fg}>Applied Layer IDs</SubHeading>
        {appliedLayers.length === 0 ? (
          <Text style={{ fontSize: 13, color: muted }}>No layers applied yet</Text>
        ) : (
          appliedLayers.map((layerId, idx) => (
            <View
              key={layerId}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                paddingVertical: 6,
                borderBottomWidth: idx < appliedLayers.length - 1 ? 1 : 0,
                borderBottomColor: colors.gray[100],
              }}
            >
              <View
                style={{
                  width: 24,
                  height: 24,
                  borderRadius: 12,
                  backgroundColor: colors.primary[100],
                  justifyContent: 'center',
                  alignItems: 'center',
                  marginRight: 10,
                }}
              >
                <Text style={{ fontSize: 11, fontWeight: '700', color: colors.primary[700] }}>
                  {idx + 1}
                </Text>
              </View>
              <Text
                style={{
                  fontSize: 13,
                  fontWeight: '500',
                  color: fg,
                  fontFamily: Platform.OS === 'web' ? 'monospace' : 'Menlo',
                }}
              >
                {layerId}
              </Text>
            </View>
          ))
        )}

        {/* Raw context JSON */}
        <SubHeading color={fg}>Raw Resolution Context</SubHeading>
        <View
          style={{
            backgroundColor: colors.gray[isDark ? 800 : 50],
            borderRadius: radius.md,
            padding: 12,
          }}
        >
          <Text
            style={{
              fontSize: 11,
              color: colors.gray[isDark ? 300 : 700],
              fontFamily: Platform.OS === 'web' ? 'monospace' : 'Menlo',
              lineHeight: 18,
            }}
          >
            {JSON.stringify(context, null, 2)}
          </Text>
        </View>
      </CollapsibleSection>

      {/* ─── Footer ──────────────────────── */}
      <View style={{ marginTop: 32, alignItems: 'center' }}>
        <Text style={{ fontSize: 12, color: muted }}>
          {branding.poweredBy ?? 'FactoryOS'} • Theme Engine v0.1.0
        </Text>
        <Text style={{ fontSize: 11, color: colors.gray[400], marginTop: 4 }}>
          Platform: {Platform.OS} • Width: {width}px • {isWide ? 'Desktop' : 'Mobile'} Layout
        </Text>
      </View>
    </ScrollView>
  );
}

/* ─── Small Helper Components ─────────────────── */

function StatusBadge({ label }: { label: string }) {
  const colors = useThemeColors();
  const radius = useThemeRadius();
  return (
    <View
      style={{
        backgroundColor: colors.surface?.muted ?? colors.gray[100],
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: radius.sm,
      }}
    >
      <Text
        style={{
          fontSize: 11,
          fontWeight: '600',
          color: colors.surface?.foreground ?? colors.gray[700],
        }}
      >
        {label}
      </Text>
    </View>
  );
}

function SubHeading({ children, color }: { children: string; color: string }) {
  return (
    <Text style={{ fontSize: 14, fontWeight: '600', color, marginTop: 16, marginBottom: 8 }}>
      {children}
    </Text>
  );
}

function CollapsibleSection({
  title,
  isOpen,
  onToggle,
  children,
  bg,
  border,
  fg,
}: {
  title: string;
  isOpen: boolean;
  onToggle: () => void;
  children: React.ReactNode;
  bg: string;
  border: string;
  fg: string;
}) {
  return (
    <View
      style={{
        backgroundColor: bg,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: border,
        marginBottom: 16,
        overflow: 'hidden',
      }}
    >
      <Pressable
        onPress={onToggle}
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: 16,
        }}
      >
        <Text style={{ fontSize: 16, fontWeight: '700', color: fg }}>{title}</Text>
        <Text style={{ fontSize: 18, color: fg }}>{isOpen ? '▾' : '▸'}</Text>
      </Pressable>
      {isOpen && (
        <View style={{ paddingHorizontal: 16, paddingBottom: 16 }}>{children}</View>
      )}
    </View>
  );
}
