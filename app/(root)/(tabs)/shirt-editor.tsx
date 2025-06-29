import { Ionicons } from '@expo/vector-icons';
import Slider from '@react-native-community/slider'; // Pastikan Anda sudah menginstal ini
import React, { useCallback, useState } from 'react';
import {
  Image,
  ImageSourcePropType,
  LayoutChangeEvent,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Gesture, GestureDetector, GestureHandlerRootView } from 'react-native-gesture-handler';
import Animated, { runOnJS, useAnimatedStyle, useSharedValue } from 'react-native-reanimated';

// --- Instalasi Tambahan ---
// Jalankan perintah ini di terminal Anda jika belum menginstal slider:
// npx expo install @react-native-community/slider

// --- ASET ---
const T_SHIRT_IMAGE = require('@/assets/images/baju_polos.png');
const STICKER_HEART = require('@/assets/icons/heart.png');
const STICKER_STAR = require('@/assets/icons/star.png');

const COLORS = ['#FFFFFF', '#000000', '#D32F2F', '#1976D2', '#388E3C', '#FBC02D', '#8E24AA', '#616161'];
const STICKERS = [STICKER_HEART, STICKER_STAR];
const FONTS = [
    { name: 'Normal', family: 'Rubik-Regular' },
    { name: 'Tebal', family: 'Rubik-Bold' },
    { name: 'Miring', family: 'Rubik-Light' },
];

// --- Tipe Data ---
interface ElementState {
    id: number;
    type: 'text' | 'sticker';
    value: string | ImageSourcePropType;
    x: number; y: number;
    scale: number; rotation: number;
    color: string; fontFamily: string;
}

// --- Komponen Anak: EditableElement ---
const EditableElement = React.memo(({ element, isActive, onActivate, onDelete, onUpdate, canvasBounds }: {
    element: ElementState;
    isActive: boolean;
    onActivate: (id: number) => void;
    onDelete: (id: number) => void;
    onUpdate: (id: number, updates: Partial<ElementState>) => void;
    canvasBounds: { width: number; height: number };
}) => {
    const x = useSharedValue(element.x);
    const y = useSharedValue(element.y);
    const scale = useSharedValue(element.scale);
    const rotation = useSharedValue(element.rotation);

    const savedOffset = useSharedValue({ x: 0, y: 0 });

    const handleActivation = useCallback(() => {
        'worklet';
        runOnJS(onActivate)(element.id);
    }, [element.id, onActivate]);

    const panGesture = Gesture.Pan()
        .onBegin(() => {
            handleActivation();
            savedOffset.value = { x: x.value, y: y.value };
        })
        .onUpdate((e) => {
            const newX = savedOffset.value.x + e.translationX;
            const newY = savedOffset.value.y + e.translationY;
            
            // Batasi pergerakan di dalam canvas (area baju)
            const halfWidth = (element.type === 'text' ? 50 : 40) * scale.value;
            const halfHeight = (element.type === 'text' ? 25 : 40) * scale.value;
            
            x.value = Math.max(-canvasBounds.width / 2 + halfWidth, Math.min(canvasBounds.width / 2 - halfWidth, newX));
            y.value = Math.max(-canvasBounds.height / 2 + halfHeight, Math.min(canvasBounds.height / 2 - halfHeight, newY));
        })
        .onEnd(() => {
            runOnJS(onUpdate)(element.id, { x: x.value, y: y.value });
        });

    const animatedStyle = useAnimatedStyle(() => ({
        position: 'absolute',
        transform: [
            { translateX: x.value },
            { translateY: y.value },
            { scale: element.scale },
            { rotate: `${element.rotation}rad` },
        ],
    }));

    return (
        <GestureDetector gesture={panGesture}>
            <Animated.View style={animatedStyle}>
                <View style={[styles.elementContainer, isActive && styles.activeBorder]}>
                    {element.type === 'sticker' ? (
                        <Image source={element.value as ImageSourcePropType} style={styles.stickerImage} resizeMode="contain" />
                    ) : (
                        <Text style={[styles.textElement, { color: element.color, fontFamily: element.fontFamily }]}>
                            {element.value as string}
                        </Text>
                    )}
                </View>
                {isActive && (
                    <TouchableOpacity onPress={() => onDelete(element.id)} style={styles.deleteHandle}>
                        <Ionicons name="close-circle" size={24} color="#D32F2F" />
                    </TouchableOpacity>
                )}
            </Animated.View>
        </GestureDetector>
    );
});

