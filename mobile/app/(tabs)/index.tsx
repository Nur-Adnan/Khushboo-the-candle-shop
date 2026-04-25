import { View } from 'react-native';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Text } from '@/components/ui/text';
import { strings } from '@/constants/strings';

export default function HomeScreen() {
  return (
    <View className="flex-1 items-center justify-center bg-background p-6">
      <Card className="w-full max-w-md border-border bg-card">
        <CardHeader>
          <CardTitle className="text-center text-2xl text-card-foreground">
            {strings.bn.home.title}
          </CardTitle>
          <CardDescription className="text-center">{strings.en.appName}</CardDescription>
        </CardHeader>
        <CardContent>
          <Text className="text-center text-muted-foreground">{strings.bn.home.subtitle}</Text>
        </CardContent>
      </Card>
    </View>
  );
}
