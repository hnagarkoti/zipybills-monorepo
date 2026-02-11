import React, { useState } from 'react';
import { View, Text, Pressable, ScrollView } from 'react-native';
import { Factory, PanelLeftClose, PanelLeftOpen, ChevronDown, ChevronRight } from 'lucide-react-native';

export interface NavItem {
  id: string;
  label: string;
  icon?: React.ReactNode;
  onPress?: () => void;
  isActive?: boolean;
  /** Nested sub-items shown as a collapsible dropdown */
  children?: NavItem[];
}

export interface SidebarProps {
  items: NavItem[];
  collapsed?: boolean;
  onToggleCollapse?: () => void;
  title?: string;
  subtitle?: string;
  footer?: React.ReactNode;
}

/* ─── Single nav row (icon + label) ────────────── */

function NavItemRow({ item, collapsed, indent = false }: { item: NavItem; collapsed: boolean; indent?: boolean }) {
  return (
    <View className={`flex-row items-center ${indent ? 'ml-4' : ''}`}>
      <View
        className={`w-8 h-8 rounded-md items-center justify-center ${
          item.isActive ? 'bg-emerald-500' : indent ? 'bg-slate-800' : 'bg-slate-700'
        }`}
      >
        {item.icon ? (
          React.isValidElement(item.icon)
            ? React.cloneElement(item.icon as React.ReactElement<{ color?: string; size?: number }>, {
                color: item.isActive ? '#ffffff' : '#cbd5e1',
                ...(indent ? { size: 14 } : {}),
              })
            : <Text className={`text-sm ${item.isActive ? 'text-white' : 'text-slate-300'}`}>{String(item.icon)}</Text>
        ) : (
          <Text className={`text-sm font-bold ${item.isActive ? 'text-white' : 'text-slate-300'}`}>
            {item.label.charAt(0)}
          </Text>
        )}
      </View>
      {!collapsed && (
        <Text
          className={`ml-3 text-sm font-medium ${
            item.isActive ? 'text-emerald-400' : 'text-slate-300'
          }`}
        >
          {item.label}
        </Text>
      )}
    </View>
  );
}

/* ─── Nav entry: supports collapsible children ─── */

function NavEntry({ item, collapsed }: { item: NavItem; collapsed: boolean }) {
  const hasChildren = item.children && item.children.length > 0;
  const anyChildActive = hasChildren && item.children!.some((c) => c.isActive);
  // Auto-expand when a child is active
  const [expanded, setExpanded] = useState(item.isActive || anyChildActive);

  // If parent or child is active, ensure the group stays expanded
  React.useEffect(() => {
    if (item.isActive || anyChildActive) setExpanded(true);
  }, [item.isActive, anyChildActive]);

  if (!hasChildren) {
    // Simple nav item – no dropdown
    return (
      <Pressable
        onPress={item.onPress}
        className={`mx-2 my-0.5 px-3 py-2.5 rounded-lg flex-row items-center ${
          item.isActive ? 'bg-emerald-600/20' : 'bg-transparent'
        }`}
      >
        <NavItemRow item={item} collapsed={collapsed} />
      </Pressable>
    );
  }

  // Parent with children – collapsible group
  return (
    <View>
      <Pressable
        onPress={() => {
          setExpanded((prev) => !prev);
          // Also navigate to the parent route
          item.onPress?.();
        }}
        className={`mx-2 my-0.5 px-3 py-2.5 rounded-lg flex-row items-center justify-between ${
          item.isActive || anyChildActive ? 'bg-emerald-600/20' : 'bg-transparent'
        }`}
      >
        <NavItemRow item={item} collapsed={collapsed} />
        {!collapsed && (
          expanded
            ? <ChevronDown size={14} color="#94a3b8" />
            : <ChevronRight size={14} color="#94a3b8" />
        )}
      </Pressable>

      {/* Children */}
      {expanded && !collapsed && item.children!.map((child) => (
        <Pressable
          key={child.id}
          onPress={child.onPress}
          className={`mx-2 my-0.5 px-3 py-2 rounded-lg flex-row items-center ${
            child.isActive ? 'bg-emerald-600/20' : 'bg-transparent'
          }`}
        >
          <NavItemRow item={child} collapsed={collapsed} indent />
        </Pressable>
      ))}
    </View>
  );
}

export function Sidebar({
  items,
  collapsed = false,
  onToggleCollapse,
  title = 'FactoryOS',
  subtitle,
  footer,
}: SidebarProps) {
  return (
    <View
      className={`bg-slate-900 h-full ${collapsed ? 'w-16' : 'w-64'}`}
    >
      {/* Brand */}
      <View className="px-4 py-5 border-b border-slate-700">
        <View className="flex-row items-center">
          <View className="w-9 h-9 bg-emerald-500/20 rounded-lg items-center justify-center">
            <Factory size={20} color="#34d399" />
          </View>
          {!collapsed && (
            <Text className="text-lg font-bold text-emerald-400 ml-2.5">{title}</Text>
          )}
        </View>
        {!collapsed && subtitle && (
          <Text className="text-xs text-slate-400 mt-2 ml-0.5" numberOfLines={1}>{subtitle}</Text>
        )}
      </View>

      {/* Nav Items */}
      <ScrollView className="flex-1 py-2">
        {items.map((item) => (
          <NavEntry key={item.id} item={item} collapsed={collapsed} />
        ))}
      </ScrollView>

      {/* Collapse Toggle */}
      {onToggleCollapse && (
        <Pressable
          onPress={onToggleCollapse}
          className="mx-2 mb-2 px-3 py-2.5 rounded-lg items-center bg-slate-800 flex-row justify-center"
        >
          {collapsed
            ? <PanelLeftOpen size={16} color="#94a3b8" />
            : <><PanelLeftClose size={16} color="#94a3b8" /><Text className="text-xs text-slate-400 font-medium ml-2">Collapse</Text></>}
        </Pressable>
      )}

      {footer && (
        <View className="px-4 py-3 border-t border-slate-700">{footer}</View>
      )}
    </View>
  );
}
