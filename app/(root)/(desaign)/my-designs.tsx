import { useGlobalContext } from '@/lib/global-provider';
import { getSavedDesigns } from '@/lib/appwrite';
import { useAppwrite } from '@/lib/useAppwrite';
import { Ionicons } from '@expo/vector-icons';
import { Stack, router } from 'expo-router';
import React from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

// Komponen untuk menampilkan preview satu desain
type DesignItem = {
  $id: string;
  $createdAt: string;
  name?: string;
  shirtColor?: string;
  elements?: string;
};

const DesignPreviewCard = ({ item }: { item: DesignItem }) => {
  // Parse elemen JSON dari string
  const elements = JSON.parse(item.elements || '[]');

  return (
    <View className="bg-white rounded-lg shadow-sm overflow-hidden mb-4">
      <View className="p-4 bg-gray-100 justify-center items-center h-48">
        <Image
          source={require('@/assets/images/baju_polos.png')}
          style={{ tintColor: item.shirtColor }}
          className="w-32 h-32"
          resizeMode="contain"
        />
        {/* Anda bisa menambahkan logika untuk merender beberapa stiker/teks di sini jika diperlukan */}
      </View>
      <View className="p-4">
        <Text className="font-rubik-bold text-lg text-black-300">
          {item.name || `Desain-${item.$id.slice(-6)}`}
        </Text>
        <Text className="font-rubik text-sm text-gray-500 mt-1">
          {elements.length} elemen
        </Text>
        <Text className="font-rubik text-xs text-gray-400 mt-2">
          Dibuat pada: {new Date(item.$createdAt).toLocaleDateString()}
        </Text>
        <TouchableOpacity className="bg-primary-100 p-3 rounded-lg mt-4 items-center">
          <Text className="text-white font-rubik-bold">Gunakan Desain Ini</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

// Komponen utama halaman
const MyDesignsScreen = () => {
  const { user } = useGlobalContext();

  // Mengambil data desain menggunakan custom hook
  const { data: designs, loading, refetch } = useAppwrite({
    fn: () => getSavedDesigns(user!.$id),
    skip: !user,
  });

  if (!user) {
    // Pengaman jika pengguna tidak login
    return (
      <View className="flex-1 justify-center items-center bg-gray-50 p-5">
        <Text className="text-xl font-rubik-bold text-center">Anda harus login untuk melihat halaman ini.</Text>
        <TouchableOpacity onPress={() => router.push('/sign-in')} className="mt-5 bg-primary-100 px-4 py-2 rounded-lg">
            <Text className="text-white font-rubik-medium">Login</Text>
        </TouchableOpacity>
      </View>
    )
  }

  return (
    <View className="flex-1 bg-gray-50">
      <Stack.Screen options={{ headerShown: false }} />
      {/* Header Halaman */}
      <View className="flex-row items-center justify-between p-4 bg-white border-b border-gray-200">
        <TouchableOpacity onPress={() => router.back()} className="p-2">
          <Ionicons name="arrow-back" size={24} color="#191D31" />
        </TouchableOpacity>
        <Text className="text-xl font-rubik-bold text-black-300">Desain Saya</Text>
        <View className="w-10" />
      </View>

      {/* Konten Halaman */}
      {loading ? (
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color="#526346" />
        </View>
      ) : (
        <FlatList
          data={designs}
          keyExtractor={(item) => item.$id}
          renderItem={({ item }) => <DesignPreviewCard item={item} />}
          contentContainerStyle={{ padding: 16 }}
          ListEmptyComponent={() => (
            <View className="flex-1 justify-center items-center mt-20">
              <Ionicons name="color-palette-outline" size={80} color="#CBD5E0" />
              <Text className="text-xl font-rubik-bold text-gray-500 mt-4">Belum Ada Desain</Text>
              <Text className="text-base text-gray-400 mt-2 text-center">
                Mulai buat desain di editor baju untuk menyimpannya di sini.
              </Text>
            </View>
          )}
        />
      )}
    </View>
  );
};

export default MyDesignsScreen;