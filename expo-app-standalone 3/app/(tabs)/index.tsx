import { StyleSheet, Text, View } from 'react-native';
import { useColors } from '@/hooks/useColors';

export default function HomeScreen() {
  const colors = useColors();

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Text style={[styles.title, { color: colors.foreground }]}>
        Welcome 👋
      </Text>
      <Text style={[styles.text, { color: colors.mutedForeground }]}>
        Your app is running. Edit app/(tabs)/index.tsx to get started.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    padding: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
  },
  text: {
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
  },
});
