import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  Alert,
  Image,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import images from "@/constants/images";
import { createUser, loginUser } from "@/lib/appwrite";
import { useGlobalContext } from "@/lib/global-provider";

export default function SignUp() {
  const router = useRouter();
  const { refetch } = useGlobalContext();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleRegister = async () => {
    if (!name || !email || !password) {
      Alert.alert("Error", "Semua kolom harus diisi");
      return;
    }

    setIsSubmitting(true);

    try {
      // Buat pengguna baru di database
      const newUser = await createUser(email, password, name);

      if (newUser) {
        // Setelah berhasil mendaftar, langsung coba login
        const loggedIn = await loginUser(email, password);
        if (loggedIn) {
          refetch(); // Ambil ulang data pengguna global
          router.replace("/"); // Arahkan ke halaman utama
        } else {
           Alert.alert("Error", "Pendaftaran berhasil, tetapi gagal login otomatis. Silakan coba masuk dari halaman login.");
           router.replace("/sign-in");
        }
      }
    } catch (error: any) {
      Alert.alert("Error", error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
        <View className="flex-1 px-6 py-6">
          {/* Logo */}
          <View className="items-center mb-8">
            <Image
              source={images.logoawal}
              className="w-[200px] h-[200px]"
              resizeMode="contain"
            />
          </View>

          {/* Welcome Text */}
          <View className="mb-6">
            <Text className="text-3xl font-rubik-bold text-gray-900 text-center">
              Daftar Akun Baru
            </Text>
            <Text className="text-base text-center font-rubik text-gray-600 mt-2">
              Buat akun untuk memulai Belanja Anda di GumisaQ.
            </Text>
          </View>

          {/* Registration Form */}
          <View className="space-y-4">
            <TextInput
              placeholder="Nama Lengkap"
              value={name}
              onChangeText={setName}
              className="border border-gray-300 rounded-md px-4 py-3 text-base mb-2"
            />
            <TextInput
              placeholder="Email"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              className="border border-gray-300 rounded-md px-4 py-3 text-base mb-2"
            />
            <TextInput
              placeholder="Password"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              className="border border-gray-300 rounded-md px-4 py-3 text-base"
            />
            <TouchableOpacity
              onPress={handleRegister}
              disabled={isSubmitting}
              className={`rounded-full py-4 items-center mt-6 ${isSubmitting ? 'bg-primary-100/50' : 'bg-primary-100'}`}
            >
              <Text className="text-white text-lg font-rubik-medium">
                {isSubmitting ? 'Mendaftar...' : 'Daftar'}
              </Text>
            </TouchableOpacity>
          </View>
          
          {/* Link to Sign In */}
          <View className="flex-row justify-center mt-6">
             <Text className="text-base text-gray-600 font-rubik">Sudah punya akun? </Text>
             <TouchableOpacity onPress={() => router.push('/sign-in')}>
                <Text className="text-base text-primary-300 font-rubik-bold">Masuk</Text>
             </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}