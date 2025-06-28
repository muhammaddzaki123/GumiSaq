// components/EditableElement.tsx

import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, Image, View, TouchableOpacity } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { useAnimatedStyle, useSharedValue } from 'react-native-reanimated';

// Tipe data untuk properti komponen
interface EditableElementProps {
  type: 'text' | 'sticker';
  value: string | any;
  color?: string; // Properti warna untuk teks
  isActive: boolean;
  onPress: () => void;
  onDelete: () => void;
  onUpdate: (updates: { x: number; y: number; scale: number; rotation: number }) => void;
}

const EditableElement = ({ type, value, color, isActive, onPress, onDelete, onUpdate }: EditableElementProps) => {
  // Shared values untuk posisi, skala, dan rotasi
  const offset = useSharedValue({ x: 0, y: 0 });
  const start = useSharedValue({ x: 0, y: 0 });
  const scale = useSharedValue(1);
  const savedScale = useSharedValue(1);
  const rotation = useSharedValue(0);
  const savedRotation = useSharedValue(0);

  // Gestur untuk menarik (pan) elemen utama
  const dragGesture = Gesture.Pan()
    .onBegin(() => {
      onPress(); // Menandai elemen ini sebagai aktif
      start.value = { x: offset.value.x, y: offset.value.y };
    })
    .onUpdate((e) => {
      offset.value = {
        x: start.value.x + e.translationX,
        y: start.value.y + e.translationY,
      };
    })
    .onEnd(() => {
        onUpdate({ x: offset.value.x, y: offset.value.y, scale: scale.value, rotation: rotation.value });
    });

  // Gestur untuk memutar dan mengubah ukuran dari pegangan kontrol
  const rotateResizeGesture = Gesture.Pan()
    .onUpdate((e) => {
        const newRotation = Math.atan2(e.y, e.x);
        const newScale = Math.sqrt(e.x * e.x + e.y * e.y) / 50; // 50 adalah jarak awal pegangan
        rotation.value = newRotation;
        scale.value = newScale;
    })
    .onEnd(() => {
        onUpdate({ x: offset.value.x, y: offset.value.y, scale: scale.value, rotation: rotation.value });
    });


  // Style animasi yang akan diterapkan pada kontainer utama
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: offset.value.x },
      { translateY: offset.value.y },
      { scale: scale.value },
      { rotateZ: `${(rotation.value * 180) / Math.PI}rad` },
    ],
  }));

  return (
    <GestureDetector gesture={dragGesture}>
      <Animated.View style={[styles.container, animatedStyle, isActive && styles.activeBorder]}>
        {/* Konten elemen (teks atau stiker) */}
        {type === 'sticker' ? (
          <Image source={value} style={styles.stickerImage} resizeMode="contain" />
        ) : (
          <Text style={[styles.textElement, { color: color || '#000000' }]}>{value}</Text>
        )}

        {/* Pegangan kontrol hanya muncul jika elemen aktif */}
        {isActive && (
          <>
            {/* Tombol Hapus */}
            <TouchableOpacity onPress={onDelete} style={[styles.controlHandle, styles.deleteHandle]}>
              <Ionicons name="close-circle" size={24} color="red" />
            </TouchableOpacity>

            {/* Tombol Putar & Ubah Ukuran */}
            <GestureDetector gesture={rotateResizeGesture}>
                <View style={[styles.controlHandle, styles.resizeHandle]}>
                    <Ionicons name="sync" size={20} color="black" />
                </View>
            </GestureDetector>
          </>
        )}
      </Animated.View>
    </GestureDetector>
  );
};

// --- STYLESHEET ---
const styles = StyleSheet.create({
    container: {
      position: 'absolute',
      alignItems: 'center',
      justifyContent: 'center',
    },
    activeBorder: {
      borderWidth: 2,
      borderColor: '#3498db',
      borderStyle: 'dashed',
      borderRadius: 10,
    },
    stickerImage: {
      width: 100,
      height: 100,
    },
    textElement: {
      fontSize: 40,
      fontWeight: 'bold',
      padding: 10,
    },
    controlHandle: {
        position: 'absolute',
        width: 30,
        height: 30,
        borderRadius: 15,
        backgroundColor: 'rgba(255, 255, 255, 0.8)',
        alignItems: 'center',
        justifyContent: 'center',
        elevation: 5,
    },
    deleteHandle: {
        top: -15,
        left: -15,
    },
    resizeHandle: {
        bottom: -15,
        right: -15,
    }
});

export default EditableElement;