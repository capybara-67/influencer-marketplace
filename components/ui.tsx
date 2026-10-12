import { PropsWithChildren } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";

export function Card({ children }: PropsWithChildren) {
  return <View style={styles.card}>{children}</View>;
}

export function AppButton({
  label,
  onPress,
  variant = "primary",
  disabled = false
}: {
  label: string;
  onPress: () => void;
  variant?: "primary" | "secondary" | "danger";
  disabled?: boolean;
}) {
  return (
    <Pressable
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        variant === "secondary" && styles.buttonSecondary,
        variant === "danger" && styles.buttonDanger,
        (pressed || disabled) && styles.buttonPressed
      ]}
    >
      <Text style={[styles.buttonText, variant !== "primary" && styles.buttonTextAlt]}>{label}</Text>
    </Pressable>
  );
}

export function AppInput({
  label,
  value,
  onChangeText,
  placeholder,
  secureTextEntry = false,
  multiline = false
}: {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  placeholder?: string;
  secureTextEntry?: boolean;
  multiline?: boolean;
}) {
  return (
    <View style={styles.inputWrap}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#8B8175"
        secureTextEntry={secureTextEntry}
        multiline={multiline}
        style={[styles.input, multiline && styles.textarea]}
      />
    </View>
  );
}

export function SectionTitle({ children }: PropsWithChildren) {
  return <Text style={styles.sectionTitle}>{children}</Text>;
}

export function MutedText({ children }: PropsWithChildren) {
  return <Text style={styles.muted}>{children}</Text>;
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    gap: 10,
    borderWidth: 1,
    borderColor: "#E8E0D8"
  },
  button: {
    backgroundColor: "#1F5EFF",
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center"
  },
  buttonSecondary: {
    backgroundColor: "#E8F0FF"
  },
  buttonDanger: {
    backgroundColor: "#FFE5E2"
  },
  buttonPressed: {
    opacity: 0.75
  },
  buttonText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "700"
  },
  buttonTextAlt: {
    color: "#1E2430"
  },
  inputWrap: {
    gap: 6
  },
  label: {
    fontSize: 13,
    fontWeight: "600",
    color: "#332B22"
  },
  input: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: "#D9D0C7",
    color: "#1E2430"
  },
  textarea: {
    minHeight: 110,
    textAlignVertical: "top"
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: "#1E2430"
  },
  muted: {
    fontSize: 14,
    color: "#6C6258"
  }
});
