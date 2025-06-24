import { settings } from '@/constants/data';
import icons from '@/constants/icons';
import { config, databases, logout, storage } from '@/lib/appwrite';
import { useGlobalContext } from '@/lib/global-provider';
import * as ImagePicker from 'expo-image-picker';
import { router } from "expo-router";
import { useState } from "react";
import {
  Alert,
  Image,
  ImageSourcePropType,
  SafeAreaView,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

interface SettingsItemProp {
  icon: ImageSourcePropType;
  title: string;
  onPress?: () => void;
  textStyle?: string;
  showArrow?: boolean;
}

const ProfileDetailItem = ({ label, value }: { label: string; value: string | number | undefined }) => (
  <View className="flex-row items-center py-2">
    <Text className="text-lg font-rubik-bold w-32">{label}:</Text>
    <Text className="text-lg font-rubik-regular">{value ?? 'Tidak ada'}</Text>
  </View>
);

const SettingsItem = ({
  icon,
  title,
  onPress,
  textStyle,
  showArrow = true,
}: SettingsItemProp) => (
  <TouchableOpacity
    onPress={onPress}
    className="flex flex-row items-center justify-between py-3"
  >
    <View className="flex flex-row items-center gap-3">
      <Image source={icon} className="size-6" />
      <Text className={`text-lg font-rubik-medium text-black-300 ${textStyle}`}>
        {title}
      </Text>
    </View>
    {showArrow && <Image source={icons.rightArrow} className="size-5" />}
  </TouchableOpacity>
);

const Profile = () => {
  const { user, refetch } = useGlobalContext();
  const [isTextExpanded, setIsTextExpanded] = useState(false);
  const initialLinesToShow = 5;

  const handleLogout = async () => {
    const result = await logout();
    if (result) {
      Alert.alert("Success", "Logged out successfully");
      refetch();
      router.push('/sign-in');
    } else {
      Alert.alert("Error", "Failed to logout");
    }
  };

  const toggleText = () => {
    setIsTextExpanded(!isTextExpanded);
  };

  const handleImagePick = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert("Permission Required", "You need to grant access to your photos to change profile picture.");
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.5,
      });

      if (!result.canceled) {
        Alert.alert("Uploading...", "Please wait while we update your profile picture.");

        const file = {
          name: `avatar-${user?.$id}-${Date.now()}.jpg`,
          type: 'image/jpeg',
          uri: result.assets[0].uri,
          size: await new Promise<number>((resolve) => {
            fetch(result.assets[0].uri)
              .then((response) => response.blob())
              .then((blob) => resolve(blob.size))
          })
        };

        const uploadedFile = await storage.createFile(
          config.storageBucketId,
          'unique()',
          file
        );

        const fileUrl = storage.getFileView(config.storageBucketId, uploadedFile.$id);
        console.log('Generated avatar URL:', fileUrl.href);

        try {
          console.log('Updating user profile:', user!.$id);
          const updated = await databases.updateDocument(
            config.databaseId!,
            config.usersProfileCollectionId!,
            user!.$id,
            { avatar: fileUrl.href }
          );
          console.log('User profile updated:', updated);

          console.log('Refreshing user data...');
          await refetch();
          console.log('User data refreshed');
        } catch (updateError) {
          console.error('Error updating profile:', updateError);
          throw updateError;
        }

        Alert.alert("Success", "Profile picture updated successfully!");
      }
    } catch (error) {
      console.error('Error updating profile picture:', error);
      Alert.alert("Error", "Failed to update profile picture. Please try again.");
    }
  };

  return (
    <SafeAreaView className="h-full bg-white">
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerClassName="pb-32 px-7"
      >
        <View className="flex flex-row items-center justify-between mt-5">
          <Text className="text-xl font-rubik-bold">Profile</Text>
          <Image source={icons.bell} className="size-5" />
        </View>

        <View className="flex flex-col items-center mt-8">
          <Image
            source={{
              uri: !user?.avatar
                ? 'https://via.placeholder.com/150'
                : user.avatar,
            }}
            className="size-36 rounded-full"
          />
          <Text className="text-2xl font-rubik-bold mt-2">{user?.name}</Text>
        </View>

        <View className="flex flex-col mt-5 border-t pt-5 border-primary-200">
          {user?.userType === 'agent' ? (
            <SettingsItem 
              icon={icons.dashboard} 
              title="Dashboard Agen" 
              onPress={() => router.push('/(root)/(agent)/dashboard')}
            />
          ) : (
            <SettingsItem 
              icon={icons.dashboard} 
              title="Daftar Sebagai Agen" 
              onPress={() => router.push('/(root)/(agen-auth)/register')}
            />
          )}

          {settings.slice(1).map((item, index) => (
            <SettingsItem
              key={index}
              icon={item.icon}
              title={item.title}
              onPress={() => {
                if (item.route) {
                  router.push(item.route as any); // or as unknown as RouteType if you know the type
                }
              }}
            />
          ))}
        </View>

        <View className="flex flex-col border-t mt-5 pt-5 border-primary-200">
          <SettingsItem
            icon={icons.logout}
            title="Logout"
            textStyle="text-danger"
            showArrow={false}
            onPress={handleLogout}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default Profile;