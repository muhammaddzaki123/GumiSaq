import { Artikel } from "@/components/Berita";
import DetailArtikel from "@/components/DetailArtikel";
import Search from "@/components/Search";
import { Article } from "@/constants/article";
import { useArticles } from "@/constants/useArticles";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams } from "expo-router";
import React, { useEffect, useState } from "react";
import {
	FlatList,
	ScrollView,
	Text,
	TouchableOpacity,
	View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const categories = ["Semua", "Hiburan", "Benda", "Tradisi", "Adat"];

const ArtikelScreen = () => {
	const {
		articles,
		loading,
		error,
		searchArticles,
		filteredArticles,
	} = useArticles();
	const [selectedCategory, setSelectedCategory] = useState("Semua");
	const [selectedArticleId, setSelectedArticleId] = useState<string | null>(
		null
	);
	const params = useLocalSearchParams<{ query?: string }>();

	// Handle search from URL params
	useEffect(() => {
		if (params.query) {
			searchArticles(params.query);
		}
	}, [params.query]);

	// Handle category filtering
	useEffect(() => {
		if (selectedCategory === "Semua") {
			searchArticles(""); // Reset to show all articles
		} else {
			searchArticles(selectedCategory);
		}
	}, [selectedCategory]);

	const handleArticlePress = (article: Article) => {
		setSelectedArticleId(article.$id); // Set id artikel yang dipilih
	};

	const handleBackToList = () => {
		setSelectedArticleId(null); // Kembali ke daftar artikel
	};

	// Jika ada artikel yang dipilih, tampilkan detail (tombol back hanya di detail)
	if (selectedArticleId) {
		return <DetailArtikel id={selectedArticleId} onBack={handleBackToList} />;
	}

	return (
		<SafeAreaView className="bg-primary-100 h-full p-4">
			{/* Header */}
			<View className="flex-row items-center">
				<TouchableOpacity onPress={handleBackToList}>
					<Ionicons name="arrow-back" size={24} color="white" />
				</TouchableOpacity>
				<Text className="text-white text-xl font-bold ml-4">ARTIKEL GIZI</Text>
				<TouchableOpacity onPress={handleBackToList} className="ml-auto">
					<Text className="text-3xl text-white mr-4">×</Text>
				</TouchableOpacity>
			</View>

			{/* Search */}
			<View className="flex flex-col mt-4 border-t pt-2 border-white">
				<Search />
			</View>

			{/* Categories */}
			<ScrollView
				horizontal
				showsHorizontalScrollIndicator={false}
				className="mt-3 mb-2"
			>
				{categories.map((category, index) => (
					<TouchableOpacity
						key={index}
						onPress={() => setSelectedCategory(category)}
						className={`flex flex-col items-start mr-4 px-4 rounded-full h-6 mb-3 ${
							selectedCategory === category ? "bg-white" : "bg-primary-400"
						}`}
					>
						<Text
							className={`text-sm  ${
								selectedCategory === category
									? "text-primary-500"
									: "text-black-200"
							}`}
						>
							{category}
						</Text>
					</TouchableOpacity>
				))}
			</ScrollView>

			{/* Content */}
			{loading ? (
				<View className="flex-1 justify-center items-center">
					<Text className="text-white">Loading articles...</Text>
				</View>
			) : error ? (
				<View className="flex-1 justify-center items-center">
					<Text className="text-white">{error}</Text>
				</View>
			) : filteredArticles.length === 0 ? (
				<View className="flex-1 justify-center items-center">
					<Text className="text-white">No articles found</Text>
				</View>
			) : (
				<FlatList
					data={filteredArticles}
					renderItem={({ item }) => (
						<Artikel item={item} onPress={() => handleArticlePress(item)} />
					)}
					numColumns={2}
					columnWrapperClassName="flex gap-5 px-5"
					contentContainerClassName="pb-32"
					showsHorizontalScrollIndicator={false}
					className="bg-primary-100 mt-4"
				/>
			)}
		</SafeAreaView>
	);
};

export default ArtikelScreen;