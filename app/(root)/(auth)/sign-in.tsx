import { Ionicons } from '@expo/vector-icons';
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import icons from "@/constants/icons";
import images from "@/constants/images";
import { loginUser } from "@/lib/appwrite";
import { useGlobalContext } from "@/lib/global-provider";

export default function SignIn() {
  const router = useRouter();
  const { refetch, loading, isLogged } = useGlobalContext();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

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
      await refetch();
      router.replace("/");
    } catch (error: any) {
      Alert.alert("Error Login", error.message || "Terjadi kesalahan saat mencoba masuk.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.content}>
          <Image
            source={images.logoawal}
            style={styles.logo}
            resizeMode="contain"
          />

          <Text style={styles.title}>Selamat Datang Kembali</Text>
          <Text style={styles.subtitle}>Masuk untuk melanjutkan ke GumiSaQ</Text>

          {/* Form Inputs */}
          <View style={styles.form}>
            <View style={styles.inputContainer}>
              <Ionicons name="mail-outline" size={20} color="#6B7280" style={styles.inputIcon} />
              <TextInput
                placeholder="Email"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                style={styles.input}
                placeholderTextColor="#6B7280"
              />
            </View>
            <View style={styles.inputContainer}>
               <Ionicons name="lock-closed-outline" size={20} color="#6B7280" style={styles.inputIcon} />
              <TextInput
                placeholder="Password"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!isPasswordVisible}
                style={styles.input}
                 placeholderTextColor="#6B7280"
              />
              <TouchableOpacity onPress={() => setIsPasswordVisible(!isPasswordVisible)} style={styles.eyeIcon}>
                <Ionicons name={isPasswordVisible ? "eye-off-outline" : "eye-outline"} size={22} color="#6B7280" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Submit Button */}
          <TouchableOpacity
            onPress={handleLogin}
            disabled={isSubmitting}
            style={[styles.button, isSubmitting && styles.buttonDisabled]}
          >
            <Text style={styles.buttonText}>
              {isSubmitting ? 'Memproses...' : 'Masuk'}
            </Text>
          </TouchableOpacity>
          
          {/* Divider */}
          <View style={styles.dividerContainer}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>ATAU</Text>
            <View style={styles.dividerLine} />
          </View>

          {/* Social Login */}
          <TouchableOpacity style={styles.socialButton}>
            <Image source={icons.google} style={styles.socialIcon} resizeMode="contain" />
            <Text style={styles.socialButtonText}>Lanjutkan dengan Google</Text>
          </TouchableOpacity>
          
          {/* Sign Up Link */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>Belum punya akun? </Text>
            <TouchableOpacity onPress={() => router.push('/sign-up')}>
              <Text style={[styles.footerText, styles.linkText]}>Daftar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  content: {
    paddingHorizontal: 24,
    paddingVertical: 20,
  },
  logo: {
    width: 150,
    height: 150,
    alignSelf: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontFamily: 'Rubik-Bold',
    color: '#1F2937',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    fontFamily: 'Rubik-Regular',
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 32,
  },
  form: {
    gap: 16,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingHorizontal: 16,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    height: 50,
    fontSize: 16,
    fontFamily: 'Rubik-Regular',
    color: '#1F2937',
  },
  eyeIcon: {
    padding: 4,
  },
  button: {
    backgroundColor: '#526346',
    borderRadius: 99,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 24,
  },
  buttonDisabled: {
    backgroundColor: '#A1A1AA',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontFamily: 'Rubik-Bold',
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 32,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#E5E7EB',
  },
  dividerText: {
    marginHorizontal: 12,
    fontFamily: 'Rubik-Medium',
    color: '#9CA3AF',
    fontSize: 12,
  },
  socialButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'white',
    borderRadius: 99,
    paddingVertical: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    gap: 12,
  },
  socialIcon: {
    width: 24,
    height: 24,
  },
  socialButtonText: {
    color: '#374151',
    fontSize: 16,
    fontFamily: 'Rubik-Medium',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 32,
  },
  footerText: {
    fontSize: 14,
    fontFamily: 'Rubik-Regular',
    color: '#6B7280',
  },
  linkText: {
    fontFamily: 'Rubik-Bold',
    color: '#526346',
  },
});