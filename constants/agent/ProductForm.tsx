import * as ImagePicker from 'expo-image-picker';
import React, { useState } from 'react';
import { Alert, Image, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { ID } from 'react-native-appwrite';
import { config, databases, storage } from '../../lib/appwrite';
import { useGlobalContext } from '../../lib/global-provider';

import { Product } from '../../types/product';

interface ProductFormProps {
  onSuccess: () => void;
  initialData?: Product | null;
  mode?: 'create' | 'edit';
}

export const ProductForm = ({ onSuccess, initialData, mode = 'create' }: ProductFormProps) => {
  const [name, setName] = useState(initialData?.name || '');
  const [price, setPrice] = useState(initialData?.price?.toString() || '');
  const [description, setDescription] = useState(initialData?.description || '');
  const [category, setCategory] = useState(initialData?.category || '');
  const [image, setImage] = useState<string | null>(initialData?.image || null);
  const [loading, setLoading] = useState(false);
  
  const { user } = useGlobalContext();

  const handleImagePick = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });

    if (!result.canceled) {
      setImage(result.assets[0].uri);
    }
  };

  const handleSubmit = async () => {
    if (!name || !price || !description || !category) {
      Alert.alert('Error', 'Semua field harus diisi');
      return;
    }

    try {
      setLoading(true);

      let imageUrl = image;
      if (image && !image.startsWith('http')) {
        // Create a file object from the image URI
        const response = await fetch(image);
        const blob = await response.blob();
        const fileName = `product_${Date.now()}.${blob.type.split('/')[1]}`;
        
        const file = {
          name: fileName,
          type: blob.type,
          size: blob.size,
          uri: image
        };

        const uploadedFile = await storage.createFile(
          config.storageBucketId!,
          ID.unique(),
          file
        );
        imageUrl = storage.getFileView(config.storageBucketId!, uploadedFile.$id).href;
      }

      const productData = {
        name,
        price: parseFloat(price),
        description,
        category,
        image: imageUrl,
        agentId: user?.$id,
        status: 'active'
      };

      if (mode === 'edit' && initialData?.$id) {
        await databases.updateDocument(
          config.databaseId!,
          config.stokCollectionId!,
          initialData.$id,
          productData
        );
      } else {
        await databases.createDocument(
          config.databaseId!,
          config.stokCollectionId!,
          ID.unique(),
          productData
        );
      }

      Alert.alert(
        'Sukses',
        mode === 'edit' ? 'Produk berhasil diperbarui' : 'Produk berhasil ditambahkan'
      );
      onSuccess();
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Gagal menyimpan produk');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View className="bg-white p-4 rounded-lg shadow-sm">
      <Text className="text-2xl font-rubik-bold mb-4 text-black-300">
        {mode === 'edit' ? 'Edit Produk' : 'Tambah Produk Baru'}
      </Text>

      <View className="space-y-4">
        <View>
          <Text className="text-sm font-rubik-medium text-black-300 mb-1">
            Nama Produk
          </Text>
          <TextInput
            className="w-full px-4 py-2 border border-gray-200 rounded-lg font-rubik"
            placeholder="Masukkan nama produk"
            value={name}
            onChangeText={setName}
          />
        </View>

        <View>
          <Text className="text-sm font-rubik-medium text-black-300 mb-1">
            Harga
          </Text>
          <TextInput
            className="w-full px-4 py-2 border border-gray-200 rounded-lg font-rubik"
            placeholder="Masukkan harga"
            value={price}
            onChangeText={setPrice}
            keyboardType="numeric"
          />
        </View>

        <View>
          <Text className="text-sm font-rubik-medium text-black-300 mb-1">
            Kategori
          </Text>
          <TextInput
            className="w-full px-4 py-2 border border-gray-200 rounded-lg font-rubik"
            placeholder="Masukkan kategori"
            value={category}
            onChangeText={setCategory}
          />
        </View>

        <View>
          <Text className="text-sm font-rubik-medium text-black-300 mb-1">
            Deskripsi
          </Text>
          <TextInput
            className="w-full px-4 py-2 border border-gray-200 rounded-lg font-rubik"
            placeholder="Masukkan deskripsi"
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={4}
          />
        </View>

        <View>
          <Text className="text-sm font-rubik-medium text-black-300 mb-1">
            Gambar Produk
          </Text>
          <TouchableOpacity
            onPress={handleImagePick}
            className="w-full h-40 border-2 border-dashed border-gray-300 rounded-lg items-center justify-center bg-gray-50"
          >
            {image ? (
              <Image
                source={{ uri: image }}
                className="w-full h-full rounded-lg"
                resizeMode="cover"
              />
            ) : (
              <Text className="text-gray-500 font-rubik">
                Tap untuk pilih gambar
              </Text>
            )}
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          onPress={handleSubmit}
          disabled={loading}
          className={`w-full py-3 rounded-lg ${loading ? 'bg-gray-400' : 'bg-primary-300'}`}
        >
          <Text className="text-center text-white font-rubik-bold">
            {loading ? 'Memproses...' : mode === 'edit' ? 'Simpan Perubahan' : 'Tambah Produk'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};
