import { Stack, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Alert, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { Query } from 'react-native-appwrite';
import { config, databases } from '@/lib/appwrite';
import { useGlobalContext } from '@/lib/global-provider';

interface Order {
  $id: string;
  userId: string;
  totalAmount: number;
  status: 'pending' | 'accepted' | 'rejected' | 'completed';
  shippingAddress: string;
  createdAt: string;
  items?: OrderItem[];
}

interface OrderItem {
  $id: string;
  orderId: string;
  productId: string;
  quantity: number;
  priceAtPurchase: number;
  product?: {
    name: string;
    image?: string;
    agentId: string;
  };
}

export default function AgentOrders() {
  const router = useRouter();
  const { user } = useGlobalContext();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || (user.userType !== 'agent' && user.userType !== 'admin')) {
      router.replace('/');
      return;
    }
    loadOrders();
  }, [user]);

  const loadOrders = async () => {
    if (!user) return;
    
    try {
      // Get orders where the agent has products
      const response = await databases.listDocuments(
        config.databaseId!,
        config.ordersCollectionId!,
        [Query.orderDesc('$createdAt')]
      );

      const ordersWithItems = await Promise.all(
        response.documents.map(async (order) => {
          // Get order items
          const itemsResponse = await databases.listDocuments(
            config.databaseId!,
            config.orderItemsCollectionId!,
            [Query.equal('orderId', order.$id)]
          );

          // Get product details for each item
          const itemsWithProducts = await Promise.all(
            itemsResponse.documents.map(async (item) => {
              const product = await databases.getDocument(
                config.databaseId!,
                config.stokCollectionId!,
                item.productId
              );

              return {
                $id: item.$id,
                orderId: item.orderId,
                productId: item.productId,
                quantity: item.quantity,
                priceAtPurchase: item.priceAtPurchase,
                product: {
                  name: product.name,
                  image: product.image,
                  agentId: product.agentId
                }
              };
            })
          );

          return {
            $id: order.$id,
            userId: order.userId,
            totalAmount: order.totalAmount,
            status: order.status,
            shippingAddress: order.shippingAddress,
            createdAt: order.$createdAt,
            items: itemsWithProducts
          } as Order;
        })
      );

      // Filter orders to only include those with products from this agent
      const agentOrders = ordersWithItems.filter(order => 
        order.items?.some(item => 
          item.product && item.product.agentId === user.$id
        )
      );

      setOrders(agentOrders);
    } catch (error) {
      console.error('Error loading orders:', error);
      Alert.alert('Error', 'Gagal memuat pesanan');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (orderId: string, newStatus: Order['status']) => {
    try {
      await databases.updateDocument(
        config.databaseId!,
        config.ordersCollectionId!,
        orderId,
        { status: newStatus }
      );
      Alert.alert('Sukses', 'Status pesanan berhasil diperbarui');
      loadOrders();
    } catch (error) {
      console.error('Error updating order status:', error);
      Alert.alert('Error', 'Gagal memperbarui status pesanan');
    }
  };

  const getStatusColor = (status: Order['status']) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-500';
      case 'accepted':
        return 'bg-blue-500';
      case 'completed':
        return 'bg-green-500';
      case 'rejected':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
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
          headerTitle: 'Kelola Pesanan',
          headerTitleStyle: {
            fontFamily: 'Rubik-Medium',
          },
        }}
      />

      <ScrollView className="flex-1 p-4">
        {orders.length === 0 ? (
          <View className="bg-white p-6 rounded-xl items-center justify-center">
            <Text className="text-xl font-rubik-bold text-black-300 mb-2">
              Belum ada pesanan
            </Text>
            <Text className="text-black-200 font-rubik text-center">
              Pesanan baru akan muncul di sini
            </Text>
          </View>
        ) : (
          <View className="space-y-4">
            {orders.map((order) => (
              <View
                key={order.$id}
                className="bg-white p-4 rounded-xl shadow-sm"
              >
                <View className="flex-row justify-between items-center mb-4">
                  <Text className="font-rubik-bold text-black-300">
                    Order #{order.$id.slice(-6)}
                  </Text>
                  <View className={`px-3 py-1 rounded-full ${getStatusColor(order.status)}`}>
                    <Text className="text-white font-rubik text-sm">
                      {order.status.toUpperCase()}
                    </Text>
                  </View>
                </View>

                <View className="space-y-2 mb-4">
                  {order.items?.map((item) => (
                    <View key={item.$id} className="flex-row justify-between items-center">
                      <View className="flex-1">
                        <Text className="font-rubik text-black-300">
                          {item.product?.name}
                        </Text>
                        <Text className="font-rubik text-black-200 text-sm">
                          {item.quantity}x @ Rp {item.priceAtPurchase.toLocaleString('id-ID')}
                        </Text>
                      </View>
                      <Text className="font-rubik-bold text-black-300">
                        Rp {(item.quantity * item.priceAtPurchase).toLocaleString('id-ID')}
                      </Text>
                    </View>
                  ))}
                </View>

                <View className="border-t border-gray-100 pt-4">
                  <View className="flex-row justify-between items-center mb-4">
                    <Text className="font-rubik text-black-200">Total</Text>
                    <Text className="font-rubik-bold text-black-300">
                      Rp {order.totalAmount.toLocaleString('id-ID')}
                    </Text>
                  </View>

                  {order.status === 'pending' && (
                    <View className="flex-row space-x-2">
                      <TouchableOpacity
                        onPress={() => handleUpdateStatus(order.$id, 'accepted')}
                        className="flex-1 bg-blue-500 p-2 rounded-lg"
                      >
                        <Text className="text-white font-rubik text-center">
                          Terima
                        </Text>
                      </TouchableOpacity>
                      
                      <TouchableOpacity
                        onPress={() => handleUpdateStatus(order.$id, 'rejected')}
                        className="flex-1 bg-red-500 p-2 rounded-lg"
                      >
                        <Text className="text-white font-rubik text-center">
                          Tolak
                        </Text>
                      </TouchableOpacity>
                    </View>
                  )}

                  {order.status === 'accepted' && (
                    <TouchableOpacity
                      onPress={() => handleUpdateStatus(order.$id, 'completed')}
                      className="bg-green-500 p-2 rounded-lg"
                    >
                      <Text className="text-white font-rubik text-center">
                        Selesaikan Pesanan
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}
