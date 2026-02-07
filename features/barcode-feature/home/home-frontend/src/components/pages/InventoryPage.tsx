import React from 'react';
import { View, Text, ScrollView, Pressable, TextInput } from 'react-native';

export function InventoryPage() {
  return (
    <ScrollView className="flex-1 bg-white">
      <View className="p-4">
        <Text className="text-2xl font-bold text-gray-900 mb-2">
          Inventory
        </Text>
        <Text className="text-base text-gray-500 mb-4">
          Manage and track your inventory items.
        </Text>

        {/* Search Bar */}
        <View className="bg-gray-50 rounded-xl px-4 py-3 flex-row items-center border border-gray-200 mb-4">
          <Text className="text-gray-400 mr-2">🔍</Text>
          <TextInput
            placeholder="Search items, SKUs, barcodes..."
            placeholderTextColor="#9CA3AF"
            className="flex-1 text-sm text-gray-900"
          />
        </View>

        {/* Stats Row */}
        <View className="flex-row mb-4 -mx-1.5">
          {[
            { label: 'Total Items', value: '3,421', color: 'bg-primary-50' },
            { label: 'Low Stock', value: '18', color: 'bg-yellow-50' },
            { label: 'Out of Stock', value: '3', color: 'bg-red-50' },
          ].map((stat, i) => (
            <View key={i} className="flex-1 px-1.5">
              <View className={`${stat.color} rounded-xl p-3 items-center`}>
                <Text className="text-lg font-bold text-gray-900">
                  {stat.value}
                </Text>
                <Text className="text-xs text-gray-500">{stat.label}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* Category Filters */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          className="mb-4"
        >
          {['All', 'Electronics', 'Food & Beverage', 'Office', 'Clothing'].map(
            (cat, i) => (
              <Pressable
                key={i}
                className={`mr-2 px-4 py-2 rounded-full ${
                  i === 0
                    ? 'bg-primary'
                    : 'bg-gray-100'
                }`}
              >
                <Text
                  className={`text-sm font-medium ${
                    i === 0 ? 'text-white' : 'text-gray-600'
                  }`}
                >
                  {cat}
                </Text>
              </Pressable>
            ),
          )}
        </ScrollView>

        {/* Inventory List */}
        <View className="bg-white rounded-xl border border-gray-100">
          {[
            {
              name: 'Wireless Mouse',
              sku: 'SKU-1001',
              qty: 245,
              status: 'In Stock',
            },
            {
              name: 'USB-C Cable',
              sku: 'SKU-1002',
              qty: 12,
              status: 'Low Stock',
            },
            {
              name: 'Laptop Stand',
              sku: 'SKU-1003',
              qty: 89,
              status: 'In Stock',
            },
            {
              name: 'Mechanical Keyboard',
              sku: 'SKU-1004',
              qty: 0,
              status: 'Out of Stock',
            },
            {
              name: 'Monitor Arm',
              sku: 'SKU-1005',
              qty: 156,
              status: 'In Stock',
            },
          ].map((item, i) => (
            <Pressable
              key={i}
              className={`flex-row items-center px-4 py-3 ${
                i > 0 ? 'border-t border-gray-100' : ''
              }`}
            >
              <View className="w-10 h-10 rounded-lg bg-gray-100 items-center justify-center mr-3">
                <Text className="text-sm">📦</Text>
              </View>
              <View className="flex-1">
                <Text className="text-sm font-medium text-gray-900">
                  {item.name}
                </Text>
                <Text className="text-xs text-gray-400">{item.sku}</Text>
              </View>
              <View className="items-end">
                <Text className="text-sm font-semibold text-gray-900">
                  {item.qty}
                </Text>
                <Text
                  className={`text-xs ${
                    item.status === 'In Stock'
                      ? 'text-green-600'
                      : item.status === 'Low Stock'
                        ? 'text-yellow-600'
                        : 'text-red-500'
                  }`}
                >
                  {item.status}
                </Text>
              </View>
            </Pressable>
          ))}
        </View>
      </View>
    </ScrollView>
  );
}
