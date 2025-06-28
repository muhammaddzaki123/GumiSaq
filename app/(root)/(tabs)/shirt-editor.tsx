import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useState } from 'react';
import {
  View,
  Text,
  SafeAreaView,
  StyleSheet,
  TouchableOpacity,
  Image,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Gesture, GestureDetector, GestureHandlerRootView } from 'react-native-gesture-handler';
import Animated, { useSharedValue, useAnimatedStyle } from 'react-native-reanimated';

// --- Komponen Editable ---
interface EditableElementProps {
  type: 'text' | 'sticker';
  value: string | any;
}

const EditableElement = ({ type, value }: EditableElementProps) => {
  const offsetX = useSharedValue(0);
  const offsetY = useSharedValue(0);
  const scale = useSharedValue(1);
  const rotation = useSharedValue(0);

  const savedOffset = useSharedValue({ x: 0, y: 0 });
  const savedScale = useSharedValue(1);
  const savedRotation = useSharedValue(0);

  const panGesture = Gesture.Pan()
    .onUpdate((e) => {
      offsetX.value = savedOffset.value.x + e.translationX;
      offsetY.value = savedOffset.value.y + e.translationY;
    })
    .onEnd(() => {
      savedOffset.value = { x: offsetX.value, y: offsetY.value };
    });

  const pinchGesture = Gesture.Pinch()
    .onUpdate((e) => {
      scale.value = savedScale.value * e.scale;
    })
    .onEnd(() => {
      savedScale.value = scale.value;
    });

  const rotateGesture = Gesture.Rotation()
    .onUpdate((e) => {
      rotation.value = savedRotation.value + e.rotation;
    })
    .onEnd(() => {
      savedRotation.value = rotation.value;
    });

  const composedGesture = Gesture.Simultaneous(panGesture, pinchGesture, rotateGesture);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: offsetX.value },
      { translateY: offsetY.value },
      { scale: scale.value },
      { rotateZ: `${(rotation.value / Math.PI) * 180}deg` },
    ],
  }));

  return (
    <GestureDetector gesture={composedGesture}>
      <Animated.View style={[styles.editableContainer, animatedStyle]}>
        {type === 'sticker' ? (
          <Image source={value} style={styles.stickerImage} resizeMode="contain" />
        ) : (
          <Text style={styles.textElement}>{value}</Text>
        )}
      </Animated.View>
    </GestureDetector>
  );
};

// --- ASET GAMBAR & DATA ---
const T_SHIRT_IMAGE = require('@/assets/images/baju_polos.png');
const STICKER_1 = require('@/assets/icons/heart.png');
const STICKER_2 = require('@/assets/icons/star.png');
const COLORS = ['#FFFFFF', '#000000', '#FF0000', '#0000FF', '#00FF00', '#FFFF00', '#FF00FF', '#808080'];
const STICKERS = [STICKER_1, STICKER_2];

interface CanvasElement {
  id: number;
  type: 'text' | 'sticker';
  value: string | any;
}

