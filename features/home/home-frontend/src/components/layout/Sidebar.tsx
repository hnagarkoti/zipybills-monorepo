import React from 'react';
import { View, Text, Pressable, ScrollView } from 'react-native';
import { Factory, PanelLeftClose, PanelLeftOpen } from 'lucide-react-native';

export interface NavItem {
  id: string;
  label: string;
  icon?: React.ReactNode;
  onPress?: () => void;
  isActive?: boolean;
}

export interface SidebarProps {
  items: NavItem[];
  collapsed?: boolean;
  onToggleCollapse?: () => void;
  title?: string;
  subtitle?: string;
  footer?: React.ReactNode;
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
      <View className="px-4 py-5 border-b border-slate-700 flex-row items-center">
        <Factory size={20} color="#34d399" />
        {!collapsed && (
          <Text className="text-lg font-bold text-emerald-400 ml-2">{title}</Text>
        )}
        {!collapsed && subtitle && (
          <Text className="text-xs text-slate-400 mt-1">{subtitle}</Text>
        )}
      </View>

      {/* Nav Items */}
      <ScrollView className="flex-1 py-2">
        {items.map((item) => (
          <Pressable
            key={item.id}
            onPress={item.onPress}
            className={`mx-2 my-0.5 px-3 py-2.5 rounded-lg flex-row items-center ${
              item.isActive ? 'bg-emerald-600/20' : 'bg-transparent'
            }`}
          >
            <View
              className={`w-8 h-8 rounded-md items-center justify-center ${
                item.isActive ? 'bg-emerald-500' : 'bg-slate-700'
              }`}
            >
              {item.icon ? (
                React.isValidElement(item.icon)
                  ? React.cloneElement(item.icon as React.ReactElement<{ color?: string }>, {
                      color: item.isActive ? '#ffffff' : '#cbd5e1',
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
          </Pressable>
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
