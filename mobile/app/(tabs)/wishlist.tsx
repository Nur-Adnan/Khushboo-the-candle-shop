import { View } from 'react-native';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Text } from '@/components/ui/text';
import { strings } from '@/constants/strings';
import { useAppStore } from '@/store/useAppStore';

export default function WishlistScreen() {
  const wishlistCount = useAppStore((state) => state.wishlist.length);

  return (
    <View className="flex-1 items-center justify-center bg-background p-6">
      <Card className="w-full max-w-md border-border bg-card">
        <CardHeader>
          <CardTitle className="text-center text-2xl text-card-foreground">
            {strings.bn.wishlist.title}
          </CardTitle>
        </CardHeader>
        <CardContent className="items-center gap-3">
          <Text className="text-center text-muted-foreground">{strings.bn.wishlist.empty}</Text>
          <Text className="text-lg font-semibold text-primary">{wishlistCount}</Text>
        </CardContent>
        <CardFooter>
          <Button className="w-full" disabled>
            <Text>{strings.bn.common.loading}</Text>
          </Button>
        </CardFooter>
      </Card>
    </View>
  );
}
