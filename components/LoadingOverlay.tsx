import { Image } from "expo-image";
import React, { useEffect, useState } from "react";
import { StyleSheet, View } from "react-native";

interface Props {
  visible: boolean;
  mode: string;
}

// Add your image paths here
const LOADING_IMAGES = [
  require("@/assets/images/loading1.svg"),
  require("@/assets/images/loading2.svg"),
  require("@/assets/images/loading3.svg"),
];

const LoadingOverlay = ({ visible, mode }: Props) => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  useEffect(() => {
    if (!visible) return;

    const interval = setInterval(() => {
      setCurrentImageIndex(
        (prevIndex) => (prevIndex + 1) % LOADING_IMAGES.length,
      );
    }, 250); // Change image every 0.5 seconds

    return () => clearInterval(interval);
  }, [visible]);

  if (!visible) return null;

  return (
    <View style={mode === "modal" ? styles.overlay : styles.full}>
      <View style={styles.imageContainer}>
        <Image
          source={LOADING_IMAGES[currentImageIndex]}
          style={styles.image}
          resizeMode="contain"
        />
      </View>
    </View>
  );
};

export default LoadingOverlay;

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1000,
  },
  full: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgb(255, 255, 255)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1000,
  },
  imageContainer: {
    padding: 30,
    backgroundColor: "white",
    borderRadius: 16,
  },
  image: {
    width: 100,
    height: 100,
  },
});
