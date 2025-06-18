
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
import { loginUser } from "@/lib/appwrite";
import { useGlobalContext } from "@/lib/global-provider";

export default function SignIn() {
  const router = useRouter();
  const { refetch, loading, isLogged } = useGlobalContext();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Efek untuk mengarahkan pengguna yang sudah login ke halaman utama
  React.useEffect(() => {
    if (!loading && isLogged) {
      router.replace("/");
    }
  }, [loading, isLogged]);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert("Error", "Email dan password harus diisi.");
      return;
    }

    setIsSubmitting(true);

    try {
      await loginUser(email, password);
      // Jika login berhasil, panggil refetch untuk memperbarui konteks global
      await refetch();
      // Arahkan ke halaman utama setelah login berhasil
      router.replace("/");
      
    } catch (error: any) {
      Alert.alert("Error Login", error.message || "Terjadi kesalahan saat mencoba masuk.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
        <View className="flex-1 px-6 py-6 justify-center">
          {/* Logo */}
          <View className="items-center mb-8">
            <Image
              source={images.logoawal}
              className="w-[250px] h-[250px]"
              resizeMode="contain"
            />
          </View>

          {/* Welcome Text */}
          <View className="mb-6">
            <Text className="text-base text-center uppercase font-rubik text-gray-600">
              Selamat Datang di
            </Text>
            <Text className="text-3xl font-rubik-bold text-gray-900 text-center mt-2">
              GumisaQ
            </Text>
          </View>

          {/* Login Form */}
          <View className="space-y-4">
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
              onPress={handleLogin}
              disabled={isSubmitting}
              className={`rounded-full py-4 items-center mt-6 ${isSubmitting ? 'bg-primary-100/50' : 'bg-primary-100'}`}
            >
              <Text className="text-white text-lg font-rubik-medium">
                {isSubmitting ? 'Masuk...' : 'Masuk'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Link to Sign Up */}
          <View className="flex-row justify-center mt-6">
            <Text className="text-base text-gray-600 font-rubik">
              Belum punya akun?{' '}
            </Text>
            <TouchableOpacity onPress={() => router.push('/sign-up')}>
              <Text className="text-base text-primary-300 font-rubik-bold">
                Daftar
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}