import { Stack, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { Query } from 'react-native-appwrite';
import { config, databases } from '../../../../lib/appwrite';
import { useGlobalContext } from '../../../../lib/global-provider';

interface SalesStats {
  totalSales: number;
  totalOrders: number;
  completedOrders: number;
  pendingOrders: number;
  totalProducts: number;
  topProducts: Array<{
    name: string;
    totalSold: number;
    revenue: number;
  }>;
}

export default function AgentReports() {
  const router = useRouter();
  const { user } = useGlobalContext();
  const [stats, setStats] = useState<SalesStats>({
    totalSales: 0,
    totalOrders: 0,
    completedOrders: 0,
    pendingOrders: 0,
    totalProducts: 0,
    topProducts: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || (user.userType !== 'agent' && user.userType !== 'admin')) {
      router.replace('/');
      return;
    }
    loadStats();
  }, [user]);

  const loadStats = async () => {
    if (!user) return;
    
    try {
      // Get all products by this agent
      const productsResponse = await databases.listDocuments(
        config.databaseId!,
        config.stokCollectionId!,
        [Query.equal('agentId', user.$id)]
      );

      // Get all completed orders
      const ordersResponse = await databases.listDocuments(
        config.databaseId!,
        config.ordersCollectionId!,
        []
      );

      // Get all order items
      const orderItemsResponse = await databases.listDocuments(
        config.databaseId!,
        config.orderItemsCollectionId!,
        []
      );

      const productMap = new Map(
        productsResponse.documents.map(product => [product.$id, product])
      );

      const orderMap = new Map(
        ordersResponse.documents.map(order => [order.$id, order])
      );

      // Calculate product sales
      const productSales = new Map();
      orderItemsResponse.documents.forEach(item => {
        const product = productMap.get(item.productId);
        const order = orderMap.get(item.orderId);
        
        if (product && order && product.agentId === user.$id) {
          const currentStats = productSales.get(item.productId) || {
            name: product.name,
            totalSold: 0,
            revenue: 0
          };

          currentStats.totalSold += item.quantity;
          currentStats.revenue += item.quantity * item.priceAtPurchase;
          productSales.set(item.productId, currentStats);
        }
      });

      // Calculate order statistics
      let totalSales = 0;
      let totalOrders = 0;
      let completedOrders = 0;
      let pendingOrders = 0;

      ordersResponse.documents.forEach(order => {
        const hasAgentProduct = orderItemsResponse.documents.some(item => {
          const product = productMap.get(item.productId);
          return item.orderId === order.$id && product && product.agentId === user.$id;
        });

        if (hasAgentProduct) {
          totalOrders++;
          if (order.status === 'completed') {
            completedOrders++;
            totalSales += order.totalAmount;
          } else if (order.status === 'pending') {
            pendingOrders++;
          }
        }
      });

      setStats({
        totalSales,
        totalOrders,
        completedOrders,
        pendingOrders,
        totalProducts: productsResponse.documents.length,
        topProducts: Array.from(productSales.values())
          .sort((a, b) => b.revenue - a.revenue)
          .slice(0, 5)
      });
    } catch (error) {
      console.error('Error loading stats:', error);
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
          headerTitle: 'Laporan Penjualan',
          headerTitleStyle: {
            fontFamily: 'Rubik-Medium',
          },
        }}
      />

      <ScrollView className="flex-1 p-4">
        <View className="grid grid-cols-2 gap-4 mb-6">
          <View className="bg-white p-4 rounded-xl shadow-sm">
            <Text className="font-rubik text-black-200 mb-1">Total Penjualan</Text>
            <Text className="font-rubik-bold text-2xl text-black-300">
              Rp {stats.totalSales.toLocaleString('id-ID')}
            </Text>
          </View>

          <View className="bg-white p-4 rounded-xl shadow-sm">
            <Text className="font-rubik text-black-200 mb-1">Total Pesanan</Text>
            <Text className="font-rubik-bold text-2xl text-black-300">
              {stats.totalOrders}
            </Text>
          </View>

          <View className="bg-white p-4 rounded-xl shadow-sm">
            <Text className="font-rubik text-black-200 mb-1">Pesanan Selesai</Text>
            <Text className="font-rubik-bold text-2xl text-green-500">
              {stats.completedOrders}
            </Text>
          </View>

          <View className="bg-white p-4 rounded-xl shadow-sm">
            <Text className="font-rubik text-black-200 mb-1">Pesanan Pending</Text>
            <Text className="font-rubik-bold text-2xl text-yellow-500">
              {stats.pendingOrders}
            </Text>
          </View>
        </View>

        <View className="bg-white p-4 rounded-xl shadow-sm mb-6">
          <Text className="font-rubik-bold text-lg text-black-300 mb-4">
            Produk Terlaris
          </Text>

          {stats.topProducts.length > 0 ? (
            <View className="space-y-4">
              {stats.topProducts.map((product, index) => (
                <View key={index} className="border-b border-gray-100 pb-4 last:border-0 last:pb-0">
                  <Text className="font-rubik-bold text-black-300 mb-1">
                    {product.name}
                  </Text>
                  <View className="flex-row justify-between">
                    <Text className="font-rubik text-black-200">
                      Terjual: {product.totalSold}
                    </Text>
                    <Text className="font-rubik text-black-300">
                      Rp {product.revenue.toLocaleString('id-ID')}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          ) : (
            <Text className="font-rubik text-black-200 text-center">
              Belum ada penjualan
            </Text>
          )}
        </View>
      </ScrollView>
    </View>
  );
}
