import { router, useLocalSearchParams } from "expo-router";
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  FlatList,
  Image,
  Platform,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import Comment from "@/components/Comment";
import icons from "@/constants/icons";
import images from "@/constants/images";
import { addToCart, getPropertyById } from "@/lib/appwrite";
import { useGlobalContext } from "@/lib/global-provider";
import { useAppwrite } from "@/lib/useAppwrite";

const ProductDetail = () => {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const windowHeight = Dimensions.get("window").height;

  // Mengambil data pengguna dari konteks global
  const { user } = useGlobalContext();

  // Mengambil data produk menggunakan custom hook
  const { data: product, loading } = useAppwrite({
    fn: getPropertyById,
    params: {
      id: id!,
    },
    // Hanya jalankan jika 'id' ada
    skip: !id,
  });

  // Fungsi untuk menangani penambahan item ke keranjang
  const handleAddToCart = async () => {
    // 1. Pastikan pengguna sudah login
    if (!user) {
      Alert.alert("Perlu Login", "Anda harus masuk terlebih dahulu untuk menambahkan item ke keranjang.");
      router.push('/sign-in');
      return;
    }

    // 2. Pastikan ID produk valid
    if (!id) {
        Alert.alert("Error", "ID produk tidak valid.");
        return;
    }

    // 3. Panggil fungsi Appwrite untuk menambahkan ke keranjang
    try {
      await addToCart(user.$id, id);
      Alert.alert("Sukses!", "Produk berhasil ditambahkan ke keranjang.");
    } catch (error: any) {
      console.error("Failed to add to cart:", error);
      Alert.alert("Error", error.message || "Gagal menambahkan produk ke keranjang.");
    }
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
      <View className="flex-1 items-center justify-center bg-white p-5">
        <Text className="text-xl font-rubik-bold text-center">Produk tidak ditemukan.</Text>
        <TouchableOpacity onPress={() => router.back()} className="mt-5 bg-primary-100 px-4 py-2 rounded-lg">
            <Text className="text-white font-rubik-medium">Kembali</Text>
        </TouchableOpacity>
      </View>
    );
  }


  return (
    <View className="flex-1 bg-white">
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerClassName="pb-32 bg-white"
      >
        {/* Gambar Produk Utama */}
        <View className="relative w-full" style={{ height: windowHeight / 2.5 }}>
          <Image
            source={{ uri: product?.image }}
            className="size-full"
            resizeMode="cover"
          />
          <Image
            source={images.whiteGradient}
            className="absolute top-0 w-full z-40"
          />

          {/* Tombol Navigasi Atas */}
          <View
            className="z-50 absolute inset-x-7"
            style={{
              top: Platform.OS === "ios" ? 60 : 20,
            }}
          >
            <View className="flex flex-row items-center w-full justify-between">
              <TouchableOpacity
                onPress={() => router.back()}
                className="flex flex-row bg-primary-200 rounded-full size-11 items-center justify-center"
              >
                <Image
                  source={icons.rightArrow}
                  className="size-5"
                  style={{ transform: [{ scaleX: -1 }] }} // Membalikkan panah
                />
              </TouchableOpacity>

              <TouchableOpacity className="flex flex-row bg-primary-200 rounded-full size-11 items-center justify-center">
                <Image
                  source={icons.heart}
                  className="size-6"
                  tintColor={"#191D31"}
                />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Konten Detail Produk */}
        <View className="px-5 mt-5 flex gap-2">
          {/* Nama & Tipe Produk */}
          <Text className="text-3xl font-rubik-extrabold">{product?.name}</Text>

          <View className="flex flex-row items-center justify-between mt-2">
            <View className="flex flex-row items-center px-4 py-2 bg-primary-100 rounded-full">
              <Text className="text-sm font-rubik-bold text-primary-300">
                {product?.type}
              </Text>
            </View>

            <View className="flex flex-row items-center gap-2">
              <Image source={icons.star} className="size-5" />
              <Text className="text-black-200 text-base mt-1 font-rubik-medium">
                {product?.rating} ({product?.reviews?.length ?? 0} reviews)
              </Text>
            </View>
          </View>

          {/* Garis Pemisah */}
          <View className="border-t border-gray-200 my-5" />

          {/* Overview / Deskripsi Produk */}
          <View>
            <Text className="text-black-300 text-xl font-rubik-bold">
              Overview
            </Text>
            <Text className="text-black-200 text-base font-rubik mt-2 leading-relaxed">
              {product?.description}
            </Text>
          </View>
          
          {/* Info Agen / Penjual */}
          {product?.agent && (
            <View className="w-full pt-7 mt-5">
              <Text className="text-black-300 text-xl font-rubik-bold">
                Penjual
              </Text>
              <View className="flex flex-row items-center justify-between mt-4">
                <View className="flex flex-row items-center">
                  <Image
                    source={{ uri: product?.agent.avatar }}
                    className="size-14 rounded-full"
                  />
                  <View className="flex flex-col items-start justify-center ml-3">
                    <Text className="text-lg text-black-300 text-start font-rubik-bold">
                      {product?.agent.name}
                    </Text>
                    <Text className="text-sm text-black-200 text-start font-rubik-medium">
                      {product?.agent.email}
                    </Text>
                  </View>
                </View>
              </View>
            </View>
          )}


          {/* Galeri Produk */}
          {product?.gallery?.length > 0 && (
            <View className="mt-7">
              <Text className="text-black-300 text-xl font-rubik-bold">
                Gallery
              </Text>
              <FlatList
                data={product?.gallery}
                keyExtractor={(item) => item.$id}
                horizontal
                showsHorizontalScrollIndicator={false}
                renderItem={({ item }) => (
                  <Image
                    source={{ uri: item.image }}
                    className="size-40 rounded-xl"
                  />
                )}
                contentContainerClassName="flex gap-4 mt-3"
              />
            </View>
          )}

          {/* Ulasan */}
          {product?.reviews?.length > 0 && (
            <View className="mt-7">
              <View className="flex flex-row items-center justify-between">
                <Text className="text-black-300 text-xl font-rubik-bold">
                  Reviews ({product?.reviews.length})
                </Text>
                <TouchableOpacity>
                  <Text className="text-primary-300 text-base font-rubik-bold">
                    Lihat Semua
                  </Text>
                </TouchableOpacity>
              </View>
              <View className="mt-5">
                <Comment item={product?.reviews[0]} />
              </View>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Bagian Bawah (Harga & Tombol Beli) */}
      <View className="absolute bg-white bottom-0 w-full rounded-t-2xl border-t border-gray-200 p-5 shadow-lg">
        <View className="flex flex-row items-center justify-between gap-3">
          {/* Harga */}
          <View className="flex flex-col items-start">
            <Text className="text-black-200 text-sm font-rubik-medium">
              Harga
            </Text>
            <Text
              numberOfLines={1}
              className="text-primary-300 text-start text-2xl font-rubik-bold"
            >
              ${product?.price}
            </Text>
          </View>
          
          {/* Grup Tombol Aksi */}
          <View className="flex-1 flex-row items-center gap-3">
            {/* Tombol Tambah ke Keranjang */}
            <TouchableOpacity 
              className="p-3 border border-primary-300 rounded-full"
              onPress={handleAddToCart}
            >
              <Image 
                source={icons.heart} // Ganti dengan ikon keranjang Anda
                className="size-6" 
                tintColor={"#747171"} 
              />
            </TouchableOpacity>

            {/* Tombol Beli Sekarang */}
            <TouchableOpacity className="flex-1 flex items-center justify-center bg-primary-300 py-4 rounded-full shadow-md shadow-zinc-400">
              <Text className="text-white text-lg text-center font-rubik-bold">
                Beli Sekarang
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </View>
  );
};

export default ProductDetail;