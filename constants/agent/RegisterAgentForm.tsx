import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { registerAsAgent } from '../../lib/appwrite';
import { useGlobalContext } from '../../lib/global-provider';

export const RegisterAgentForm = ({ onSuccess }: { onSuccess?: () => void }) => {
  const router = useRouter();
  const [storeName, setStoreName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const { user, refetch } = useGlobalContext();

  const handleSubmit = async () => {
    if (!storeName || !phoneNumber) {
      Alert.alert('Error', 'Semua field harus diisi');
      return;
    }

    try {
      setLoading(true);
      await registerAsAgent(user?.$id || '', {
        storeName,
        phoneNumber
      });
      await refetch(); // Refresh user data to update userType
      Alert.alert('Sukses', 'Pendaftaran agen berhasil!');
      onSuccess?.();
      router.push('/(root)/(agent)/dashboard');
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Gagal mendaftar sebagai agen');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View className="p-4 bg-white rounded-lg shadow-sm">
      <Text className="text-2xl font-rubik-bold mb-4 text-black-300">
        Daftar Sebagai Agen
      </Text>
      
      <View className="space-y-4">
        <View>
          <Text className="text-sm font-rubik-medium text-black-300 mb-1">
            Nama Toko
          </Text>
          <TextInput
            className="w-full px-4 py-2 border border-gray-200 rounded-lg font-rubik"
            placeholder="Masukkan nama toko"
            value={storeName}
            onChangeText={setStoreName}
          />
        </View>

        <View>
          <Text className="text-sm font-rubik-medium text-black-300 mb-1">
            Nomor Telepon
          </Text>
          <TextInput
            className="w-full px-4 py-2 border border-gray-200 rounded-lg font-rubik"
            placeholder="Masukkan nomor telepon"
            value={phoneNumber}
            onChangeText={setPhoneNumber}
            keyboardType="phone-pad"
          />
        </View>

        <TouchableOpacity
          onPress={handleSubmit}
          disabled={loading}
          className={`w-full py-3 rounded-lg ${loading ? 'bg-gray-400' : 'bg-primary-300'}`}
        >
          <Text className="text-center text-white font-rubik-bold">
            {loading ? 'Memproses...' : 'Daftar Sekarang'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};
