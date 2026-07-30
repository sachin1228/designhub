import { StyleSheet, View } from "react-native";
import { StatusBar } from "expo-status-bar";

/**
 * Phase 1 home — blank placeholder.
 * Authentication is confirmed when the user lands here.
 */
export default function HomeScreen() {
  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#ffffff",
  },
});
