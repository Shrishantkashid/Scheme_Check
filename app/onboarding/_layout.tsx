import { Stack } from 'expo-router';

export default function OnboardingLayout() {
  return (
    <Stack>
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="manual" options={{ headerShown: false }} />
      <Stack.Screen name="voice" options={{ headerShown: false }} />
      <Stack.Screen name="aadhar" options={{ headerShown: false }} />
    </Stack>
  );
}
