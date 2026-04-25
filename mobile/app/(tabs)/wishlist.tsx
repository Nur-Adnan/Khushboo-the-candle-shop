import { StyleSheet, Text, View } from 'react-native';

import { strings } from '@/constants/strings';

export default function WishlistScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>{strings.bn.wishlist.title}</Text>
      <Text style={styles.subtitle}>{strings.bn.wishlist.empty}</Text>
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
});
