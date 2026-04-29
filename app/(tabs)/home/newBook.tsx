import { theme } from "@/constants/theme";
import { saveBook } from "@/services/books";
import { useQueryClient } from "@tanstack/react-query";
import * as ImagePicker from "expo-image-picker";
import { router } from "expo-router";
import {
  Circle,
  CircleCheck,
  Globe,
  Lock,
  Plus,
  Users,
} from "lucide-react-native";
import React, { useState } from "react";

import {
  ActivityIndicator,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function NewBook() {
  const insets = useSafeAreaInsets();

  const [title, setTitle] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [coverImageUri, setCoverImageUri] =
    React.useState<ImagePicker.ImagePickerResult | null>(null);
  const [shareMode, setShareMode] = useState(0);

  const [loading, setLoading] = React.useState(false);

  const queryClient = useQueryClient();

  const openPhotoSelector = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      alert("Permission required to access your photo library.");
      return;
    }

    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: false,
      aspect: [4, 3],
      quality: 0.7,
      base64: true,
    });

    if (!result.canceled && result.assets.length > 0) {
      setCoverImageUri(result);
    }
  };

  const createBook = async () => {
    if (!title.trim()) {
      alert("Please enter a title");
      return;
    }

    setLoading(true);

    const book = {
      title: title.trim(),
      subTitle: description.trim(),
    };

    const res = await saveBook(book);

    queryClient.invalidateQueries({ queryKey: ["books"] });

    setLoading(false);

    if (res) {
      router.back();
    }
  };

  return (
    <>
      <ScrollView
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        automaticallyAdjustKeyboardInsets={true}
      >
        <Text style={styles.title}>Create Cookbook</Text>

        {/* cover photo */}
        <Text style={styles.label}>Cover Photo</Text>
        <TouchableOpacity style={styles.coverPhoto} onPress={openPhotoSelector}>
          {coverImageUri ? (
            <Image
              source={{ uri: coverImageUri.assets[0].uri }}
              style={styles.coverPhotoImage}
            />
          ) : (
            <Plus size={32} color={theme.colors.text.secondary} />
          )}
        </TouchableOpacity>

        {/* Title */}
        <Text style={styles.label}>Title *</Text>
        <TextInput
          style={styles.input}
          value={title}
          onChangeText={setTitle}
          placeholder="Family Recipes"
          placeholderTextColor={theme.colors.text.secondary}
        />

        {/* Description */}
        <Text style={styles.label}>Description</Text>
        <TextInput
          multiline
          style={[styles.input, { height: 100 }]}
          value={description}
          onChangeText={setDescription}
          placeholder="Write a short description..."
          placeholderTextColor={theme.colors.text.secondary}
        />

        {/* sharing */}
        <Text style={styles.label}>Who is this cookbook for</Text>
        <View style={{ gap: 8, marginBottom: 18 }}>
          <TouchableOpacity
            onPress={() => setShareMode(0)}
            style={[
              styles.sharingCard,
              shareMode === 0 ? { borderColor: "grey" } : {},
            ]}
          >
            <View style={styles.sharingCardInner}>
              <Lock size={22} />
              <Text style={styles.sharingText}>Myself</Text>
            </View>
            {shareMode === 0 ? <CircleCheck size={18} /> : <Circle size={18} />}
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setShareMode(1)}
            style={[
              styles.sharingCard,
              shareMode === 1 ? { borderColor: "grey" } : {},
            ]}
          >
            <View style={styles.sharingCardInner}>
              <Globe size={22} />
              <Text style={styles.sharingText}>All Friends</Text>
            </View>
            {shareMode === 1 ? <CircleCheck size={18} /> : <Circle size={18} />}
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setShareMode(2)}
            style={[
              styles.sharingCard,
              shareMode === 2 ? { borderColor: "grey" } : {},
            ]}
          >
            <View style={styles.sharingCardInner}>
              <Users size={22} />
              <Text style={styles.sharingText}>Individual Friends</Text>
            </View>
            {shareMode === 2 ? <CircleCheck size={18} /> : <Circle size={18} />}
          </TouchableOpacity>
        </View>

        {/* pick friends to share with */}
        <Text style={styles.label}>Select People to Share</Text>
      </ScrollView>

      {/* Create Button */}
      <View style={[styles.footer, { paddingBottom: insets.bottom }]}>
        <TouchableOpacity style={styles.button} onPress={createBook}>
          {loading ? (
            <ActivityIndicator />
          ) : (
            <Text style={styles.buttonText}>Create Cookbook</Text>
          )}
        </TouchableOpacity>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: "white",
    paddingBottom: 120,
  },
  title: {
    ...theme.title,
    fontSize: theme.typography.sizes.xl,
    marginBottom: 20,
  },
  label: {
    fontWeight: theme.typography.fontWeights.semibold,
    marginBottom: 6,
  },
  input: {
    backgroundColor: theme.colors.grey,
    padding: 10,
    borderRadius: theme.borderRadius.md,
    marginBottom: 20,
  },
  footer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "white",
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: theme.colors.grey,
  },
  button: {
    backgroundColor: theme.colors.grey,
    paddingVertical: 16,
    borderRadius: theme.borderRadius.lg,
    alignItems: "center",
  },
  buttonText: {
    color: theme.colors.black,
    fontWeight: theme.typography.fontWeights.semibold,
  },
  coverPhoto: {
    borderStyle: "dashed",
    borderWidth: 2,
    borderColor: theme.colors.text.secondary,
    backgroundColor: theme.colors.grey,
    height: 200,
    borderRadius: theme.borderRadius.lg,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 24,
    overflow: "hidden",
  },
  coverPhotoImage: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  sharingCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderWidth: 1,
    borderColor: theme.colors.grey,
    padding: 12,
    borderRadius: theme.borderRadius.lg,
  },
  sharingCardInner: {
    flex: 1,
    flexDirection: "row",
    gap: 8,
    alignItems: "center",
  },
  sharingText: {
    fontWeight: theme.typography.fontWeights.medium,
  },
});
