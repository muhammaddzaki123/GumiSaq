import { config, databases } from '@/lib/appwrite';
import { useGlobalContext } from '@/lib/global-provider';
import { Stack, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Alert, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { Query } from 'react-native-appwrite';

interface Order {
  $id: string;
  userId: string;
  totalAmount: number;
  status: 'pending' | 'shipped' | 'delivered';
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
      const response = await databases.listDocuments(
        config.databaseId!,
        config.ordersCollectionId!,
        [Query.orderDesc('$createdAt')]
      );

      const ordersWithItems = await Promise.all(
        response.documents.map(async (order) => {
          const itemsResponse = await databases.listDocuments(
            config.databaseId!,
            config.orderItemsCollectionId!,
            [Query.equal('orderId', order.$id)]
          );

          const itemsWithProducts = await Promise.all(
            itemsResponse.documents.map(async (item) => {
              let product = null;
              try {
                product = await databases.getDocument(
                  config.databaseId!,
                  config.stokCollectionId!,
                  item.productId
                );
              } catch (e) {
                // Produk tidak ditemukan
              }

              return {
                $id: item.$id,
                orderId: item.orderId,
                productId: item.productId,
                quantity: item.quantity,
                priceAtPurchase: item.priceAtPurchase,
                product: product
                  ? {
                      name: product.name,
                      image: product.image,
                      agentId: product.agentId?.$id || product.agentId
                    }
                  : undefined
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

  const handleRejectOrder = async (orderId: string) => {
    try {
      // Hapus semua order items terkait
      const itemsResponse = await databases.listDocuments(
        config.databaseId!,
        config.orderItemsCollectionId!,
        [Query.equal('orderId', orderId)]
      );
      await Promise.all(
        itemsResponse.documents.map(item =>
          databases.deleteDocument(
            config.databaseId!,
            config.orderItemsCollectionId!,
            item.$id
          )
        )
      );
      // Hapus order
      await databases.deleteDocument(
        config.databaseId!,
        config.ordersCollectionId!,
        orderId
      );
      Alert.alert('Sukses', 'Pesanan berhasil ditolak dan dihapus');
      loadOrders();
    } catch (error) {
      console.error('Error deleting order:', error);
      Alert.alert('Error', 'Gagal menghapus pesanan');
    }
  };

  const getStatusColor = (status: Order['status']) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-500';
      case 'shipped':
        return 'bg-blue-500';
      case 'delivered':
        return 'bg-green-500';
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
        {/* Pending Orders */}
        <Text className="font-rubik-bold text-lg mb-2 text-black-300">Pesanan Pending</Text>
        {orders.filter(order => order.status === 'pending').length === 0 ? (
          <View className="bg-white p-6 rounded-xl items-center justify-center mb-6">
            <Text className="text-black-200 font-rubik text-center">
              Tidak ada pesanan pending
            </Text>
          </View>
        ) : (
          <View className="space-y-4 mb-8">
            {orders.filter(order => order.status === 'pending').map((order) => (
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
                  <View className="flex-row space-x-2">
                    <TouchableOpacity
                      onPress={() => handleUpdateStatus(order.$id, 'shipped')}
                      className="flex-1 bg-blue-500 p-2 rounded-lg"
                    >
                      <Text className="text-white font-rubik text-center">
                        Terima
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => handleRejectOrder(order.$id)}
                      className="flex-1 bg-red-500 p-2 rounded-lg"
                    >
                      <Text className="text-white font-rubik text-center">
                        Tolak
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Shipped Orders */}
        <Text className="font-rubik-bold text-lg mb-2 text-black-300">Pesanan Dikirim</Text>
        {orders.filter(order => order.status === 'shipped').length === 0 ? (
          <View className="bg-white p-6 rounded-xl items-center justify-center">
            <Text className="text-black-200 font-rubik text-center">
              Tidak ada pesanan dikirim
            </Text>
          </View>
        ) : (
          <View className="space-y-4">
            {orders.filter(order => order.status === 'shipped').map((order) => (
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
                  <TouchableOpacity
                    onPress={() => handleUpdateStatus(order.$id, 'delivered')}
                    className="bg-green-500 p-2 rounded-lg"
                  >
                    <Text className="text-white font-rubik text-center">
                      Selesaikan Pesanan
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}