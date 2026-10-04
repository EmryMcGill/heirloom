import { theme } from "@/constants/theme";
import { useRouter } from "expo-router";
import { Plus } from "lucide-react-native";
import { ActionSheetIOS, StyleSheet, TouchableOpacity } from "react-native";

interface FABProps {
  onPress?: () => void;
}

export function FAB({ onPress }: FABProps) {
  const router = useRouter();

  const handlePress = () => {
    ActionSheetIOS.showActionSheetWithOptions(
      {
        options: [
          "Cancel",
          "Create Cookbook",
          "Create Recipe",
          "Import from URL",
        ],
        cancelButtonIndex: 0,
        title: "Create New",
      },
      (buttonIndex) => {
        if (buttonIndex === 1) router.push("/book/new");
        if (buttonIndex === 2) router.push("/recipe/new");
        if (buttonIndex === 3) router.push("/importRecipe");
      },
    );
  };

  return (
    <TouchableOpacity
      style={styles.fab}
      activeOpacity={0.85}
      onPress={handlePress}
    >
      <Plus size={26} color="#FFFFFF" strokeWidth={2.5} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  fab: {
    position: "absolute",
    bottom: 96,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: theme.colors.black || "#000000",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 6,
  },
});
