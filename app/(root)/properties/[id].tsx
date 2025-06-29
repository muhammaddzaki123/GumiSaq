import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  FlatList,
  Image,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import Comment from "@/components/Comment";
import icons from "@/constants/icons";
import { addToCart, getPropertyById } from "@/lib/appwrite";
import { useGlobalContext } from "@/lib/global-provider";
import { useAppwrite } from "@/lib/useAppwrite";

const { height: windowHeight } = Dimensions.get("window");

const ProductDetail = () => {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const { user } = useGlobalContext();
  const [isAddingToCart, setIsAddingToCart] = useState(false);

  const { data: product, loading } = useAppwrite({
    fn: () => getPropertyById({ id: id! }),
    skip: !id,
  });

  const handleAddToCart = async () => {
    if (!user) {
      Alert.alert("Perlu Login", "Anda harus masuk untuk menambahkan item ke keranjang.", [
        { text: "OK", onPress: () => router.push('/sign-in') }
      ]);
      return;
    }
    if (!id) return;

    setIsAddingToCart(true);
    try {
      await addToCart(user.$id, id);
      Alert.alert("Sukses!", "Produk berhasil ditambahkan ke keranjang.");
    } catch (error: any) {
      console.error("Failed to add to cart:", error);
      Alert.alert("Error", error.message || "Gagal menambahkan produk.");
    } finally {
      setIsAddingToCart(false);
    }
  };
  
  const handleBuyNow = () => {
    if (!user) {
      Alert.alert("Perlu Login", "Anda harus masuk untuk membeli item.", [
        { text: "OK", onPress: () => router.push('/sign-in') }
      ]);
      return;
    }
    if (!product) return;

    // Arahkan ke checkout dengan parameter untuk pembelian langsung
    router.push({
      pathname: '/(root)/(checkout)/checkout',
      params: {
        isDirectBuy: "true",
        productId: product.$id,
        productName: product.name,
        productImage: product.image,
        productPrice: product.price.toString(),
      }
    });
  };

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <ActivityIndicator size="large" color="#526346" />
      </View>
    );
  }

  if (!product) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-white p-5">
        <Text className="text-xl font-rubik-bold text-center">Produk tidak ditemukan.</Text>
        <TouchableOpacity onPress={() => router.back()} className="mt-5 bg-primary-100 px-4 py-2 rounded-lg">
          <Text className="text-white font-rubik-medium">Kembali</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 120 }} // Beri ruang untuk footer
      >
        {/* Header Gambar */}
        <View style={[styles.imageContainer, { height: windowHeight * 0.45 }]}>
          <Image
            source={{ uri: product.image }}
            style={styles.image}
          />
          <View style={styles.headerButtons}>
            <TouchableOpacity onPress={() => router.back()} style={styles.iconButton}>
              <Ionicons name="arrow-back" size={24} color="#191D31" />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => router.push('/(root)/(keranjang)/keranjang')} style={styles.iconButton}>
              <Ionicons name="cart-outline" size={24} color="#191D31" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Konten Detail */}
        <View style={styles.contentContainer}>
          <View style={styles.titleContainer}>
            <Text style={styles.productName}>{product.name}</Text>
            <View style={styles.ratingContainer}>
              <Image source={icons.star} style={styles.starIcon} />
              <Text style={styles.ratingText}>
                {product.rating} ({product.reviews?.length ?? 0} reviews)
              </Text>
            </View>
          </View>

          <View style={styles.divider} />
          
          {/* Deskripsi */}
          <Text style={styles.sectionTitle}>Deskripsi</Text>
          <Text style={styles.descriptionText}>
            {product.description}
          </Text>

          {/* Penjual */}
          {product.agent && (
            <>
              <View style={styles.divider} />
              <Text style={styles.sectionTitle}>Penjual</Text>
              <View style={styles.sellerContainer}>
                <Image source={{ uri: product.agent.avatar }} style={styles.sellerAvatar} />
                <View>
                  <Text style={styles.sellerName}>{product.agent.name}</Text>
                  <Text style={styles.sellerEmail}>{product.agent.email}</Text>
                </View>
              </View>
            </>
          )}
          
          {/* Galeri */}
          {product.gallery?.length > 0 && (
            <>
              <View style={styles.divider} />
              <Text style={styles.sectionTitle}>Galeri</Text>
              <FlatList
                data={product.gallery}
                keyExtractor={(item) => item.$id}
                horizontal
                showsHorizontalScrollIndicator={false}
                renderItem={({ item }) => (
                  <Image source={{ uri: item.image }} style={styles.galleryImage} />
                )}
                contentContainerStyle={{ marginTop: 8 }}
              />
            </>
          )}

          {/* Ulasan */}
          {product.reviews?.length > 0 && (
             <>
              <View style={styles.divider} />
              <View style={styles.reviewHeader}>
                  <Text style={styles.sectionTitle}>Ulasan ({product.reviews.length})</Text>
                  <TouchableOpacity>
                      <Text style={styles.seeAllText}>Lihat Semua</Text>
                  </TouchableOpacity>
              </View>
              <View style={{marginTop: 16}}>
                <Comment item={product.reviews[0]} />
              </View>
            </>
          )}
        </View>
      </ScrollView>

      {/* Footer Aksi */}
      <View style={styles.footer}>
        <View style={styles.priceContainer}>
          <Text style={styles.priceLabel}>Harga</Text>
          <Text style={styles.priceText}>
            Rp {product.price.toLocaleString('id-ID')}
          </Text>
        </View>
        <TouchableOpacity style={styles.buyButton} onPress={handleBuyNow}>
          <Text style={styles.buyButtonText}>Beli Sekarang</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.cartButton} onPress={handleAddToCart} disabled={isAddingToCart}>
            {isAddingToCart ? 
              <ActivityIndicator color="#526346" /> :
              <Ionicons name="add-circle-outline" size={28} color="#526346" />
            }
        </TouchableOpacity>
      </View>
    </View>
  );
};

