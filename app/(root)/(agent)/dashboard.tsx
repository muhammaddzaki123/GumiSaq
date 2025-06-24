import { Ionicons } from "@expo/vector-icons";
import { Href, Stack, useRouter } from 'expo-router';
import React from 'react';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { useGlobalContext } from '../../../lib/global-provider';
export default function AgentDashboard() {
  const router = useRouter();
  const { user } = useGlobalContext();

  if (!user || (user.userType !== 'agent' && user.userType !== 'admin')) {
    router.replace('/');
    return null;
  }

  interface MenuItem {
    title: string;
    description: string;
    route: Href<any>;
    icon: string;
  }

  const menuItems: MenuItem[] = [
    {
      title: 'Produk',
      description: 'Kelola produk yang Anda jual',
      route: '/(root)/(agent)/products' as const,
      icon: '🏪'
    },
    {
      title: 'Pesanan',
      description: 'Lihat dan kelola pesanan masuk',
      route: '/(root)/(agent)/orders' as const,
      icon: '📦'
    },
    {
      title: 'Laporan',
      description: 'Lihat laporan penjualan',
      route: '/(root)/(agent)/reports' as const,
      icon: '📊'
    },
    {
      title: 'Pengaturan Toko',
      description: 'Atur informasi toko Anda',
      route: '/(root)/(agent)/settings' as const,
      icon: '⚙️'
    }
  ];

  return (
    <View className="flex-1 bg-gray-50">
      <Stack.Screen
        options={{
          headerTitle: 'Dashboard Agen',
          headerTitleStyle: {
            fontFamily: 'Rubik-Medium',
          },
        }}
      />

      {/* Header */}
      <View className="px-5">
        <View className="flex flex-row items-center justify-between mt-5">
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={28} color="#191D31" />
          </TouchableOpacity>
          <Text className="text-xl font-rubik-bold text-black-300">Detail Profile</Text>
          <View style={{ width: 24 }} /> {/* Spacer */}
        </View>
      </View>

      <ScrollView className="flex-1 p-4">
        <View className="bg-primary-300 p-6 rounded-xl mb-6">
          <Text className="text-white font-rubik-bold text-xl mb-2">
            Selamat datang, {user.name}!
          </Text>
          <Text className="text-white font-rubik opacity-90">
            Kelola toko Anda dengan mudah
          </Text>
        </View>

        <View className="grid grid-cols-2 gap-4">
          {menuItems.map((item) => (
            <TouchableOpacity
              key={item.route}
              onPress={() => router.push(item.route)}
              className="bg-white p-4 rounded-xl shadow-sm border border-gray-100"
            >
              <Text className="text-3xl mb-3">{item.icon}</Text>
              <Text className="font-rubik-bold text-black-300 text-lg mb-1">
                {item.title}
              </Text>
              <Text className="font-rubik text-black-200 text-sm">
                {item.description}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <View className="mt-6 bg-white p-4 rounded-xl shadow-sm border border-gray-100">
          <Text className="font-rubik-bold text-black-300 text-lg mb-4">
            Ringkasan
          </Text>
          
          <View className="space-y-3">
            <View className="flex-row justify-between items-center">
              <Text className="font-rubik text-black-200">Total Produk</Text>
              <Text className="font-rubik-bold text-black-300">0</Text>
            </View>
            
            <View className="flex-row justify-between items-center">
              <Text className="font-rubik text-black-200">Pesanan Pending</Text>
              <Text className="font-rubik-bold text-black-300">0</Text>
            </View>
            
            <View className="flex-row justify-between items-center">
              <Text className="font-rubik text-black-200">Total Penjualan</Text>
              <Text className="font-rubik-bold text-black-300">Rp 0</Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}
