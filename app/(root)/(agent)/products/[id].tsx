import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
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
    if (!id) return;
    
    try {
      const doc = await databases.getDocument(
        config.databaseId!,
        config.stokCollectionId!,
        id.toString()
      );
      if (!user) return;
      
      setProduct({
        $id: doc.$id,
        name: doc.name || '',
        price: Number(doc.price) || 0,
        description: doc.description || '',
        image: doc.image,
        category: doc.category || '',
        agentId: doc.agentId || user.$id,
        status: doc.status || 'active'
      });
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
        <ProductForm
          mode="edit"
          initialData={product}
          onSuccess={() => {
            router.back();
          }}
        />
      </ScrollView>
    </View>
  );
}
