import {
  View,
  Text,
  FlatList,
  ActivityIndicator,
  TouchableOpacity,
  Image,
  Alert
} from "react-native";
import React, { useEffect, useMemo, useState } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { useGlobalContext } from "@/lib/global-provider";
import { useAppwrite } from "@/lib/useAppwrite";
import { getCartItems, getPropertyById, databases, config, ID } from "@/lib/appwrite";
import NoResults from "@/components/NoResults";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Models } from "react-native-appwrite";

// Tipe data untuk item produk yang sudah digabungkan
interface MergedCartItem extends Models.Document {
    product: Models.Document | null;
}

// Komponen untuk setiap item di keranjang
const KeranjangItemCard = ({ item, refetchCart }: { item: MergedCartItem, refetchCart: () => void }) => {
  const { product } = item;
  const [isDeleting, setIsDeleting] = useState(false);

  const handleRemoveItem = async () => {
    Alert.alert(
      "Hapus Item",
      "Apakah Anda yakin ingin menghapus item ini dari keranjang?",
      [
        { text: "Batal", style: "cancel" },
        { text: "Hapus", style: "destructive", onPress: async () => {
          setIsDeleting(true);
          try {
            await databases.deleteDocument(config.databaseId!, config.keranjangCollectionId!, item.$id);
            refetchCart(); // Muat ulang data keranjang
          } catch (error) {
            console.error("Gagal menghapus item:", error);
            Alert.alert("Error", "Gagal menghapus item dari keranjang.");
          } finally {
            setIsDeleting(false);
          }
        }}
      ]
    );
  };
  
  if (!product) return null;

  return (
    <View className="flex-row items-center bg-white p-4 rounded-xl shadow-md my-2">
      <Image
        source={{ uri: product.image }}
        className="w-20 h-20 rounded-lg"
        resizeMode="cover"
      />
      <View className="flex-1 ml-4">
        <Text className="text-lg font-rubik-bold text-black-300" numberOfLines={1}>
          {product.name}
        </Text>
        <Text className="text-base font-rubik-medium text-primary-300 mt-1">
          ${product.price}
        </Text>
        <Text className="text-sm font-rubik text-black-100 mt-1">
          Jumlah: {item.quantity}
        </Text>
      </View>
      <TouchableOpacity
        onPress={handleRemoveItem}
        disabled={isDeleting}
        className="p-2"
      >
        {isDeleting ? <ActivityIndicator size="small" /> : <Ionicons name="trash-outline" size={24} color="red" />}
      </TouchableOpacity>
    </View>
  );
};

const KeranjangScreen = () => {
  const { user } = useGlobalContext();
  const [mergedData, setMergedData] = useState<MergedCartItem[]>([]);
  
  const { data: cartItems, loading, refetch } = useAppwrite({
    fn: () => getCartItems(user!.$id),
    skip: !user,
  });

  useEffect(() => {
    if (user) {
      refetch();
    }
  }, [user]);

  // Menggabungkan data keranjang dengan detail produknya
  useEffect(() => {
    const mergeData = async () => {
      if (cartItems) {
        const promises = cartItems.map(async (cartItem) => {
          const product = await getPropertyById({ id: cartItem.productId });
          return { ...cartItem, product };
        });
        const results = await Promise.all(promises);
        setMergedData(results);
      }
    };
    mergeData();
  }, [cartItems]);

  const totalHarga = useMemo(() => {
      return mergedData.reduce((sum, item) => {
          const price = item.product?.price || 0;
          return sum + (price * item.quantity);
      }, 0);
  }, [mergedData]);


  if (!user) {
    return (
      <SafeAreaView className="bg-white h-full flex-1 justify-center items-center px-5">
        <Text className="text-xl font-rubik-bold text-center mb-4">Keranjang Anda Kosong</Text>
        <Text className="text-base text-black-100 text-center mb-6">
            Masuk terlebih dahulu untuk melihat item di keranjang Anda.
        </Text>
        <TouchableOpacity onPress={() => router.push('/sign-in')} className="bg-primary-100 px-8 py-3 rounded-full">
            <Text className="text-white font-rubik-bold text-lg">Masuk</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="bg-gray-50 h-full">
      <View className="p-5 flex-row items-center justify-between bg-white shadow-sm">
        <TouchableOpacity onPress={() => router.back()} className="p-2 -ml-2">
            <Ionicons name="arrow-back" size={28} color="#191D31" />
        </TouchableOpacity>
        <Text className="text-2xl font-rubik-extrabold text-black-300">Keranjang Saya</Text>
        <View className="w-8"/>
      </View>
      
      {loading ? (
        <ActivityIndicator size="large" className="mt-10" color="#526346" />
      ) : (
        <FlatList
          data={mergedData}
          keyExtractor={(item) => item.$id}
          renderItem={({ item }) => <KeranjangItemCard item={item} refetchCart={refetch} />}
          contentContainerClassName="px-5 pb-32"
          ListEmptyComponent={<NoResults />}
          showsVerticalScrollIndicator={false}
        />
      )}

      {mergedData.length > 0 && (
         <View className="absolute bg-white bottom-0 w-full rounded-t-2xl border-t border-gray-200 p-5 shadow-lg">
            <View className="flex-row justify-between items-center mb-4">
                <Text className="text-lg font-rubik-medium text-black-200">Total Harga</Text>
                <Text className="text-2xl font-rubik-bold text-primary-300">${totalHarga.toFixed(2)}</Text>
            </View>
            <TouchableOpacity className="w-full bg-primary-300 py-4 rounded-full">
                <Text className="text-white text-center text-lg font-rubik-bold">Checkout</Text>
            </TouchableOpacity>
         </View>
      )}
    </SafeAreaView>
  );
};

export default KeranjangScreen;