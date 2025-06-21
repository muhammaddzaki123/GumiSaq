import { Stack, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Alert, Image, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { Query } from 'react-native-appwrite';
import { ProductForm } from '@/constants/agent/ProductForm';
import { config, databases } from '@/lib/appwrite';
import { useGlobalContext } from '@/lib/global-provider';
import { Product } from '@/types/product';

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
    
    try {
      const response = await databases.listDocuments(
        config.databaseId!,
        config.stokCollectionId!,
        [Query.equal('agentId', user.$id)]
      );
      
      const mappedProducts: Product[] = response.documents.map(doc => ({
        $id: doc.$id,
        name: doc.name || '',
        price: Number(doc.price) || 0,
        description: doc.description || '',
        image: doc.image,
        category: doc.category || '',
        agentId: doc.agentId || user.$id,
        status: doc.status || 'active'
      }));
      
      setProducts(mappedProducts);
    } catch (error) {
      console.error('Error loading products:', error);
      Alert.alert('Error', 'Gagal memuat produk');
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
      loadProducts();
    } catch (error) {
      console.error('Error deleting product:', error);
      Alert.alert('Error', 'Gagal menghapus produk');
    }
  };

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-gray-50">
        <Text className="text-black-300 font-rubik">Memuat...</Text>
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
          {products.map((product) => (
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
              
              <Text className="text-sm font-rubik text-black-200 mt-1">
                {product.description}
              </Text>

              <View className="flex-row justify-end space-x-2 mt-4">
                <TouchableOpacity
                  onPress={() => router.push(`/products/${product.$id}`)}
                  className="bg-blue-500 px-4 py-2 rounded-lg"
                >
                  <Text className="text-white font-rubik">Edit</Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  onPress={() => {
                    Alert.alert(
                      'Konfirmasi',
                      'Yakin ingin menghapus produk ini?',
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
          ))}
        </View>
      </ScrollView>
    </View>
  );
}
