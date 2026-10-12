import { ActivityIndicator, StyleSheet, Text, View } from "react-native";

export function LoadingState({ message = "Loading..." }: { message?: string }) {
  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color="#1F5EFF" />
      <Text style={styles.message}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    padding: 24,
    backgroundColor: "#F7F5F2"
  },
  message: {
    color: "#6C6258",
    fontSize: 14
  }
});
