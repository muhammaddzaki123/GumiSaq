import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
  ActivityIndicator,
  Image,
} from "react-native";
import React, { useState, useEffect, useMemo } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { router, useFocusEffect } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useGlobalContext } from "@/lib/global-provider";
import { useAppwrite } from "@/lib/useAppwrite";
import {
  createOrder,
  getCartItems,
  getPropertyById,
  getUserAddresses,
} from "@/lib/appwrite";

const CheckoutScreen = () => {
  const { user } = useGlobalContext();
  const [selectedAddress, setSelectedAddress] = useState<string | null>(null);
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);
  
  // Hook untuk mengambil daftar alamat pengguna
  const { data: addresses, refetch: refetchAddresses } = useAppwrite({
    fn: () => getUserAddresses(user!.$id),
    skip: !user,
  });

  // Hook untuk mengambil item di keranjang
  const { data: cartItems, loading: cartLoading } = useAppwrite({
    fn: () => getCartItems(user!.$id),
    skip: !user,
  });

  const [mergedData, setMergedData] = useState<any[]>([]);

  // Gunakan useFocusEffect untuk memuat ulang alamat setiap kali halaman ini menjadi fokus.
  // Ini memastikan alamat yang baru ditambahkan akan langsung muncul.
  useFocusEffect(
    React.useCallback(() => {
      if (user) {
        refetchAddresses();
      }
    }, [user])
  );

  // Set alamat default ketika daftar alamat berhasil dimuat
  useEffect(() => {
    if (addresses && addresses.length > 0 && !selectedAddress) {
      // Pilih alamat pertama sebagai default
      setSelectedAddress(addresses[0].detail);
    } else if (addresses && addresses.length === 0) {
      setSelectedAddress(null);
    }
  }, [addresses]);

  // Gabungkan data keranjang dengan detail produknya
  useEffect(() => {
    const mergeData = async () => {
      if (cartItems) {
        const promises = cartItems.map(async (cartItem) => {
          const product = await getPropertyById({ id: cartItem.productId });
          return { ...cartItem, product };
        });
        const results = await Promise.all(promises);
        setMergedData(results.filter((item) => item.product));
      }
    };
    mergeData();
  }, [cartItems]);

  // Hitung total harga
  const { subtotal, biayaPengiriman, grandTotal } = useMemo(() => {
    const sub = mergedData.reduce((sum, item) => {
      const price = item.product?.price || 0;
      return sum + price * item.quantity;
    }, 0);
    const shipping = sub > 0 ? 5 : 0;
    return {
      subtotal: sub,
      biayaPengiriman: shipping,
      grandTotal: sub + shipping,
    };
  }, [mergedData]);

  // Fungsi untuk memproses pesanan
  const handlePlaceOrder = async () => {
    if (!user) {
      Alert.alert("Error", "Sesi Anda telah berakhir, silakan masuk kembali.");
      router.replace("/sign-in");
      return;
    }
    if (!selectedAddress) {
      Alert.alert(
        "Alamat Kosong",
        "Silakan pilih atau tambahkan alamat pengiriman terlebih dahulu.",
        [{ text: "OK", onPress: () => router.push('/address-manager') }]
      );
      return;
    }

    setIsPlacingOrder(true);
    try {
      const orderId = await createOrder(user.$id, selectedAddress, grandTotal, mergedData);
      router.replace({ pathname: "/order-confirmation", params: { orderId } });
    } catch (error: any) {
      Alert.alert("Gagal Membuat Pesanan", error.message);
    } finally {
      setIsPlacingOrder(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={{ padding: 8 }}>
          <Ionicons name="arrow-back" size={28} color="#191D31" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Checkout</Text>
        <View style={{ width: 44 }} />
      </View>

      {cartLoading ? (
        <ActivityIndicator size="large" style={{ marginTop: 50 }} />
      ) : (
        <ScrollView contentContainerStyle={{ paddingBottom: 180 }}>
          <View style={{ paddingHorizontal: 20 }}>
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Alamat Pengiriman</Text>
              <TouchableOpacity
                style={styles.addressBox}
                onPress={() => router.push("/address-manager?fromCheckout=true")}
              >
                <Ionicons name="location-outline" size={32} color="#526346" style={{ marginRight: 16 }} />
                <View style={{ flex: 1 }}>
                  {selectedAddress ? (
                    <>
                      <Text style={styles.addressName}>{user?.name}</Text>
                      <Text style={styles.addressText} numberOfLines={2}>{selectedAddress}</Text>
                    </>
                  ) : (
                    <Text style={styles.addressText}>
                      Belum ada alamat. Ketuk untuk menambah.
                    </Text>
                  )}
                </View>
                <Ionicons name="chevron-forward" size={24} color="#888" />
              </TouchableOpacity>
            </View>

            <View style={[styles.section, { backgroundColor: 'white', padding: 20, borderRadius: 16, elevation: 2, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 10 }]}>
              <Text style={styles.sectionTitle}>Ringkasan Pesanan</Text>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Subtotal ({mergedData.length} item)</Text>
                <Text style={styles.summaryValue}>Rp.{subtotal.toFixed(2)}</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Biaya Pengiriman</Text>
                <Text style={styles.summaryValue}>Rp.{biayaPengiriman.toFixed(2)}</Text>
              </View>
              <View style={styles.divider} />
              <View style={styles.summaryRow}>
                <Text style={[styles.summaryLabel, { fontFamily: 'Rubik-Bold' }]}>Total</Text>
                <Text style={[styles.summaryValue, { fontFamily: 'Rubik-Bold', fontSize: 18, color: '#526346' }]}>${grandTotal.toFixed(2)}</Text>
              </View>
            </View>
          </View>
        </ScrollView>
      )}

      <View style={styles.footer}>
        <TouchableOpacity
          onPress={handlePlaceOrder}
          style={[styles.primaryButton, (isPlacingOrder || mergedData.length === 0) && { backgroundColor: '#AAB1A5' }]}
          disabled={isPlacingOrder || mergedData.length === 0}
        >
          {isPlacingOrder ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text style={styles.primaryButtonText}>Buat Pesanan</Text>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FA' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    paddingVertical: 12,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#EEE'
  },
  headerTitle: { fontSize: 22, fontFamily: 'Rubik-ExtraBold', color: '#191D31' },
  section: { marginTop: 24 },
  sectionTitle: { fontSize: 18, fontFamily: 'Rubik-Bold', color: '#333', marginBottom: 12 },
  addressBox: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    elevation: 2, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 10 
  },
  addressName: { fontSize: 16, fontFamily: 'Rubik-Medium', color: '#333' },
  addressText: { fontSize: 14, color: '#666', marginTop: 4 },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 8,
  },
  summaryLabel: { fontSize: 16, color: '#666', fontFamily: 'Rubik-Regular' },
  summaryValue: { fontSize: 16, color: '#333', fontFamily: 'Rubik-Medium' },
  divider: { height: 1, backgroundColor: '#EEE', marginVertical: 12 },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'white',
    padding: 20,
    paddingTop: 16,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderTopWidth: 1,
    borderColor: '#EEE'
  },
  primaryButton: {
    backgroundColor: '#526346',
    paddingVertical: 16,
    borderRadius: 99,
    alignItems: 'center',
  },
  primaryButtonText: { color: 'white', fontSize: 16, fontFamily: 'Rubik-Bold' }
});

export default CheckoutScreen;
