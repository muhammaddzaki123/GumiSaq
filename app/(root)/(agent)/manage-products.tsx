// import { View, Text, FlatList, TouchableOpacity, StyleSheet, Image, ActivityIndicator, Alert } from 'react-native'
// import React, { useEffect } from 'react'
// import { SafeAreaView } from 'react-native-safe-area-context'
// import { useGlobalContext } from '@/lib/global-provider'
// import { getAgentProducts } from '@/lib/appwrite'
// import { useAppwrite } from '@/lib/useAppwrite'
// import { router, useFocusEffect } from 'expo-router'
// import { Ionicons } from '@expo/vector-icons'
// import { Models } from 'react-native-appwrite'

// const ProductItem = ({ item }: { item: Models.Document }) => (
//     <View style={styles.productCard}>
//         <Image source={{ uri: item.image }} style={styles.productImage} />
//         <View style={styles.productDetails}>
//             <Text style={styles.productName} numberOfLines={2}>{item.name}</Text>
//             <Text style={styles.productPrice}>${item.price}</Text>
//         </View>
//         <TouchableOpacity style={styles.editButton}>
//             <Ionicons name="create-outline" size={20} color="#526346"/>
//         </TouchableOpacity>
//     </View>
// );

// const ManageProductsScreen = () => {
//     const { user } = useGlobalContext();

//     const { data: products, loading, refetch } = useAppwrite({
//         fn: () => getAgentProducts(user!.$id),
//         skip: !user,
//     });
    
//     // Muat ulang data setiap kali halaman ini menjadi fokus
//     useFocusEffect(
//         React.useCallback(() => {
//             if (user) refetch();
//         }, [user])
//     );

//     return (
//         <SafeAreaView style={styles.container}>
//             <View style={styles.header}>
//                 <TouchableOpacity onPress={() => router.back()} style={{ padding: 8 }}>
//                     <Ionicons name="arrow-back" size={28} color="#191D31" />
//                 </TouchableOpacity>
//                 <Text style={styles.headerTitle}>Produk Saya</Text>
//                 <TouchableOpacity onPress={() => router.push('./agent/add-product')} style={{ padding: 8 }}>
//                     <Ionicons name="add-circle" size={32} color="#526346" />
//                 </TouchableOpacity>
//             </View>

//             {loading ? <ActivityIndicator size="large" style={{marginTop: 50}}/> : (
//                 <FlatList
//                     data={products}
//                     keyExtractor={(item) => item.$id}
//                     renderItem={({ item }) => <ProductItem item={item} />}
//                     ListEmptyComponent={() => (
//                         <View style={styles.emptyContainer}>
//                             <Text style={styles.emptyText}>Anda belum memiliki produk.</Text>
//                             <Text style={styles.emptySubText}>Ketuk tombol `+` untuk menambah produk pertama Anda.</Text>
//                         </View>
//                     )}
//                     contentContainerStyle={{ padding: 16 }}
//                 />
//             )}
//         </SafeAreaView>
//     )
// }

// const styles = StyleSheet.create({
//     container: { flex: 1, backgroundColor: '#F8F9FA' },
//     header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 8, paddingVertical: 12, backgroundColor: 'white', borderBottomWidth: 1, borderBottomColor: '#EEE' },
//     headerTitle: { fontSize: 22, fontFamily: 'Rubik-ExtraBold', color: '#191D31' },
//     productCard: { flexDirection: 'row', backgroundColor: 'white', borderRadius: 12, padding: 12, marginBottom: 16, alignItems: 'center', elevation: 2, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 5 },
//     productImage: { width: 70, height: 70, borderRadius: 8 },
//     productDetails: { flex: 1, marginLeft: 12 },
//     productName: { fontSize: 16, fontFamily: 'Rubik-Bold' },
//     productPrice: { fontSize: 14, fontFamily: 'Rubik-Medium', color: '#526346', marginTop: 4 },
//     editButton: { padding: 8, backgroundColor: '#EFF2ED', borderRadius: 99 },
//     emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', marginTop: '40%' },
//     emptyText: { fontSize: 18, fontFamily: 'Rubik-Medium' },
//     emptySubText: { fontSize: 14, color: '#666', marginTop: 8 }
// });

// export default ManageProductsScreen;

