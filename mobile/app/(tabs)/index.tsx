import { StyleSheet, Text, View } from 'react-native';

import { strings } from '@/constants/strings';

export default function HomeScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>{strings.bn.home.title}</Text>
      <Text style={styles.subtitle}>{strings.bn.home.subtitle}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2f2118',
  },
  subtitle: {
    marginTop: 8,
    color: '#6f625b',
    fontSize: 16,
    textAlign: 'center',
  },
});
