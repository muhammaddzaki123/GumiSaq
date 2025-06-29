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
                <View className={`p-1 items-center justify-center ${isActive ? 'border-2 border-dashed border-blue-500 rounded-lg' : ''}`}>
                    {element.type === 'sticker' ? (
                        <Image source={element.value as ImageSourcePropType} className="w-20 h-20" resizeMode="contain" />
                    ) : (
                        <Text style={[{ color: element.color, fontFamily: element.fontFamily }, {fontSize: 40, textAlign: 'center'}]}>
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
        <View className="px-4 py-2 space-y-3">
            <View className="flex-row items-center space-x-2">
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
            <View className="flex-row items-center space-x-2">
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
            {element.type === 'text' && (
                <>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingVertical: 5 }}>
                        {FONTS.map((font) => (
                            <TouchableOpacity key={font.name} className={`px-4 py-2 rounded-full mx-1 ${element.fontFamily === font.family ? 'bg-primary-100' : 'bg-gray-200'}`} onPress={() => onUpdate(element.id, { fontFamily: font.family })}>
                                <Text style={{ fontFamily: font.family, color: element.fontFamily === font.family ? 'white' : 'black' }}>{font.name}</Text>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ alignItems: 'center' }}>
                        {COLORS.map((color) => (
                            <TouchableOpacity key={color} style={[{ backgroundColor: color}, { borderWidth: element.color === color ? 2 : 1, borderColor: element.color === color ? '#3498db' : '#EAEAEA' }]} className="w-10 h-10 rounded-full mx-1.5" onPress={() => onUpdate(element.id, { color })} />
                        ))}
                    </ScrollView>
                </>
            )}
            <TouchableOpacity onPress={() => onDelete(element.id)} className="flex-row items-center justify-center p-3 bg-red-100 rounded-lg mt-2">
                <Ionicons name="trash-outline" size={24} color="#D32F2F" />
                <Text className="text-red-600 ml-2 font-rubik-bold">Hapus</Text>
            </TouchableOpacity>
        </View>
    );
};

const ToolTab = ({ icon, label, active, onPress }: { icon: any, label: string, active: boolean, onPress: () => void }) => (
    <TouchableOpacity onPress={onPress} className="items-center gap-1 flex-1">
        <Ionicons name={icon} size={24} color={active ? '#526346' : '#888'} />
        <Text className={`font-rubik-medium text-xs ${active ? 'text-primary-100' : 'text-gray-500'}`}>{label}</Text>
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
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ alignItems: 'center', paddingHorizontal: 16 }}>
                        {COLORS.map((color) => (
                          <TouchableOpacity key={color} style={[{ backgroundColor: color}, { borderWidth: shirtColor === color ? 2 : 1, borderColor: shirtColor === color ? '#3498db' : '#EAEAEA' }]} className="w-10 h-10 rounded-full mx-1.5" onPress={() => setShirtColor(color)} />
                        ))}
                    </ScrollView>
                );
            case 'sticker':
                return (
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ alignItems: 'center', paddingHorizontal: 16 }}>
                        {STICKERS.map((sticker, index) => (
                            <TouchableOpacity key={index} className="mx-2" onPress={() => { addElement('sticker', sticker); setActiveTool('sticker'); }}>
                                <Image source={sticker} className="w-12 h-12" resizeMode="contain" />
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                );
            case 'text':
                 return (
                    <View className="flex-row items-center px-4 flex-1">
                        <TextInput className="flex-1 border border-gray-300 rounded-lg px-4 py-2 mr-2 font-rubik" placeholder="Ketik teks di sini..." value={textInputValue} onChangeText={setTextInputValue} />
                        <TouchableOpacity className="p-2" onPress={() => { if (textInputValue.trim()) { addElement('text', textInputValue); setTextInputValue(''); setActiveTool('text'); }}}>
                            <Ionicons name="add-circle" size={28} color="#526346" />
                        </TouchableOpacity>
                    </View>
                );
            default: return null;
        }
    };

    return (
        <GestureHandlerRootView style={{ flex: 1 }}>
            <SafeAreaView className="flex-1 bg-white">
                <View className="py-4 items-center border-b border-gray-200">
                    <Text className="text-xl font-rubik-bold text-black-300">Editor Baju</Text>
                </View>

                <View className="flex-1 p-4 bg-gray-100" onLayout={onCanvasLayout}>
                    <TouchableOpacity className="flex-1" activeOpacity={1} onPress={() => setActiveElementId(null)}>
                        <View className="flex-1 justify-center items-center">
                            <Image source={T_SHIRT_IMAGE} style={{ tintColor: shirtColor }} className="w-4/5 h-4/5" resizeMode="contain" />
                            {elements.map((el) => (
                                <EditableElement key={el.id} element={el} isActive={el.id === activeElementId} onActivate={setActiveElementId} onUpdate={updateElement} canvasBounds={canvasBounds}/>
                            ))}
                        </View>
                    </TouchableOpacity>
                </View>

                <View className="bg-white border-t border-gray-200 pb-[90px] pt-2">
                    <View className="min-h-[70px] justify-center py-1">
                        {renderToolOptions()}
                    </View>
                    
                    {!getActiveElement() && (
                        <View className="flex-row justify-around pt-2 border-t border-gray-100">
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

export default ShirtEditorScreen;