import { settings } from '@/constants/data';
import icons from '@/constants/icons';
import { logout } from '@/lib/appwrite';
import { useGlobalContext } from '@/lib/global-provider';
import { router } from "expo-router";
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

// Komponen SettingsItem tetap diperlukan
interface SettingsItemProp {
  icon: ImageSourcePropType;
  title: string;
  onPress?: () => void;
  textStyle?: string;
  showArrow?: boolean;
}

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
                  router.push(item.route as any);
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