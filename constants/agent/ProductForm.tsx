import { Ionicons } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';
import * as ImagePicker from 'expo-image-picker';
import React, { useState } from 'react';
import { ActivityIndicator, Alert, Image, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { ID } from 'react-native-appwrite';
import { config, databases, storage } from '../../lib/appwrite';
import { useGlobalContext } from '../../lib/global-provider';
import { Product } from '../../types/product';

interface ProductFormProps {
  onSuccess: () => void;
  initialData?: Product | null;
  mode?: 'create' | 'edit';
}

const productTypes: Product['type'][] = ["Baju", "Celana", "Tas", "Sofenir", "Other"];

export const ProductForm = ({ onSuccess, initialData, mode = 'create' }: ProductFormProps) => {
  const [name, setName] = useState(initialData?.name || '');
  const [price, setPrice] = useState(initialData?.price?.toString() || '');
  const [description, setDescription] = useState(initialData?.description || '');
  const [type, setType] = useState<Product['type'] | undefined>(initialData?.type);
  const [mainImage, setMainImage] = useState<string | null>(initialData?.image || null);
  const [galleryImages, setGalleryImages] = useState<string[]>(initialData?.gallery || []);
  const [loading, setLoading] = useState(false);
  
  const { user } = useGlobalContext();

  const handleImagePick = async (
    setImageFunc: React.Dispatch<React.SetStateAction<any>>, 
    options: { multiple: boolean }
  ) => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (permissionResult.granted === false) {
      Alert.alert("Izin Diperlukan", "Anda perlu memberikan izin untuk mengakses galeri foto.");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: !options.multiple,
      // **PERUBAHAN UTAMA:** Izinkan pemilihan ganda jika `multiple` adalah true
      allowsMultipleSelection: options.multiple, 
      quality: 1,
    });

    if (!result.canceled) {
      if (options.multiple && result.assets) {
        const newUris = result.assets.map(asset => asset.uri);
        // Tambahkan gambar baru ke state yang sudah ada
        setImageFunc((prevUris: string[]) => [...prevUris, ...newUris]); 
      } else if (!options.multiple && result.assets) {
        setImageFunc(result.assets[0].uri);
      }
    }
  };
  
  const getSafeFileExtension = (mimeType: string): string | null => {
    const map: { [key: string]: string } = {
        'image/jpeg': 'jpg',
        'image/pjpeg': 'jpg',
        'image/png': 'png',
        'image/gif': 'gif',
        'image/webp': 'webp',
        'image/avif': 'avif',
        'image/heic': 'heic',
    };
    return map[mimeType.toLowerCase()] || 'jpg'; // Default ke jpg jika tidak diketahui
  };

  const uploadImage = async (uri: string): Promise<string> => {
      const response = await fetch(uri);
      const blob = await response.blob();
      
      const fileExtension = getSafeFileExtension(blob.type);

      const fileName = `product_image_${Date.now()}.${fileExtension}`;
      const file = { name: fileName, type: blob.type, size: blob.size, uri };
      
      const uploadedFile = await storage.createFile(config.storageBucketId!, ID.unique(), file);
      return storage.getFileView(config.storageBucketId!, uploadedFile.$id).href;
  };

  const handleSubmit = async () => {
    if (!name || !price || !description || !type || !mainImage) {
      Alert.alert('Error', 'Nama, Harga, Deskripsi, Tipe, dan Gambar Utama harus diisi.');
      return;
    }

    setLoading(true);

    try {
      let mainImageUrl = mainImage;
      if (mainImage && !mainImage.startsWith('http')) {
        mainImageUrl = await uploadImage(mainImage);
      }
      
      const uploadedGalleryUrls = await Promise.all(
        galleryImages.filter(uri => !uri.startsWith('http')).map(uri => uploadImage(uri))
      );

      const newGalleryDocIds = await Promise.all(
        uploadedGalleryUrls.map(url => 
            databases.createDocument(
                config.databaseId!,
                config.galleriesCollectionId!,
                ID.unique(),
                { image: url }
            ).then(doc => doc.$id)
        )
      );

      const existingGalleryIds = initialData?.gallery || [];
      const allGalleryIds = [...existingGalleryIds, ...newGalleryDocIds];

      const productData = {
        name,
        price: parseFloat(price),
        description,
        type,
        image: mainImageUrl,
        gallery: allGalleryIds,
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

      Alert.alert('Sukses', `Produk berhasil ${mode === 'edit' ? 'diperbarui' : 'ditambahkan'}`);
      onSuccess();
    } catch (error: any) {
      console.error("Gagal menyimpan produk:", error);
      Alert.alert('Error', error.message || 'Gagal menyimpan produk.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View className="bg-white p-4 rounded-lg shadow-sm space-y-4">
      <Text className="text-2xl font-rubik-bold mb-4 text-black-300">
        {mode === 'edit' ? 'Edit Produk' : 'Tambah Produk Baru'}
      </Text>

      {/* Form Fields (Nama, Tipe, Harga, Deskripsi) - Tidak ada perubahan */}
      <View>
        <Text className="text-sm font-rubik-medium text-black-300 mb-1">Nama Produk</Text>
        <TextInput className="w-full px-4 py-2 border border-gray-200 rounded-lg font-rubik" placeholder="Masukkan nama produk" value={name} onChangeText={setName} />
      </View>

      <View>
          <Text className="text-sm font-rubik-medium text-black-300 mb-1">Tipe Produk</Text>
          <View className="border border-gray-200 rounded-lg">
            <Picker selectedValue={type} onValueChange={(itemValue) => setType(itemValue)}>
                <Picker.Item label="Pilih Tipe Produk..." value={undefined} enabled={false} style={{color: 'grey'}} />
                {productTypes.map((item, index) => (
                    <Picker.Item key={index} label={item} value={item} />
                ))}
            </Picker>
          </View>
      </View>

      <View>
        <Text className="text-sm font-rubik-medium text-black-300 mb-1">Harga</Text>
        <TextInput className="w-full px-4 py-2 border border-gray-200 rounded-lg font-rubik" placeholder="Masukkan harga" value={price} onChangeText={setPrice} keyboardType="numeric" />
      </View>

      <View>
        <Text className="text-sm font-rubik-medium text-black-300 mb-1">Deskripsi</Text>
        <TextInput className="w-full px-4 py-2 border border-gray-200 rounded-lg font-rubik h-24" placeholder="Masukkan deskripsi" value={description} onChangeText={setDescription} multiline textAlignVertical="top" />
      </View>

      {/* --- UI IMAGE PICKER BARU --- */}
      <View>
        <Text className="text-sm font-rubik-medium text-black-300 mb-2">Gambar Utama</Text>
        <TouchableOpacity onPress={() => handleImagePick(setMainImage, { multiple: false })} className="border border-dashed border-gray-400 p-4 rounded-xl items-center justify-center h-48 bg-gray-50">
          {mainImage ? (
            <Image source={{ uri: mainImage }} className="w-full h-full rounded-xl" resizeMode="cover" />
          ) : (
            <View className="items-center">
              <Ionicons name="cloud-upload-outline" size={40} color="gray" />
              <Text className="text-gray-500 mt-2">Ketuk untuk Pilih Gambar Utama</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>
      
      <View>
          <Text className="text-sm font-rubik-medium text-black-300 mb-2">Galeri Gambar</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerClassName="gap-2">
              {galleryImages.map((uri, index) => (
                  <View key={index} className="relative">
                      <Image source={{ uri }} className="w-24 h-24 rounded-lg" />
                      <TouchableOpacity
                          onPress={() => setGalleryImages(prev => prev.filter((_, i) => i !== index))}
                          className="absolute -top-1 -right-1 bg-red-500 rounded-full p-1"
                      >
                         <Ionicons name="close" size={12} color="white" />
                      </TouchableOpacity>
                  </View>
              ))}
              <TouchableOpacity onPress={() => handleImagePick(setGalleryImages, { multiple: true })} className="w-24 h-24 border-2 border-dashed border-gray-300 rounded-lg items-center justify-center bg-gray-50">
                  <Ionicons name="add" size={30} color="gray" />
              </TouchableOpacity>
          </ScrollView>
      </View>

      <TouchableOpacity onPress={handleSubmit} disabled={loading} className={`w-full py-3 rounded-lg mt-4 ${loading ? 'bg-gray-400' : 'bg-primary-300'}`}>
        {loading ? <ActivityIndicator color="white" /> : <Text className="text-center text-white font-rubik-bold">{mode === 'edit' ? 'Simpan Perubahan' : 'Tambah Produk'}</Text>}
      </TouchableOpacity>
    </View>
  );
};