// --- STYLESHEET BARU ---
const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: 'white' },
    imageContainer: { width: '100%' },
    image: { width: '100%', height: '100%' },
    headerButtons: {
        position: 'absolute',
        top: Platform.OS === "ios" ? 60 : 40,
        left: 0,
        right: 0,
        paddingHorizontal: 20,
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    iconButton: {
        backgroundColor: 'rgba(255, 255, 255, 0.8)',
        width: 44,
        height: 44,
        borderRadius: 22,
        justifyContent: 'center',
        alignItems: 'center',
    },
    contentContainer: {
        padding: 20,
        backgroundColor: 'white',
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        marginTop: -24, // Tarik konten ke atas gambar
    },
    titleContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
    },
    productName: {
        fontSize: 28,
        fontFamily: 'Rubik-Bold',
        color: '#191D31',
        flex: 1,
    },
    ratingContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F1F1F1',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
        marginLeft: 16,
    },
    starIcon: { width: 16, height: 16, marginRight: 4 },
    ratingText: { fontFamily: 'Rubik-Medium', color: '#666' },
    divider: { height: 1, backgroundColor: '#F0F0F0', marginVertical: 24 },
    sectionTitle: { fontSize: 20, fontFamily: 'Rubik-Bold', color: '#191D31', marginBottom: 8 },
    descriptionText: {
        fontSize: 16,
        fontFamily: 'Rubik-Regular',
        color: '#666876',
        lineHeight: 26,
    },
    sellerContainer: { flexDirection: 'row', alignItems: 'center', marginTop: 8 },
    sellerAvatar: { width: 50, height: 50, borderRadius: 25, marginRight: 12 },
    sellerName: { fontSize: 16, fontFamily: 'Rubik-Bold', color: '#191D31' },
    sellerEmail: { fontSize: 14, fontFamily: 'Rubik-Regular', color: '#666876' },
    galleryImage: { width: 100, height: 100, borderRadius: 12, marginRight: 12 },
    reviewHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    seeAllText: { color: '#526346', fontFamily: 'Rubik-Bold' },
    footer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        paddingHorizontal: 20,
        backgroundColor: 'white',
        borderTopWidth: 1,
        borderColor: '#F0F0F0',
    },
    priceContainer: { flex: 1 },
    priceLabel: { fontSize: 14, fontFamily: 'Rubik-Regular', color: '#666876' },
    priceText: {
        fontSize: 22,
        fontFamily: 'Rubik-ExtraBold',
        color: '#191D31',
    },
    buyButton: {
        backgroundColor: '#526346',
        paddingVertical: 16,
        paddingHorizontal: 32,
        borderRadius: 99,
        marginLeft: 12,
    },
    buyButtonText: { color: 'white', fontSize: 16, fontFamily: 'Rubik-Bold' },
    cartButton: {
        padding: 12,
        borderRadius: 99,
        backgroundColor: '#F1F1F1',
        marginLeft: 8,
    },
});

export default ProductDetail;