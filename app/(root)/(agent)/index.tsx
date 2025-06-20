import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import React from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useGlobalContext } from '@/lib/global-provider';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';


const AgentDashboard = () => {
    const { user, logout } = useGlobalContext();

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView>
                <View style={styles.header}>
                    <View>
                        <Text style={styles.headerSubtitle}>Dasbor Agen</Text>
                        <Text style={styles.headerTitle}>{user?.name}</Text>
                    </View>
                    <TouchableOpacity onPress={logout}>
                        <Ionicons name="log-out-outline" size={30} color="#E53935" />
                    </TouchableOpacity>
                </View>

                <View style={styles.menuGrid}>
                    {/* Nanti kita buat halaman ini */}
                    <TouchableOpacity style={styles.menuItem} onPress={() => router.push('./agent/products')}>
                        <Ionicons name="cube-outline" size={32} color="#526346" />
                        <Text style={styles.menuText}>Produk Saya</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.menuItem} onPress={() => router.push('./agent/orders')}>
                        <Ionicons name="receipt-outline" size={32} color="#526346" />
                        <Text style={styles.menuText}>Pesanan Masuk</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.menuItem}>
                        <Ionicons name="stats-chart-outline" size={32} color="#526346" />
                        <Text style={styles.menuText}>Pendapatan</Text>
                    </TouchableOpacity>

                     <TouchableOpacity style={styles.menuItem}>
                        <Ionicons name="person-circle-outline" size={32} color="#526346" />
                        <Text style={styles.menuText}>Profil Toko</Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F8F9FA' },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20 },
    headerTitle: { fontSize: 28, fontFamily: 'Rubik-Bold', color: '#191D31' },
    headerSubtitle: { fontSize: 16, fontFamily: 'Rubik-Regular', color: '#666' },
    menuGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', padding: 10 },
    menuItem: {
        width: '45%',
        aspectRatio: 1,
        backgroundColor: 'white',
        borderRadius: 16,
        margin: '2.5%',
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 3,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1
    },
    menuText: { marginTop: 12, fontSize: 16, fontFamily: 'Rubik-Medium', color: '#333' }
});

export default AgentDashboard;