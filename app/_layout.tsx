import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

export default function RootLayout() {
  return (
    <>
      <StatusBar style="light" />
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: '#060912' } }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="billing" />
        <Stack.Screen name="location-setup" />
        <Stack.Screen name="dashboard" />
        <Stack.Screen name="profile" />
        <Stack.Screen name="shipment/[id]" />
        <Stack.Screen name="carrier/[id]" />
      </Stack>
    </>
  );
}
