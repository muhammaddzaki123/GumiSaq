import { useGlobalContext } from '@/lib/global-provider';
// UBAH FUNGSI YANG DIIMPOR
import { getFinishedDesigns } from '@/lib/appwrite'; 
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

// UBAH TIPE DATA UNTUK MENCOCOKKAN HASIL FINAL
type FinishedDesignItem = {
  $id: string;
  $createdAt: string;
  name?: string;
  imageUrl: string; // Ini adalah URL gambar yang sudah jadi
};

// --- KARTU PREVIEW YANG TELAH DIDISAIN ULANG ---
const FinishedDesignCard = ({ item }: { item: FinishedDesignItem }) => {
  return (
    <View className="bg-white rounded-lg shadow-sm overflow-hidden mb-4 border border-gray-200">
      {/* Tampilkan gambar langsung dari imageUrl */}
      <Image
        source={{ uri: item.imageUrl }}
        className="w-full h-48 bg-gray-100"
        resizeMode="contain"
      />
      <View className="p-4">
        <Text className="font-rubik-bold text-lg text-black-300">
          {item.name || `Desain-${item.$id.slice(-6)}`}
        </Text>
        <Text className="font-rubik text-xs text-gray-400 mt-2">
          Dibuat pada: {new Date(item.$createdAt).toLocaleDateString()}
        </Text>
      </View>
    </View>
  );
};

// --- KOMPONEN UTAMA HALAMAN ---
const MyDesignsScreen = () => {
  const { user } = useGlobalContext();

  // --- UBAH FUNGSI YANG DIGUNAKAN DI HOOK APPWRITE ---
  const { data: designs, loading, refetch } = useAppwrite({
    fn: () => getFinishedDesigns(user!.$id),
    skip: !user,
  });

  if (!user) {
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
          // Gunakan komponen kartu yang baru
          renderItem={({ item }) => <FinishedDesignCard item={item as unknown as FinishedDesignItem} />} 
          contentContainerStyle={{ padding: 16 }}
          ListEmptyComponent={() => (
            <View className="flex-1 justify-center items-center mt-20">
              <Ionicons name="color-palette-outline" size={80} color="#CBD5E0" />
              <Text className="text-xl font-rubik-bold text-gray-500 mt-4">Belum Ada Desain</Text>
              <Text className="text-base text-gray-400 mt-2 text-center">
                Buat dan finalisasi desain di editor baju untuk menyimpannya di sini.
              </Text>
            </View>
          )}
        />
      )}
    </View>
  );
};

export default MyDesignsScreen;