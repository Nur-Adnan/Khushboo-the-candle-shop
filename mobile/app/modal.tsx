import { StatusBar } from 'expo-status-bar';
import { Platform, View } from 'react-native';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Text } from '@/components/ui/text';

export default function ModalScreen() {
  return (
    <View className="flex-1 items-center justify-center bg-background p-6">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-center">Modal</CardTitle>
        </CardHeader>
        <CardContent>
          <Text className="text-center text-muted-foreground">KHUSBOOO</Text>
        </CardContent>
      </Card>
      {/* Use a light status bar on iOS to account for the black space above the modal */}
      <StatusBar style={Platform.OS === 'ios' ? 'light' : 'auto'} />
    </View>
  );
}
