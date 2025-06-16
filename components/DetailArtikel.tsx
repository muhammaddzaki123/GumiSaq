import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
	ActivityIndicator,
	Animated,
	Dimensions,
	Image,
	Platform,
	SafeAreaView,
	StatusBar,
	StyleSheet,
	Text,
	TouchableOpacity,
	View,
} from "react-native";
import { getArticleById } from "@/lib/article";

const { width } = Dimensions.get("window");
const HEADER_HEIGHT = 320;

const DetailArtikel = ({ id, onBack }: { id: string; onBack?: () => void }) => {
	const router = useRouter();
	const [data, setData] = useState<any>(null);
	const [loading, setLoading] = useState(true);
	const scrollY = useRef(new Animated.Value(0)).current;
	const [liked, setLiked] = useState(false);
	const scaleAnim = useRef(new Animated.Value(1)).current;

	useEffect(() => {
		if (id) {
			getArticleById(id).then((res) => {
				setData(res);
				setLoading(false);
			});
		}
	}, [id]);

	const overlayOpacity = scrollY.interpolate({
		inputRange: [0, HEADER_HEIGHT / 2, HEADER_HEIGHT - 40],
		outputRange: [0, 0.3, 0.7],
		extrapolate: "clamp",
	});

	const buttonOpacity = scrollY.interpolate({
		inputRange: [0, HEADER_HEIGHT - 80],
		outputRange: [1, 0],
		extrapolate: "clamp",
	});

	const handleLike = () => {
		setLiked((prev) => !prev);
		Animated.sequence([
			Animated.timing(scaleAnim, {
				toValue: 1.3,
				duration: 120,
				useNativeDriver: true,
			}),
			Animated.timing(scaleAnim, {
				toValue: 1,
				duration: 120,
				useNativeDriver: true,
			}),
		]).start();
	};

	if (loading) {
		return (
			<View className="flex-1 items-center justify-center bg-primary-100">
				<ActivityIndicator size="large" color="#fff" />
			</View>
		);
	}

	if (!data) {
		return (
			<View className="flex-1 items-center justify-center bg-primary-100">
				<Text className="text-white">Data tidak ditemukan.</Text>
			</View>
		);
	}

	const dateString =
		data.created || data.$createdAt
			? new Date(data.created || data.$createdAt).toLocaleDateString("id-ID", {
					year: "numeric",
					month: "long",
					day: "numeric",
			  })
			: "";

	return (
		<View className="flex-1 bg-primary-100">
			<StatusBar barStyle="light-content" />

			{/* Background Gambar + Overlay */}
			<View className="absolute top-0 left-0 right-0 z-1" pointerEvents="none">
				<Image
					source={{ uri: data.image }}
					style={{ width, height: HEADER_HEIGHT }}
					className="rounded-b-[32px]"
					resizeMode="cover"
				/>
				<Animated.View
					style={[
						StyleSheet.absoluteFill,
						{
							opacity: overlayOpacity,
							backgroundColor: "#222", // Tetap hitam untuk overlay, tidak ada padanan langsung di tailwind.config
							borderBottomLeftRadius: 32,
							borderBottomRightRadius: 32,
						},
					]}
				/>
			</View>

			{/* Tombol Back & Like */}
			<Animated.View
				style={[
					{
						position: "absolute",
						top: Platform.OS === "android" ? 40 : 60,
						left: 0,
						right: 0,
						zIndex: 4,
						opacity: buttonOpacity,
						paddingHorizontal: 16,
						flexDirection: "row",
						justifyContent: "space-between",
						alignItems: "center",
					},
				]}
				pointerEvents="box-none"
			>
				<TouchableOpacity
					onPress={onBack ? onBack : () => router.back()}
					className="p-2"
				>
					<Ionicons name="arrow-back" size={28} color="#fff" />
				</TouchableOpacity>

				<TouchableOpacity
					onPress={handleLike}
					activeOpacity={0.7}
					className="p-2"
				>
					<Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
						<Ionicons
							name={liked ? "heart" : "heart-outline"}
							size={28}
							color={liked ? "#e53935" : "#fff"} // Warna merah untuk hati tetap eksplisit karena tidak ada di tailwind.config
						/>
					</Animated.View>
				</TouchableOpacity>
			</Animated.View>

			{/* Scrollable Konten */}
			<Animated.ScrollView
				className="flex-1 z-4"
				contentContainerStyle={{
					paddingTop: HEADER_HEIGHT - 30,
					paddingBottom: 32,
				}}
				scrollEventThrottle={16}
				showsVerticalScrollIndicator={false}
				onScroll={Animated.event(
					[{ nativeEvent: { contentOffset: { y: scrollY } } }],
					{ useNativeDriver: false }
				)}
			>
				<View className="w-full mt-[-30px] px-5 pt-6 pb-6 bg-primary-100 rounded-t-2xl z-4">
					<View className="items-center py-2">
						<View className="w-16 h-1.5 bg-gray-300 rounded-md mb-2" />
					</View>

					<Text className="text-white text-2xl font-bold mb-1">
						{data.title}
					</Text>
					<Text className="text-gray-300 mb-4">
						{dateString ? `Published ${dateString}` : ""}
					</Text>

					<Text className="text-white mb-3">{data.description}</Text>

					{data.image2 && (
						<Image
							source={{ uri: data.image2 }}
							className="w-full h-[140px] rounded-xl mb-3"
							resizeMode="cover"
						/>
					)}
					{data.description2 && (
						<Text className="text-white mb-3">{data.description2}</Text>
					)}
					{data.image3 && (
						<Image
							source={{ uri: data.image3 }}
							className="w-full h-[140px] rounded-xl mb-3"
							resizeMode="cover"
						/>
					)}
					{data.description3 && (
						<Text className="text-white mb-3">{data.description3}</Text>
					)}
				</View>
			</Animated.ScrollView>

			<SafeAreaView />
		</View>
	);
};

export default DetailArtikel;