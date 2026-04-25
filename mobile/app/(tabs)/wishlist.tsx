import { StyleSheet, Text, View } from 'react-native';

import { strings } from '@/constants/strings';
import { useAppStore } from '@/store/useAppStore';

export default function WishlistScreen() {
  const wishlistCount = useAppStore((state) => state.wishlist.length);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{strings.bn.wishlist.title}</Text>
      <Text style={styles.subtitle}>{strings.bn.wishlist.empty}</Text>
      <Text style={styles.count}>{wishlistCount}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    backgroundColor: '#fffaf4',
    flex: 1,
    justifyContent: 'center',
    padding: 24,
  },
  title: {
    color: '#2f2118',
    fontSize: 24,
    fontWeight: 'bold',
  },
  subtitle: {
    color: '#6f625b',
    fontSize: 16,
    marginTop: 8,
    textAlign: 'center',
  },
  count: {
    color: '#8a5a35',
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
  },
});