// --- KOMPONEN UTAMA ---
const ShirtEditorScreen = () => {
  const [shirtColor, setShirtColor] = useState('#FFFFFF');
  const [elements, setElements] = useState<CanvasElement[]>([]);
  const [activeTool, setActiveTool] = useState<'color' | 'sticker' | 'text'>('color');
  const [textInputValue, setTextInputValue] = useState('');

  const addElement = (type: 'sticker' | 'text', value: any) => {
    setElements([...elements, { id: Date.now(), type, value }]);
  };

  const renderToolOptions = () => {
    switch (activeTool) {
      case 'color':
        return (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.toolOptionsContainer}>
            {COLORS.map((color) => (
              <TouchableOpacity
                key={color}
                style={[styles.colorSwatch, { backgroundColor: color }]}
                onPress={() => setShirtColor(color)}
              />
            ))}
          </ScrollView>
        );
      case 'sticker':
        return (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.toolOptionsContainer}>
            {STICKERS.map((sticker, index) => (
              <TouchableOpacity key={index} onPress={() => addElement('sticker', sticker)}>
                <Image source={sticker} style={styles.stickerPreview} resizeMode="contain" />
              </TouchableOpacity>
            ))}
          </ScrollView>
        );
      case 'text':
        return (
          <View style={styles.textToolContainer}>
            <TextInput
              style={styles.textInput}
              placeholder="Ketik teks..."
              placeholderTextColor="#999"
              value={textInputValue}
              onChangeText={setTextInputValue}
            />
            <TouchableOpacity
              style={styles.addButton}
              onPress={() => {
                if (textInputValue.trim()) {
                  addElement('text', textInputValue);
                  setTextInputValue('');
                }
              }}
            >
              <Text style={styles.addButtonText}>Add</Text>
            </TouchableOpacity>
          </View>
        );
      default:
        return null;
    }
  };

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Editor Baju</Text>
          <TouchableOpacity style={{ padding: 8 }}>
            <Ionicons name="checkmark-done" size={28} color="#526346" />
          </TouchableOpacity>
        </View>
        
        {/* Konten utama sekarang berada di dalam View ini */}
        <View style={{ flex: 1 }}>
            <View style={styles.canvas}>
                <Image
                source={T_SHIRT_IMAGE}
                style={[styles.shirtImage, shirtColor !== '#FFFFFF' && { tintColor: shirtColor }]}
                resizeMode="contain"
                />
                {elements.map((el) => (
                <EditableElement key={el.id} type={el.type} value={el.value} />
                ))}
            </View>
        </View>

        {/* Panel Kontrol Bawah */}
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
          <View style={styles.bottomControlPanel}>
            {/* Area untuk pilihan (muncul di atas tab) */}
            <View style={styles.toolOptionsArea}>
              {renderToolOptions()}
            </View>
            
            {/* Tab untuk memilih tool */}
            <View style={styles.toolTabs}>
                <TouchableOpacity onPress={() => setActiveTool('color')} style={[styles.tab, activeTool === 'color' && styles.activeTab]}>
                    <Text style={[styles.tabText, activeTool === 'color' && styles.activeTabText]}>Warna</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => setActiveTool('sticker')} style={[styles.tab, activeTool === 'sticker' && styles.activeTab]}>
                    <Text style={[styles.tabText, activeTool === 'sticker' && styles.activeTabText]}>Stiker</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => setActiveTool('text')} style={[styles.tab, activeTool === 'text' && styles.activeTab]}>
                    <Text style={[styles.tabText, activeTool === 'text' && styles.activeTabText]}>Teks</Text>
                </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </GestureHandlerRootView>
  );
};

// --- STYLESHEET ---
const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#F0F0F0',
    paddingBottom: 70, // <-- PERUBAHAN PENTING: Memberi ruang di bawah agar tidak tertutup nav bar
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#EAEAEA',
  },
  headerTitle: { fontSize: 20, fontFamily: 'Rubik-Bold', color: '#191D31' },

  canvas: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    margin: 20,
    backgroundColor: 'white',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#DDD',
    position: 'relative',
  },
  shirtImage: { width: '80%', height: '80%' },

  editableContainer: { position: 'absolute' },
  stickerImage: { width: 100, height: 100 },
  textElement: { fontSize: 40, fontWeight: 'bold', color: 'black', padding: 10, borderWidth: 1, borderColor: 'rgba(0,0,0,0.1)', borderStyle: 'dashed'},

  bottomControlPanel: {
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#EEE',
  },
  toolOptionsArea: {
    height: 90,
    justifyContent: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#EEE',
  },
  toolTabs: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: 10,
    paddingBottom: Platform.OS === 'ios' ? 20 : 10,
  },
  tab: { paddingVertical: 8, paddingHorizontal: 20, borderRadius: 18 },
  activeTab: { backgroundColor: '#526346' },
  tabText: { fontFamily: 'Rubik-Medium', color: '#333' },
  activeTabText: { color: '#FFFFFF' },
  
  toolOptionsContainer: { paddingHorizontal: 15, alignItems: 'center' },
  colorSwatch: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginHorizontal: 8,
    borderWidth: 2,
    borderColor: '#EAEAEA',
  },
  stickerPreview: {
    width: 60,
    height: 60,
    marginHorizontal: 8,
  },
  textToolContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 15,
  },
  textInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#DDD',
    borderRadius: 8,
    paddingHorizontal: 15,
    paddingVertical: 8,
    marginRight: 10,
    fontFamily: 'Rubik-Regular',
  },
  addButton: {
    backgroundColor: '#526346',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  addButtonText: {
    color: 'white',
    fontFamily: 'Rubik-Bold',
  },
});

export default ShirtEditorScreen;