import { Stack, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Alert, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { config, databases } from '../../../../lib/appwrite';
import { useGlobalContext } from '../../../../lib/global-provider';

interface AgentProfile {
  name: string;
  phone: string;
  description?: string;
  address?: string;
  businessHours?: string;
}

export default function AgentSettings() {
  const router = useRouter();
  const { user } = useGlobalContext();
  const [profile, setProfile] = useState<AgentProfile>({
    name: '',
    phone: '',
    description: '',
    address: '',
    businessHours: ''
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user || (user.userType !== 'agent' && user.userType !== 'admin')) {
      router.replace('/');
      return;
    }
    loadProfile();
  }, [user]);

  const loadProfile = async () => {
    if (!user) return;
    
    try {
      const doc = await databases.getDocument(
        config.databaseId!,
        config.agentsCollectionId!,
        user.$id
      );

      setProfile({
        name: doc.name || '',
        phone: doc.phone || '',
        description: doc.description || '',
        address: doc.address || '',
        businessHours: doc.businessHours || ''
      });
    } catch (error) {
      console.error('Error loading profile:', error);
      Alert.alert('Error', 'Gagal memuat profil');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!user) return;
    
    if (!profile.name.trim() || !profile.phone.trim()) {
      Alert.alert('Error', 'Nama toko dan nomor telepon harus diisi');
      return;
    }

    try {
      setSaving(true);
      await databases.updateDocument(
        config.databaseId!,
        config.agentsCollectionId!,
        user.$id,
        {
          name: profile.name.trim(),
          phone: profile.phone.trim(),
          description: profile.description?.trim() || '',
          address: profile.address?.trim() || '',
          businessHours: profile.businessHours?.trim() || ''
        }
      );
      Alert.alert('Sukses', 'Profil berhasil diperbarui');
    } catch (error) {
      console.error('Error saving profile:', error);
      Alert.alert('Error', 'Gagal menyimpan profil');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-gray-50">
        <Text className="text-black-300 font-rubik">Memuat...</Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-gray-50">
      <Stack.Screen
        options={{
          headerTitle: 'Pengaturan Toko',
          headerTitleStyle: {
            fontFamily: 'Rubik-Medium',
          },
        }}
      />

      <ScrollView className="flex-1 p-4">
        <View className="bg-white p-4 rounded-xl shadow-sm space-y-4">
          <View>
            <Text className="font-rubik-medium text-black-300 mb-1">
              Nama Toko *
            </Text>
            <TextInput
              className="w-full px-4 py-2 border border-gray-200 rounded-lg font-rubik"
              placeholder="Masukkan nama toko"
              value={profile.name}
              onChangeText={(text) => setProfile(prev => ({ ...prev, name: text }))}
            />
          </View>

          <View>
            <Text className="font-rubik-medium text-black-300 mb-1">
              Nomor Telepon *
            </Text>
            <TextInput
              className="w-full px-4 py-2 border border-gray-200 rounded-lg font-rubik"
              placeholder="Masukkan nomor telepon"
              value={profile.phone}
              onChangeText={(text) => setProfile(prev => ({ ...prev, phone: text }))}
              keyboardType="phone-pad"
            />
          </View>

          <View>
            <Text className="font-rubik-medium text-black-300 mb-1">
              Deskripsi Toko
            </Text>
            <TextInput
              className="w-full px-4 py-2 border border-gray-200 rounded-lg font-rubik"
              placeholder="Masukkan deskripsi toko"
              value={profile.description}
              onChangeText={(text) => setProfile(prev => ({ ...prev, description: text }))}
              multiline
              numberOfLines={4}
            />
          </View>

          <View>
            <Text className="font-rubik-medium text-black-300 mb-1">
              Alamat
            </Text>
            <TextInput
              className="w-full px-4 py-2 border border-gray-200 rounded-lg font-rubik"
              placeholder="Masukkan alamat toko"
              value={profile.address}
              onChangeText={(text) => setProfile(prev => ({ ...prev, address: text }))}
              multiline
              numberOfLines={3}
            />
          </View>

          <View>
            <Text className="font-rubik-medium text-black-300 mb-1">
              Jam Operasional
            </Text>
            <TextInput
              className="w-full px-4 py-2 border border-gray-200 rounded-lg font-rubik"
              placeholder="Contoh: Senin-Jumat, 09:00-17:00"
              value={profile.businessHours}
              onChangeText={(text) => setProfile(prev => ({ ...prev, businessHours: text }))}
            />
          </View>

          <TouchableOpacity
            onPress={handleSave}
            disabled={saving}
            className={`w-full py-3 rounded-lg ${saving ? 'bg-gray-400' : 'bg-primary-300'}`}
          >
            <Text className="text-center text-white font-rubik-bold">
              {saving ? 'Menyimpan...' : 'Simpan Perubahan'}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}
