import { Link, Stack } from 'expo-router';
import { View } from 'react-native';

import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';

export default function NotFoundScreen() {
  return (
    <>
      <Stack.Screen options={{ title: 'Oops!' }} />
      <View className="flex-1 items-center justify-center bg-background p-5">
        <Text variant="h3" className="text-center">
          This screen doesn't exist.
        </Text>

        <Link href="/" asChild>
          <Button variant="link" className="mt-4">
            <Text>Go to home screen!</Text>
          </Button>
        </Link>
      </View>
    </>
  );
}
