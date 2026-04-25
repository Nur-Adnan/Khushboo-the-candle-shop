import React from 'react';
import { View } from 'react-native';

import { ExternalLink } from './ExternalLink';
import { MonoText } from './StyledText';
import { Text } from '@/components/ui/text';

export default function EditScreenInfo({ path }: { path: string }) {
  return (
    <View>
      <View className="mx-12 items-center">
        <Text className="text-center text-lg leading-6 text-foreground/80">
          Open up the code for this screen:
        </Text>

        <View className="my-2 rounded-sm bg-muted px-1">
          <MonoText>{path}</MonoText>
        </View>

        <Text className="text-center text-lg leading-6 text-foreground/80">
          Change any of the text, save the file, and your app will automatically update.
        </Text>
      </View>

      <View className="mx-5 mt-4 items-center">
        <ExternalLink
          className="py-4"
          href="https://docs.expo.io/get-started/create-a-new-app/#opening-the-app-on-your-phonetablet">
          <Text className="text-center text-primary">
            Tap here if your app doesn't automatically update after making changes
          </Text>
        </ExternalLink>
      </View>
    </View>
  );
}
