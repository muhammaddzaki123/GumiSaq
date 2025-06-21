import { ProductForm } from '@/constants/agent/ProductForm';
import { config, databases } from '@/lib/appwrite';
import { useGlobalContext } from '@/lib/global-provider';
import { Product } from '@/types/product';
import { Stack, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Image, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { Query } from 'react-native-appwrite';

export default function AgentProducts() {
  const router = useRouter();
  const { user } = useGlobalContext();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);

  useEffect(() => {
    if (!user || (user.userType !== 'agent' && user.userType !== 'admin')) {
      router.replace('/');
      return;
    }
    loadProducts();
  }, [user]);

  const loadProducts = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const response = await databases.listDocuments(
        config.databaseId!,
        config.stokCollectionId!,
        // PERBAIKAN 1: Menggunakan nama atribut relasi yang benar
        [Query.equal('agentId', user.$id)]
      );
      
      // PERBAIKAN 2: Memetakan ke struktur data Product yang baru
      const mappedProducts: Product[] = response.documents.map(doc => ({
        $id: doc.$id,
        name: doc.name || '',
        price: Number(doc.price) || 0,
        description: doc.description || '',
        image: doc.image,
        type: doc.type || 'Other', // Menggunakan 'type'
        gallery: doc.gallery || [], // Menambahkan 'gallery'
        agentId: doc.agentId || user.$id, // Menggunakan 'agentId'
        status: doc.status || 'active'
      }));
      
      setProducts(mappedProducts);
    } catch (error) {
      console.error('Error loading products:', error);
      Alert.alert('Error', 'Gagal memuat produk. Pastikan atribut relasi "agentId" sudah benar.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteProduct = async (productId: string) => {
    try {
      await databases.deleteDocument(
        config.databaseId!,
        config.stokCollectionId!,
        productId
      );
      Alert.alert('Sukses', 'Produk berhasil dihapus');
      loadProducts(); // Muat ulang daftar produk setelah menghapus
    } catch (error) {
      console.error('Error deleting product:', error);
      Alert.alert('Error', 'Gagal menghapus produk');
    }
  };

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-gray-50">
        <ActivityIndicator size="large" color="#526346" />
        <Text className="text-black-300 font-rubik mt-2">Memuat Produk...</Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-gray-50">
      <Stack.Screen
        options={{
          headerTitle: 'Kelola Produk',
          headerTitleStyle: {
            fontFamily: 'Rubik-Medium',
          },
        }}
      />

      <ScrollView className="flex-1 p-4">
        {!showAddForm && (
          <TouchableOpacity
            onPress={() => setShowAddForm(true)}
            className="bg-primary-300 p-4 rounded-lg mb-4"
          >
            <Text className="text-white font-rubik-bold text-center">
              + Tambah Produk Baru
            </Text>
          </TouchableOpacity>
        )}

        {showAddForm && (
          <View className="mb-4">
            <ProductForm
              onSuccess={() => {
                setShowAddForm(false);
                loadProducts();
              }}
            />
          </View>
        )}

        <View className="space-y-4">
          {products.length === 0 && !showAddForm ? (
              <View className="items-center justify-center p-8 bg-white rounded-lg">
                  <Text className="text-lg font-rubik-medium text-black-200">Anda belum memiliki produk.</Text>
                  <Text className="text-sm text-center text-black-100 mt-2">Klik tombol "Tambah Produk Baru" untuk memulai.</Text>
              </View>
          ) : (
            products.map((product) => (
              <View
                key={product.$id}
                className="bg-white p-4 rounded-lg shadow-sm"
              >
                {product.image && (
                  <Image
                    source={{ uri: product.image }}
                    className="w-full h-40 rounded-lg mb-4"
                    resizeMode="cover"
                  />
                )}
                
                <Text className="text-lg font-rubik-bold text-black-300">
                  {product.name}
                </Text>
                
                <Text className="text-sm font-rubik text-black-200 mt-1">
                  Rp {product.price.toLocaleString('id-ID')}
                </Text>

                <View className="bg-gray-100 px-2 py-1 rounded-full self-start mt-2">
                    <Text className="text-xs font-rubik-medium text-gray-600">{product.type}</Text>
                </View>
                
                <Text className="text-sm font-rubik text-black-200 mt-2">
                  {product.description}
                </Text>

                <View className="flex-row justify-end space-x-2 mt-4">
                  <TouchableOpacity
                    onPress={() => router.push({ pathname: '/products/[id]', params: { id: product.$id }})}
                    className="bg-blue-500 px-4 py-2 rounded-lg"
                  >
                    <Text className="text-white font-rubik">Edit</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity
                    onPress={() => {
                      Alert.alert(
                        'Konfirmasi Hapus',
                        `Yakin ingin menghapus produk "${product.name}"?`,
                        [
                          { text: 'Batal', style: 'cancel' },
                          { 
                            text: 'Hapus',
                            style: 'destructive',
                            onPress: () => handleDeleteProduct(product.$id)
                          }
                        ]
                      );
                    }}
                    className="bg-red-500 px-4 py-2 rounded-lg"
                  >
                    <Text className="text-white font-rubik">Hapus</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))
          )}
        </View>
      </ScrollView>
    </View>
  );
}