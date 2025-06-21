import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, Text, View } from 'react-native';
import { ProductForm } from '@/constants/agent/ProductForm';
import { config, databases } from '@/lib/appwrite';
import { useGlobalContext } from '@/lib/global-provider';
import { Product } from '@/types/product';

export default function EditProduct() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const { user } = useGlobalContext();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || (user.userType !== 'agent' && user.userType !== 'admin')) {
      router.replace('/');
      return;
    }
    loadProduct();
  }, [user, id]);

  const loadProduct = async () => {
    // Pastikan id adalah string tunggal
    const productId = Array.isArray(id) ? id[0] : id;
    if (!productId) return;
    
    try {
      const doc = await databases.getDocument(
        config.databaseId!,
        config.stokCollectionId!,
        productId
      );

      // Memetakan data dari dokumen ke interface Product yang benar
      const fetchedProduct: Product = {
        $id: doc.$id,
        name: doc.name || '',
        price: Number(doc.price) || 0,
        description: doc.description || '',
        image: doc.image,
        type: doc.type || 'Other', // Menggunakan 'type' dan memberikan nilai default
        gallery: doc.gallery || [], // Menggunakan 'gallery'
        agentId: doc.agentId || user!.$id, // Menggunakan 'agentrelationship'
        status: doc.status || 'active'
      };
      
      setProduct(fetchedProduct);

    } catch (error) {
      console.error('Error loading product:', error);
      router.back();
    } finally {
      setLoading(false);
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
          headerTitle: 'Edit Produk',
          headerTitleStyle: {
            fontFamily: 'Rubik-Medium',
          },
        }}
      />

      <ScrollView className="flex-1 p-4">
        {/* Pastikan ProductForm menerima data produk yang sudah dimuat */}
        {product && (
            <ProductForm
              mode="edit"
              initialData={product}
              onSuccess={() => {
                router.back();
              }}
            />
        )}
      </ScrollView>
    </View>
  );
}