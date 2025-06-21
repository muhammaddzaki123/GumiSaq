import { Stack, useRouter } from 'expo-router';
import React from 'react';
import { ScrollView, View } from 'react-native';
import { RegisterAgentForm } from '@/constants/agent/RegisterAgentForm';

export default function RegisterAgent() {
  const router = useRouter();

  const handleSuccess = () => {
    router.push('./agent/dashboard');
  };

  return (
    <View className="flex-1 bg-gray-50">
      <Stack.Screen
        options={{
          headerTitle: 'Daftar Sebagai Agen',
          headerTitleStyle: {
            fontFamily: 'Rubik-Medium',
          },
        }}
      />
      
      <ScrollView className="flex-1 p-4">
        <RegisterAgentForm onSuccess={handleSuccess} />
      </ScrollView>
    </View>
  );
}
