import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import React, { useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useGlobalContext } from '@/lib/global-provider';
import { Ionicons } from '@expo/vector-icons';
import { registerAsAgent } from '@/lib/appwrite'; // Fungsi ini akan kita pastikan ada di appwrite.ts

const RegisterAgentScreen = () => {
    const { user, refetch } = useGlobalContext();
    const [storeName, setStoreName] = useState('');
    const [phoneNumber, setPhoneNumber] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async () => {
        if (!storeName || !phoneNumber) {
            Alert.alert("Data Tidak Lengkap", "Nama toko dan nomor telepon wajib diisi.");
            return;
        }
        if (!user) {
            Alert.alert("Error", "Anda tidak terdeteksi, silakan login ulang.");
            router.replace('/sign-in');
            return;
        }

        setIsSubmitting(true);
        try {
            await registerAsAgent(user.$id, {
                storeName,
                phoneNumber
            });
            
            // Penting: Muat ulang data pengguna agar status 'agent' diperbarui
            await refetch(); 
            
            Alert.alert(
                "Pendaftaran Berhasil!", 
                "Selamat, Anda kini telah menjadi agen. Anda akan diarahkan ke dasbor.",
                [{ text: "OK", onPress: () => router.replace('./agent') }]
            );

        } catch (error: any) {
            Alert.alert("Pendaftaran Gagal", error.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <SafeAreaView className="flex-1 bg-white">
            {/* Header */}
            <View className="flex-row items-center p-4 border-b border-gray-200">
                <TouchableOpacity onPress={() => router.back()} className="p-2">
                    <Ionicons name="arrow-back" size={28} color="#191D31" />
                </TouchableOpacity>
                <Text className="flex-1 text-center text-xl font-rubik-bold text-black-300 -ml-10">
                    Daftar Agen
                </Text>
            </View>

            <ScrollView contentContainerClassName="flex-grow justify-center items-center p-6">
                <View className="items-center w-full">
                    <Ionicons name="briefcase-sharp" size={80} color="#526346" />
                    <Text className="text-2xl font-rubik-bold text-black-300 mt-6 text-center">
                        Selangkah Lagi Menjadi Agen
                    </Text>
                    <Text className="text-base text-gray-500 text-center mt-2 mb-8">
                        Lengkapi data di bawah ini untuk mulai menjual produk Anda di GumisaQ.
                    </Text>

                    <View className="w-full space-y-4">
                        <TextInput
                            className="w-full bg-gray-100 px-4 py-4 rounded-xl text-base border border-gray-200 focus:border-primary-100"
                            placeholder="Nama Toko atau Nama Agen"
                            value={storeName}
                            onChangeText={setStoreName}
                        />
                        <TextInput
                            className="w-full bg-gray-100 px-4 py-4 rounded-xl text-base border border-gray-200 focus:border-primary-100"
                            placeholder="Nomor Telepon Aktif (WhatsApp)"
                            value={phoneNumber}
                            onChangeText={setPhoneNumber}
                            keyboardType="phone-pad"
                        />
                    </View>

                    <TouchableOpacity 
                        className={`w-full mt-8 py-4 rounded-full ${isSubmitting ? 'bg-gray-400' : 'bg-primary-100'}`}
                        onPress={handleSubmit}
                        disabled={isSubmitting}
                    >
                        {isSubmitting ? (
                            <ActivityIndicator color="white"/>
                        ) : (
                            <Text className="text-white text-center text-lg font-rubik-bold">Kirim Pendaftaran</Text>
                        )}
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
};

export default RegisterAgentScreen;
