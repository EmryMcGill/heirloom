import { theme } from "@/constants/theme";
import { useAuth } from "@/contexts/AuthContext";
import { Image } from "expo-image";
import React from "react";
import { Dimensions, StyleSheet, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const screenWidth = Dimensions.get("window").width;

interface HeaderProps {
  onProfilePress: () => void;
}

export default function Header({ onProfilePress }: HeaderProps) {
  const insets = useSafeAreaInsets();
  const { profile } = useAuth();

  return (
    <View style={[styles.container, { paddingTop: insets.top + 5 }]}>
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
        }}
      >
        <Image
          source={require("../assets/images/logo.svg")}
          style={styles.logo}
          contentFit="contain"
        />
        <TouchableOpacity style={styles.profileButton} onPress={onProfilePress}>
          {profile?.avatar_url ? (
            <Image
              source={{ uri: `${profile.avatar_url}?t=${Date.now()}` }}
              style={styles.avatar}
              contentFit="cover"
            />
          ) : (
            <View style={styles.placeholder} />
          )}
        </TouchableOpacity>
      </View>
      <Image
        source={require("../assets/images/headerBanner.svg")}
        style={styles.banner}
        contentFit="contain"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: theme.colors.darkRed,
    display: "flex",
    flexDirection: "column",
    gap: 10,
  },
  logo: {
    width: 143,
    height: 29,
    marginLeft: 12,
  },
  banner: {
    width: screenWidth,
    height: (screenWidth / 428) * 15,
  },
  profileButton: {
    height: 29,
    width: 29,
    backgroundColor: theme.colors.grey,
    borderRadius: 999,
    marginRight: 12,
  },
  avatar: {
    width: "100%",
    height: "100%",
    borderRadius: 999,
  },

  placeholder: {
    flex: 1,
    backgroundColor: "#666",
    borderRadius: 999,
  },
});
