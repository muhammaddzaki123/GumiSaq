import { Ionicons } from '@expo/vector-icons';
import Slider from '@react-native-community/slider';
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

// --- ASET ---
const T_SHIRT_IMAGE = require('@/assets/images/baju_polos.png');
const STICKER_HEART = require('@/assets/icons/heart.png');
const STICKER_STAR = require('@/assets/icons/star.png');

// --- KONSTANTA ---
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

// --- Komponen Anak ---

const EditableElement = React.memo(({ element, isActive, onActivate, onUpdate, canvasBounds }: {
    element: ElementState;
    isActive: boolean;
    onActivate: (id: number | null) => void;
    onUpdate: (id: number, updates: Partial<ElementState>) => void;
    canvasBounds: { width: number; height: number };
}) => {
    const x = useSharedValue(element.x);
    const y = useSharedValue(element.y);
    const savedOffset = useSharedValue({ x: 0, y: 0 });

    const panGesture = Gesture.Pan()
        .onBegin(() => {
            'worklet';
            savedOffset.value = { x: x.value, y: y.value };
            runOnJS(onActivate)(element.id);
        })
        .onUpdate((e) => {
            'worklet';
            const newX = savedOffset.value.x + e.translationX;
            const newY = savedOffset.value.y + e.translationY;

            const halfWidth = (element.type === 'text' ? 50 : 40) * element.scale;
            const halfHeight = (element.type === 'text' ? 25 : 40) * element.scale;

            x.value = Math.max(-canvasBounds.width / 2 + halfWidth, Math.min(canvasBounds.width / 2 - halfWidth, newX));
            y.value = Math.max(-canvasBounds.height / 2 + halfHeight, Math.min(canvasBounds.height / 2 - halfHeight, newY));
        })
        .onEnd(() => {
            'worklet';
            runOnJS(onUpdate)(element.id, { x: x.value, y: y.value });
        });

    const tapGesture = Gesture.Tap().onEnd(() => {
        'worklet';
        runOnJS(onActivate)(element.id);
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
        <GestureDetector gesture={Gesture.Simultaneous(panGesture, tapGesture)}>
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
            </Animated.View>
        </GestureDetector>
    );
});

const ElementEditor = ({ element, onUpdate, onDelete }: {
    element: ElementState;
    onUpdate: (id: number, updates: Partial<ElementState>) => void;
    onDelete: (id: number) => void;
}) => {
    return (
        <View style={styles.editElementTools}>
            {/* Kontrol Ukuran */}
            <View style={styles.sliderContainer}>
                <Ionicons name="scan-outline" size={20} color="#555" />
                <Slider
                    style={{ flex: 1 }}
                    minimumValue={0.5}
                    maximumValue={3}
                    value={element.scale}
                    onValueChange={(val) => onUpdate(element.id, { scale: val })}
                    minimumTrackTintColor="#526346"
                    maximumTrackTintColor="#DDD"
                    thumbTintColor="#526346"
                />
            </View>
            {/* Kontrol Rotasi */}
            <View style={styles.sliderContainer}>
                <Ionicons name="reload-outline" size={20} color="#555" />
                <Slider
                    style={{ flex: 1 }}
                    minimumValue={-Math.PI}
                    maximumValue={Math.PI}
                    value={element.rotation}
                    onValueChange={(val) => onUpdate(element.id, { rotation: val })}
                    minimumTrackTintColor="#526346"
                    maximumTrackTintColor="#DDD"
                    thumbTintColor="#526346"
                />
            </View>
             {/* Kontrol Font & Warna (khusus teks) */}
            {element.type === 'text' && (
                <>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingVertical: 5 }}>
                        {FONTS.map((font) => (
                            <TouchableOpacity key={font.name} style={[styles.fontOption, element.fontFamily === font.family && styles.activeFont]} onPress={() => onUpdate(element.id, { fontFamily: font.family })}>
                                <Text style={{ fontFamily: font.family, color: element.fontFamily === font.family ? 'white' : 'black' }}>{font.name}</Text>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.toolOptionsContainer}>
                        {COLORS.map((color) => (
                            <TouchableOpacity key={color} style={[styles.colorSwatch, { backgroundColor: color, borderWidth: element.color === color ? 2 : 1, borderColor: element.color === color ? '#3498db' : '#EAEAEA' }]} onPress={() => onUpdate(element.id, { color })} />
                        ))}
                    </ScrollView>
                </>
            )}
            {/* Tombol Hapus */}
            <TouchableOpacity onPress={() => onDelete(element.id)} style={styles.deleteButton}>
                <Ionicons name="trash-outline" size={24} color="#D32F2F" />
                <Text style={styles.deleteButtonText}>Hapus</Text>
            </TouchableOpacity>
        </View>
    );
};

const ToolTab = ({ icon, label, active, onPress }: { icon: any, label: string, active: boolean, onPress: () => void }) => (
    <TouchableOpacity onPress={onPress} style={styles.tab}>
        <Ionicons name={icon} size={24} color={active ? '#526346' : '#888'} />
        <Text style={[styles.tabText, active && styles.activeTabText]}>{label}</Text>
    </TouchableOpacity>
);


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

    const updateElement = useCallback((id: number, updates: Partial<ElementState>) => {
        setElements(prev => prev.map(el => el.id === id ? { ...el, ...updates } : el));
    }, []);

    const getActiveElement = () => elements.find(el => el.id === activeElementId);

    const onCanvasLayout = (event: LayoutChangeEvent) => {
        const { width, height } = event.nativeEvent.layout;
        setCanvasBounds({ width: width * 0.8, height: height * 0.8 });
    };

    const renderToolOptions = () => {
        const activeElement = getActiveElement();

        if (activeElement) {
            return <ElementEditor element={activeElement} onUpdate={updateElement} onDelete={deleteElement} />;
        }

        switch (activeTool) {
            case 'tshirt':
                return (
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.toolOptionsContainer}>
                        {COLORS.map((color) => ( <TouchableOpacity key={color} style={[styles.colorSwatch, { backgroundColor: color, borderWidth: shirtColor === color ? 2 : 1, borderColor: shirtColor === color ? '#3498db' : '#EAEAEA' }]} onPress={() => setShirtColor(color)} /> ))}
                    </ScrollView>
                );
            case 'sticker':
                return (
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.toolOptionsContainer}>
                        {STICKERS.map((sticker, index) => (
                            <TouchableOpacity key={index} onPress={() => { addElement('sticker', sticker); setActiveTool('sticker'); }}>
                                <Image source={sticker} style={styles.stickerPreview} resizeMode="contain" />
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                );
            case 'text':
                 return (
                    <View style={styles.textToolContainer}>
                        <TextInput style={styles.textInput} placeholder="Ketik teks di sini..." value={textInputValue} onChangeText={setTextInputValue} />
                        <TouchableOpacity style={styles.addButton} onPress={() => { if (textInputValue.trim()) { addElement('text', textInputValue); setTextInputValue(''); setActiveTool('text'); }}}>
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
                    <TouchableOpacity style={{flex: 1}} activeOpacity={1} onPress={() => setActiveElementId(null)}>
                        <View style={styles.canvas}>
                            <Image source={T_SHIRT_IMAGE} style={[styles.shirtImage, { tintColor: shirtColor }]} resizeMode="contain" />
                            {elements.map((el) => (
                                <EditableElement key={el.id} element={el} isActive={el.id === activeElementId} onActivate={setActiveElementId} onUpdate={updateElement} canvasBounds={canvasBounds}/>
                            ))}
                        </View>
                    </TouchableOpacity>
                </View>

                <View style={styles.bottomPanel}>
                    <View style={styles.toolOptionsArea}>{renderToolOptions()}</View>
                    
                    {!getActiveElement() && (
                        <View style={styles.toolTabs}>
                            <ToolTab icon="shirt-outline" label="Baju" active={activeTool === 'tshirt'} onPress={() => setActiveTool('tshirt')} />
                            <ToolTab icon="happy-outline" label="Stiker" active={activeTool === 'sticker'} onPress={() => setActiveTool('sticker')} />
                            <ToolTab icon="text" label="Teks" active={activeTool === 'text'} onPress={() => setActiveTool('text')} />
                        </View>
                    )}
                </View>
            </SafeAreaView>
        </GestureHandlerRootView>
    );
};


// --- Stylesheet ---
const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#FFFFFF' },
    header: { paddingVertical: 16, alignItems: 'center', borderBottomWidth: 1, borderBottomColor: '#EEE' },
    headerTitle: { fontSize: 20, fontFamily: 'Rubik-Bold', color: '#191D31' },
    canvasContainer: { flex: 1, padding: 16, backgroundColor: '#F0F0F0' },
    canvas: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'transparent' },
    shirtImage: { width: '80%', height: '80%' },
    elementContainer: { padding: 5, alignItems: 'center', justifyContent: 'center' },
    activeBorder: { borderWidth: 2, borderColor: '#3498db', borderStyle: 'dashed', borderRadius: 8 },
    stickerImage: { width: 80, height: 80 },
    textElement: { fontSize: 40, padding: 5, textAlign: 'center' },
    // --- PERUBAHAN UTAMA DI SINI ---
    bottomPanel: { 
        backgroundColor: 'white', 
        borderTopWidth: 1, 
        borderTopColor: '#EEE', 
        paddingBottom: 90, // Menambahkan padding bawah untuk memberi ruang dari tab bar
    },
    toolOptionsArea: { minHeight: 70, justifyContent: 'center', paddingVertical: 5 },
    toolTabs: { flexDirection: 'row', justifyContent: 'space-around', paddingTop: 10, borderTopWidth: 1, borderColor: '#F5F5F5' },
    tab: { alignItems: 'center', gap: 4, flex: 1 },
    tabText: { fontFamily: 'Rubik-Medium', color: '#888', fontSize: 12 },
    activeTabText: { color: '#526346' },
    toolOptionsContainer: { paddingHorizontal: 16, alignItems: 'center' },
    colorSwatch: { width: 40, height: 40, borderRadius: 20, marginHorizontal: 6, },
    stickerPreview: { width: 50, height: 50, marginHorizontal: 8 },
    fontOption: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 18, backgroundColor: '#F1F1F1', marginHorizontal: 5 },
    activeFont: { backgroundColor: '#526346' },
    textToolContainer: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, flex: 1 },
    textInput: { flex: 1, borderWidth: 1, borderColor: '#DDD', borderRadius: 8, paddingHorizontal: 15, paddingVertical: Platform.OS === 'ios' ? 12 : 8, marginRight: 10, fontFamily: 'Rubik-Regular' },
    addButton: { padding: 8 },
    editElementTools: { paddingHorizontal: 16, gap: 10, paddingVertical: 10 },
    sliderContainer: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    deleteButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 12, backgroundColor: '#FFF0F0', borderRadius: 8, marginTop: 10, },
    deleteButtonText: { color: '#D32F2F', marginLeft: 8, fontFamily: 'Rubik-Bold' }
});

export default ShirtEditorScreen;