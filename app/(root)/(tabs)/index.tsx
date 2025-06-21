import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  RefreshControl,
  Text,
  TouchableOpacity,
  View
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { Card, FeaturedCard } from "@/components/Cards";
import Filters from "@/components/Filters";
import NoResults from "@/components/NoResults";
import Search from "@/components/Search";
import { getLatestProperties, getProperties } from "@/lib/appwrite";
import { useGlobalContext } from "@/lib/global-provider";
import { useAppwrite } from "@/lib/useAppwrite";

// Komponen Header dipisahkan agar lebih rapi
const HomeHeader = ({ user }: any) => (
  <View className="px-4 pt-5 space-y-6">
    {/* Bagian Header Pengguna */}
    <View className="flex-row items-center justify-between">
      <View className="flex-row items-center gap-3">
        <Image
          source={{ uri: user?.avatar }}
          className="w-14 h-14 rounded-full border-2 border-primary-200"
        />
        <View>
          <Text className="text-sm font-rubik text-black-200">
            Selamat Datang,
          </Text>
          <Text className="text-xl font-rubik-semibold text-black-300">
            {user?.name}
          </Text>
        </View>
      </View>
      <TouchableOpacity onPress={() => router.push('./keranjang')} className="bg-white p-3 rounded-full shadow-sm">
        <Ionicons name="cart-outline" size={28} color="#191D31" />
      </TouchableOpacity>
    </View>

    {/* Bagian Search Bar */}
    <Search />
  </View>
);


const Home = () => {
  const { user } = useGlobalContext();
  const params = useLocalSearchParams<{ query?: string; filter?: string }>();

  const { data: latestProperties, loading: latestLoading, refetch: refetchLatest } = useAppwrite({
    fn: getLatestProperties,
  });

  const { data: properties, loading: propertiesLoading, refetch: refetchProperties } = useAppwrite({
    fn: getProperties,
    params: { filter: params.filter!, query: params.query!, limit: 10 },
    skip: true,
  });

  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([refetchLatest(), refetchProperties()]);
    setRefreshing(false);
  };
  
  useEffect(() => {
    refetchProperties({ filter: params.filter!, query: params.query!, limit: 10 });
  }, [params.filter, params.query]);

  const handleCardPress = (id: string) => router.push(`/properties/${id}`);
  
  // Render Item untuk FlatList Unggulan
  const renderFeaturedItem = ({ item }: { item: any }) => (
    <FeaturedCard item={item} onPress={() => handleCardPress(item.$id)} />
  );

  // Render Item untuk FlatList Rekomendasi
  const renderRecommendationItem = ({ item }: { item: any }) => (
    <Card item={item} onPress={() => handleCardPress(item.$id)} />
  );

  return (
    <SafeAreaView className="h-full bg-gray-50">
      {/* PERUBAHAN UTAMA: 
        - HomeHeader sekarang berada di luar FlatList, membuatnya statis.
        - FlatList sekarang tidak lagi membungkus header, tetapi menjadi bagian dari layout.
      */}
      <HomeHeader user={user} />
      
      <FlatList
        data={properties}
        keyExtractor={(item) => item.$id}
        renderItem={renderRecommendationItem}
        numColumns={2}
        columnWrapperClassName="flex-1 gap-4 px-4"
        contentContainerClassName="pb-32"
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={() =>
          !propertiesLoading && <NoResults />
        }
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#526346" />
        }
        // ListHeaderComponent sekarang hanya berisi bagian 'Unggulan' dan 'Rekomendasi'
        ListHeaderComponent={() => (
          <View className="px-4 pt-2 pb-6 space-y-6">
             {/* Bagian Unggulan */}
             <View>
              <View className="flex-row items-center justify-between mb-4">
                <Text className="text-2xl font-rubik-bold text-black-300">
                  Unggulan
                </Text>
                <TouchableOpacity>
                  <Text className="text-base font-rubik-medium text-primary-100">
                    Lihat Semua
                  </Text>
                </TouchableOpacity>
              </View>

              {latestLoading ? (
                <ActivityIndicator size="large" className="text-primary-100 h-80" />
              ) : (
                <FlatList
                  data={latestProperties}
                  renderItem={renderFeaturedItem}
                  keyExtractor={(item) => item.$id}
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerClassName="flex gap-5"
                />
              )}
            </View>

            {/* Judul Bagian Rekomendasi */}
            <View>
              <Text className="text-2xl font-rubik-bold text-black-300">
                Rekomendasi
              </Text>
              <Filters />
            </View>
          </View>
        )}
      />
    </SafeAreaView>
  );
};

export default Home;