import { Stack } from 'expo-router';
import React from 'react';

const AgentLayout = () => {
  return (
    <Stack>
      <Stack.Screen name="index" options={{ headerShown: false }} />
      {/* Tambahkan screen lain untuk manajemen produk & pesanan di sini nanti */}
    </Stack>
  );
};

export default AgentLayout;