// --- Komponen Utama ---
const ShirtEditorScreen = () => {
    const [shirtColor, setShirtColor] = useState('#FFFFFF');
    const [elements, setElements] = useState<ElementState[]>([]);
    const [activeElementId, setActiveElementId] = useState<number | null>(null);
    const [textInputValue, setTextInputValue] = useState('');
    const [activeTool, setActiveTool] = useState<'tshirt' | 'sticker' | 'text'>('tshirt');
    const [canvasBounds, setCanvasBounds] = useState({ width: 0, height: 0 });

    const addElement = (type: 'sticker' | 'text', value: any) => {
        const newElement: ElementState = {
            id: Date.now(), type, value,
            x: 0, y: 0, scale: 1, rotation: 0,
            color: '#000000', fontFamily: 'Rubik-Regular',
        };
        setElements(prev => [...prev, newElement]);
        setActiveElementId(newElement.id);
    };
    
    const deleteElement = (id: number) => {
        setElements(prev => prev.filter(el => el.id !== id));
        if (activeElementId === id) setActiveElementId(null);
    };

    const updateElement = (id: number, updates: Partial<ElementState>) => {
        setElements(prev => prev.map(el => el.id === id ? { ...el, ...updates } : el));
    };

    const getActiveElement = () => elements.find(el => el.id === activeElementId);

    const onCanvasLayout = (event: LayoutChangeEvent) => {
        const { width, height } = event.nativeEvent.layout;
        // Kita gunakan 80% dari ukuran canvas sebagai batas area baju
        setCanvasBounds({ width: width * 0.8, height: height * 0.8 });
    };

    const renderToolOptions = () => {
        const activeElement = getActiveElement();

        if (activeElement) { // Jika ada elemen yang aktif
            return (
                <View style={styles.editElementTools}>
                    <View style={styles.sliderContainer}>
                       <Ionicons name="scan-outline" size={20} color="#555" />
                       <Slider
                           style={{ flex: 1 }}
                           minimumValue={0.5}
                           maximumValue={3}
                           value={activeElement.scale}
                           onValueChange={(val) => updateElement(activeElement.id, { scale: val })}
                           minimumTrackTintColor="#526346"
                           maximumTrackTintColor="#DDD"
                           thumbTintColor="#526346"
                       />
                    </View>
                     <View style={styles.sliderContainer}>
                       <Ionicons name="reload-outline" size={20} color="#555" />
                       <Slider
                           style={{ flex: 1 }}
                           minimumValue={-Math.PI}
                           maximumValue={Math.PI}
                           value={activeElement.rotation}
                           onValueChange={(val) => updateElement(activeElement.id, { rotation: val })}
                           minimumTrackTintColor="#526346"
                           maximumTrackTintColor="#DDD"
                           thumbTintColor="#526346"
                       />
                    </View>
                    {activeElement.type === 'text' && (
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingVertical: 5 }}>
                             {FONTS.map((font) => (
                                <TouchableOpacity key={font.name} style={[styles.fontOption, activeElement.fontFamily === font.family && styles.activeFont]} onPress={() => updateElement(activeElement.id, { fontFamily: font.family })}>
                                    <Text style={{ fontFamily: font.family, color: activeElement.fontFamily === font.family ? 'white' : 'black' }}>{font.name}</Text>
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
                    )}
                </View>
            );
        }

        switch (activeTool) {
            case 'tshirt':
                return (
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.toolOptionsContainer}>
                        {COLORS.map((color) => ( <TouchableOpacity key={color} style={[styles.colorSwatch, { backgroundColor: color }]} onPress={() => setShirtColor(color)} /> ))}
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
                        <TextInput style={styles.textInput} placeholder="Ketik teks di sini..." value={textInputValue} onChangeText={setTextInputValue} />
                        <TouchableOpacity style={styles.addButton} onPress={() => { if (textInputValue.trim()) { addElement('text', textInputValue); setTextInputValue(''); }}}>
                            <Ionicons name="add-circle" size={28} color="#526346" />
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
                <View style={styles.header}><Text style={styles.headerTitle}>Editor Baju</Text></View>

                <View style={styles.canvasContainer} onLayout={onCanvasLayout}>
                    <View style={styles.canvas}>
                        <Image source={T_SHIRT_IMAGE} style={[styles.shirtImage, { tintColor: shirtColor }]} resizeMode="contain" />
                        {elements.map((el) => (
                            <EditableElement key={el.id} element={el} isActive={el.id === activeElementId} onActivate={setActiveElementId} onDelete={deleteElement} onUpdate={updateElement} canvasBounds={canvasBounds}/>
                        ))}
                    </View>
                </View>

                <View style={styles.bottomPanel}>
                    <View style={styles.toolOptionsArea}>{renderToolOptions()}</View>
                    <View style={styles.toolTabs}>
                        <ToolTab icon="shirt-outline" label="Baju" activeTool={activeTool} onPress={() => setActiveTool('tshirt')} />
                        <ToolTab icon="happy-outline" label="Stiker" activeTool={activeTool} onPress={() => setActiveTool('sticker')} />
                        <ToolTab icon="text" label="Teks" activeTool={activeTool} onPress={() => setActiveTool('text')} />
                    </View>
                </View>
            </SafeAreaView>
        </GestureHandlerRootView>
    );
};

const ToolTab = ({ icon, label, activeTool, onPress }: { icon: any, label: string, activeTool: string, onPress: () => void }) => (
    <TouchableOpacity onPress={onPress} style={styles.tab}><Ionicons name={icon} size={24} color={activeTool.toLowerCase() === label.toLowerCase() ? '#526346' : '#888'} /><Text style={[styles.tabText, activeTool.toLowerCase() === label.toLowerCase() && styles.activeTabText]}>{label}</Text></TouchableOpacity>
);

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F0F0F0' },
    header: { paddingVertical: 16, backgroundColor: 'white', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: '#EEE' },
    headerTitle: { fontSize: 20, fontFamily: 'Rubik-Bold', color: '#191D31' },
    canvasContainer: { flex: 1, padding: 16 },
    canvas: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'white', borderRadius: 12, borderWidth: 1, borderColor: '#DDD', overflow: 'hidden' },
    shirtImage: { width: '80%', height: '80%' },
    elementContainer: { padding: 5, alignItems: 'center', justifyContent: 'center' },
    activeBorder: { borderWidth: 2, borderColor: '#3498db', borderStyle: 'dashed', borderRadius: 8 },
    stickerImage: { width: 80, height: 80 },
    textElement: { fontSize: 40, padding: 5, textAlign: 'center' },
    deleteHandle: { position: 'absolute', top: -12, right: -12, backgroundColor: 'white', borderRadius: 12, padding: 2, shadowColor: "#000", shadowOffset: { width: 0, height: 1, }, shadowOpacity: 0.22, shadowRadius: 2.22, elevation: 3 },
    bottomPanel: { backgroundColor: 'white', borderTopWidth: 1, borderTopColor: '#EEE', paddingBottom: 70 },
    toolOptionsArea: { minHeight: 70, justifyContent: 'center', paddingVertical: 5 },
    toolTabs: { flexDirection: 'row', justifyContent: 'space-around', paddingTop: 10 },
    tab: { alignItems: 'center', gap: 4 },
    tabText: { fontFamily: 'Rubik-Medium', color: '#888', fontSize: 12 },
    activeTabText: { color: '#526346' },
    toolOptionsContainer: { paddingHorizontal: 16, alignItems: 'center' },
    colorSwatch: { width: 40, height: 40, borderRadius: 20, marginHorizontal: 6, borderWidth: 2, borderColor: '#EAEAEA' },
    stickerPreview: { width: 50, height: 50, marginHorizontal: 8 },
    fontOption: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 18, backgroundColor: '#F1F1F1', marginHorizontal: 5 },
    activeFont: { backgroundColor: '#526346' },
    textToolContainer: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, flex: 1 },
    textInput: { flex: 1, borderWidth: 1, borderColor: '#DDD', borderRadius: 8, paddingHorizontal: 15, paddingVertical: Platform.OS === 'ios' ? 12 : 8, marginRight: 10, fontFamily: 'Rubik-Regular'},
    addButton: { padding: 8 },
    divider: { width: 1, height: '60%', backgroundColor: '#DDD', marginHorizontal: 10 },
    editElementTools: { paddingHorizontal: 16, gap: 5 },
    sliderContainer: { flexDirection: 'row', alignItems: 'center', gap: 8 },
});

export default ShirtEditorScreen;