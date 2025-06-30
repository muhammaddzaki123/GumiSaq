import { getArticleById } from "@/lib/article";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
	ActivityIndicator,
	Animated,
	Dimensions,
	Image,
	Platform,
	StatusBar,
	StyleSheet,
	Text,
	TouchableOpacity,
	View
} from "react-native";

const { width } = Dimensions.get("window");
const HEADER_HEIGHT = 350;

const DetailArtikel = ({ id, onBack }: { id: string; onBack?: () => void }) => {
	const router = useRouter();
	const [data, setData] = useState<any>(null);
	const [loading, setLoading] = useState(true);
	const scrollY = useRef(new Animated.Value(0)).current;

	useEffect(() => {
		if (id) {
			getArticleById(id).then((res) => {
				setData(res);
				setLoading(false);
			});
		}
	}, [id]);

    // --- PERBAIKAN UTAMA DI SINI ---
    // Membuat scroll handler di luar JSX menggunakan useCallback
    const handleScroll = useCallback(
        Animated.event(
            [{ nativeEvent: { contentOffset: { y: scrollY } } }],
            { useNativeDriver: false } // useNativeDriver: false diperlukan untuk interpolasi
        ),
        [scrollY]
    );

	const headerTranslateY = scrollY.interpolate({
		inputRange: [0, HEADER_HEIGHT],
		outputRange: [0, -HEADER_HEIGHT],
		extrapolate: "clamp",
	});

	const imageOpacity = scrollY.interpolate({
		inputRange: [0, HEADER_HEIGHT / 2],
		outputRange: [1, 0],
		extrapolate: 'clamp',
	});
    
	const titleTranslateY = scrollY.interpolate({
		inputRange: [0, HEADER_HEIGHT / 2, HEADER_HEIGHT],
		outputRange: [0, -50, -80],
		extrapolate: 'clamp',
	});

	if (loading) {
		return (
			<View style={styles.centeredContainer}>
				<ActivityIndicator size="large" color="#526346" />
			</View>
		);
	}

	if (!data) {
		return (
			<View style={styles.centeredContainer}>
				<Text style={styles.errorText}>Artikel tidak ditemukan.</Text>
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
		<View style={styles.container}>
			<StatusBar barStyle="light-content" />

			<TouchableOpacity
				onPress={onBack || (() => router.back())}
				style={styles.backButton}
			>
				<Ionicons name="arrow-back" size={28} color="#fff" />
			</TouchableOpacity>

			<Animated.View style={[styles.header, { transform: [{ translateY: headerTranslateY }] }]}>
				<Animated.Image
					source={{ uri: data.image }}
					style={[styles.headerImage, { opacity: imageOpacity }]}
					resizeMode="cover"
				/>
				<View style={styles.headerOverlay} />
                 <Animated.View style={[styles.headerContent, { transform: [{ translateY: titleTranslateY }] }]}>
                    <Text style={styles.headerCategory}>{data.category}</Text>
                    <Text style={styles.headerTitle}>{data.title}</Text>
                </Animated.View>
			</Animated.View>

			<Animated.ScrollView
				contentContainerStyle={styles.scrollContainer}
				showsVerticalScrollIndicator={false}
                // Menggunakan handler yang sudah dibuat
				onScroll={handleScroll} 
                scrollEventThrottle={16}
			>
                <View style={styles.metaContainer}>
                    <View style={styles.authorInfo}>
                        <Image source={{ uri: `https://ui-avatars.com/api/?name=${data.author}&background=8CCD61&color=fff` }} style={styles.authorAvatar} />
                        <View>
                            <Text style={styles.authorName}>{data.author}</Text>
                            <Text style={styles.publishDate}>{dateString}</Text>
                        </View>
                    </View>
                    <View style={styles.statsInfo}>
                        <Ionicons name="eye-outline" size={16} color="#6B7280" />
                        <Text style={styles.viewCount}>{data.viewCount} views</Text>
                    </View>
                </View>

				<View style={styles.contentBody}>
					<Text style={styles.descriptionText}>{data.description}</Text>
                    
                    {data.image2 && (
						<Image
							source={{ uri: data.image2 }}
							style={styles.contentImage}
							resizeMode="cover"
						/>
					)}
					{data.description2 && (
						<Text style={styles.descriptionText}>{data.description2}</Text>
					)}

                    {data.image3 && (
						<Image
							source={{ uri: data.image3 }}
							style={styles.contentImage}
							resizeMode="cover"
						/>
					)}
					{data.description3 && (
						<Text style={styles.descriptionText}>{data.description3}</Text>
					)}

                    {data.tags && data.tags.length > 0 && (
                        <View style={styles.tagsContainer}>
                            {data.tags.map((tag: string, index: number) => (
                                <View key={index} style={styles.tag}>
                                    <Text style={styles.tagText}>{tag}</Text>
                                </View>
                            ))}
                        </View>
                    )}
				</View>
			</Animated.ScrollView>
		</View>
	);
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: 'white' },
    centeredContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    errorText: { fontFamily: 'Rubik-Medium', fontSize: 16, color: '#374151' },
    backButton: {
        position: 'absolute',
        top: Platform.OS === 'ios' ? 60 : 40,
        left: 16,
        zIndex: 10,
        backgroundColor: 'rgba(0,0,0,0.3)',
        borderRadius: 20,
        width: 40,
        height: 40,
        justifyContent: 'center',
        alignItems: 'center',
    },
    header: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: HEADER_HEIGHT,
        zIndex: 1,
        justifyContent: 'flex-end',
    },
    headerImage: {
        ...StyleSheet.absoluteFillObject,
        width: '100%',
        height: HEADER_HEIGHT,
    },
    headerOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.4)',
    },
    headerContent: {
        padding: 20,
    },
    headerCategory: {
        fontFamily: 'Rubik-Medium',
        fontSize: 14,
        color: 'white',
        backgroundColor: '#526346',
        alignSelf: 'flex-start',
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 99,
        overflow: 'hidden',
        marginBottom: 8,
    },
    headerTitle: {
        fontFamily: 'Rubik-Bold',
        fontSize: 28,
        color: 'white',
        lineHeight: 36,
        textShadowColor: 'rgba(0, 0, 0, 0.5)',
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 3,
    },
    scrollContainer: {
        paddingTop: HEADER_HEIGHT,
        backgroundColor: 'white',
    },
    metaContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 16,
        paddingHorizontal: 20,
        borderBottomWidth: 1,
        borderColor: '#F3F4F6',
    },
    authorInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    authorAvatar: {
        width: 40,
        height: 40,
        borderRadius: 20,
    },
    authorName: {
        fontFamily: 'Rubik-Medium',
        fontSize: 14,
        color: '#1F2937',
    },
    publishDate: {
        fontFamily: 'Rubik-Regular',
        fontSize: 12,
        color: '#6B7280',
    },
    statsInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    viewCount: {
        fontFamily: 'Rubik-Regular',
        fontSize: 12,
        color: '#6B7280',
    },
    contentBody: {
        padding: 20,
    },
    descriptionText: {
        fontFamily: 'Rubik-Regular',
        fontSize: 16,
        lineHeight: 28,
        color: '#374151',
        marginBottom: 20,
    },
    contentImage: {
        width: '100%',
        height: 200,
        borderRadius: 12,
        marginBottom: 20,
    },
    tagsContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
        marginTop: 24,
        borderTopWidth: 1,
        borderColor: '#F3F4F6',
        paddingTop: 24,
    },
    tag: {
        backgroundColor: '#F3F4F6',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 99,
    },
    tagText: {
        fontFamily: 'Rubik-Medium',
        fontSize: 12,
        color: '#374151',
    },
});

export default DetailArtikel;