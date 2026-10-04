import { theme } from "@/constants/theme";
import { useAuth } from "@/contexts/AuthContext";
import { createBook, fetchBookById, updateBook } from "@/services/books";
import { uploadRecipeImage } from "@/services/recipes";
import { CreateBookInput } from "@/types/book";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { BlurView } from "expo-blur";
import { Image } from "expo-image";
import * as ImagePicker from "expo-image-picker";
import {
  router,
  Stack,
  useFocusEffect,
  useLocalSearchParams,
} from "expo-router";
import {
  ChevronLeft,
  Image as ImageIcon,
  Lock,
  Users,
} from "lucide-react-native";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import {
  KeyboardAwareScrollView,
  useKeyboardHandler,
} from "react-native-keyboard-controller";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

// Local book member format
type BookMember = {
  id: string;
  full_name: string | null;
  username: string | null;
  avatar_url: string | null;
  role: string;
};

export default function NewBookScreen() {
  const { session, profile } = useAuth();
  const userId = session?.user?.id;
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const [isPrivate, setIsPrivate] = useState(true);
  const [members, setMembers] = useState<BookMember[]>([]);

  // Fetch parameters
  const { newMember, id, role } = useLocalSearchParams<{
    newMember?: string;
    id?: string;
    role: string;
  }>();

  // Input Focus Refs
  const titleRef = useRef<TextInput>(null);
  const descriptionRef = useRef<TextInput>(null);

  // Scroll & layout position tracking
  const scrollRef = useRef<ScrollView>(null);
  const fieldY = useRef<Record<string, number>>({});

  // Native header height (status bar inset + 44) plus gap
  const scrollTargetOffset = insets.top + 44 + 12;

  // Track keyboard height smoothly during interactive gestures/drags
  const keyboardHeight = useSharedValue(0);

  useKeyboardHandler({
    onMove: (e) => {
      "worklet";
      keyboardHeight.value = e.height;
    },
    onEnd: (e) => {
      "worklet";
      keyboardHeight.value = e.height;
    },
  });

  // Dynamically pad the scroll content frame-by-frame as the keyboard moves
  const animatedPaddingStyle = useAnimatedStyle(() => ({
    paddingBottom: 140 + keyboardHeight.value,
  }));

  const scrollFieldToTop = (key: "title" | "description") => {
    setTimeout(() => {
      const y = fieldY.current[key];
      if (y === undefined) return;
      scrollRef.current?.scrollTo({
        y: Math.max(0, y - scrollTargetOffset),
        animated: true,
      });
    }, 50);
  };

  const isEditing = Boolean(id);

  // Query existing book data if `id` exists
  const { data: book, isLoading: isFetchingBook } = useQuery({
    queryKey: ["book", id],
    queryFn: () => fetchBookById(id!),
    enabled: isEditing,
  });

  // Form state
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [coverImageUri, setCoverImageUri] =
    useState<ImagePicker.ImagePickerResult | null>(null);
  const [existingImageUrl, setExistingImageUrl] = useState<string | null>(null);

  // Hydrate form state once book data is fetched
  useEffect(() => {
    if (!book) return;

    setTitle(book.title ?? "");
    setDescription(book.description ?? "");
    setExistingImageUrl(book.cover_image_url ?? null);

    const loadedMembers =
      book.book_members
        ?.filter((member) => member.user_id !== userId)
        .map((member) => ({
          id: member.user_id,
          full_name: member.profiles.full_name,
          username: member.profiles.username,
          avatar_url: member.profiles.avatar_url,
          role: member.role,
        })) ?? [];

    if (loadedMembers.length > 0) {
      setIsPrivate(false);
    }

    setMembers(loadedMembers);
  }, [book, userId]);

  // Image Picker Logic
  const openPhotoSelector = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert(
        "Permission Required",
        "Permission required to access your photo library.",
      );
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });

    if (!result.canceled && result.assets.length > 0) {
      setCoverImageUri(result);
    }
  };

  // TanStack Query Mutation
  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!userId) throw new Error("You must be logged in to save a book.");

      let finalImageUrl = existingImageUrl || "";
      if (coverImageUri) {
        finalImageUrl = await uploadRecipeImage(coverImageUri);
      }

      const payload: CreateBookInput = {
        title: title.trim(),
        description: description.trim() || null,
        cover_image_url: finalImageUrl || null,
      };

      if (id) {
        return updateBook(id, payload);
      }

      return createBook(
        payload,
        userId,
        members.map((member) => ({
          userId: member.id,
          role: member.role,
        })),
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["books"] });

      if (id) {
        queryClient.invalidateQueries({ queryKey: ["book", id] });
      }

      router.back();
    },
    onError: (error: Error) => {
      Alert.alert("Error Saving Book", error.message);
    },
  });

  // Handle incoming member additions from modal route
  useFocusEffect(
    useCallback(() => {
      if (newMember) {
        try {
          const parsedMember: BookMember = JSON.parse(newMember);

          setMembers((prev) => {
            if (prev.some((m) => m.id === parsedMember.id)) return prev;
            return [...prev, { ...parsedMember, role }];
          });

          router.setParams({ newMember: undefined, role: undefined });
        } catch (e) {
          console.error("Failed to parse returned member JSON data", e);
        }
      }
    }, [newMember]),
  );

  const handleSubmit = () => {
    if (!title.trim()) {
      Alert.alert("Validation Error", "Please enter a book title.");
      return;
    }

    saveMutation.mutate();
  };

  const handleAddPeople = () => {
    router.push("/add-book-member-modal");
  };

  if (isEditing && isFetchingBook) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator
          size="large"
          color={theme.colors.black || "#111111"}
        />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          headerShown: true,
          title: isEditing ? "Edit Book" : "Create Book",
          headerTitleStyle: {
            fontSize: 18,
            fontWeight: "700",
            color: theme.colors.black || "#111111",
          },
          headerTransparent: true,
          headerStyle: {
            backgroundColor: "transparent",
          },
          headerBackground: () => (
            <BlurView intensity={20} style={StyleSheet.absoluteFill} />
          ),
          headerShadowVisible: false,
          headerLeft: () => (
            <TouchableOpacity
              onPress={() => router.back()}
              style={styles.backButton}
              activeOpacity={0.7}
            >
              <ChevronLeft size={24} color={theme.colors.black || "#111111"} />
            </TouchableOpacity>
          ),
        }}
      />

      <KeyboardAwareScrollView
        ref={scrollRef}
        keyboardDismissMode="on-drag"
        style={{ flex: 1 }}
        contentContainerStyle={styles.scrollBody}
        keyboardShouldPersistTaps="handled"
        bottomOffset={120}
      >
        <Animated.View style={animatedPaddingStyle}>
          {/* Cover Photo Selection */}
          <Text style={styles.fieldLabel}>COVER PHOTO</Text>
          <TouchableOpacity
            style={styles.coverBox}
            onPress={openPhotoSelector}
            activeOpacity={0.85}
          >
            {coverImageUri?.assets?.[0]?.uri ? (
              <Image
                source={{ uri: coverImageUri.assets[0].uri }}
                style={styles.coverImage}
              />
            ) : existingImageUrl ? (
              <Image
                source={{ uri: existingImageUrl }}
                style={styles.coverImage}
              />
            ) : (
              <View style={styles.placeholderContainer}>
                <ImageIcon size={30} color="#8E8E93" />
                <Text style={styles.placeholderText}>
                  Tap to add cover photo
                </Text>
              </View>
            )}
          </TouchableOpacity>

          {/* Book Title */}
          <View
            style={styles.inputGroup}
            onLayout={(e) => (fieldY.current.title = e.nativeEvent.layout.y)}
          >
            <Text style={styles.fieldLabel}>BOOK TITLE *</Text>
            <TextInput
              ref={titleRef}
              style={styles.boxInput}
              value={title}
              onChangeText={setTitle}
              onFocus={() => scrollFieldToTop("title")}
              placeholder="e.g., Summer Barbecue Favorites"
              placeholderTextColor="#8E8E93"
              returnKeyType="next"
              onSubmitEditing={() => descriptionRef.current?.focus()}
              blurOnSubmit={false}
            />
          </View>

          {/* Description */}
          <View
            style={styles.inputGroup}
            onLayout={(e) =>
              (fieldY.current.description = e.nativeEvent.layout.y)
            }
          >
            <Text style={styles.fieldLabel}>DESCRIPTION</Text>
            <TextInput
              ref={descriptionRef}
              multiline={true}
              style={[styles.boxInput, styles.textAreaInput]}
              value={description}
              onChangeText={setDescription}
              onFocus={() => scrollFieldToTop("description")}
              placeholder="A collection of recipes for outdoor grilling and backyard parties"
              placeholderTextColor="#8E8E93"
            />
          </View>

          {/* Sharing */}
          <View style={[styles.inputGroup, { marginBottom: 0 }]}>
            <Text style={styles.fieldLabel}>SHARING</Text>

            <View style={styles.sharingSelector}>
              <TouchableOpacity
                style={[
                  styles.sharingCard,
                  isPrivate && styles.sharingCardSelected,
                ]}
                onPress={() => setIsPrivate(true)}
              >
                <Lock size={18} color={isPrivate ? "#000" : "#777"} />
                <Text
                  style={[
                    styles.sharingText,
                    isPrivate && styles.sharingTextSelected,
                  ]}
                >
                  Private
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.sharingCard,
                  !isPrivate && styles.sharingCardSelected,
                ]}
                onPress={() => setIsPrivate(false)}
              >
                <Users size={18} color={!isPrivate ? "#000" : "#777"} />
                <Text
                  style={[
                    styles.sharingText,
                    !isPrivate && styles.sharingTextSelected,
                  ]}
                >
                  Shared
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {!isPrivate && (
            <View style={styles.accessSection}>
              <View style={styles.accessHeader}>
                <Text style={styles.fieldLabel}>PEOPLE WITH ACCESS</Text>
              </View>

              <View style={styles.membersCard}>
                <View style={styles.memberRow}>
                  {profile?.avatar_url ? (
                    <Image
                      source={{ uri: profile.avatar_url }}
                      style={styles.memberAvatar}
                    />
                  ) : (
                    <View style={styles.memberAvatarPlaceholder}>
                      <Text style={styles.memberAvatarText}>
                        {profile?.full_name?.charAt(0).toUpperCase() ?? "?"}
                      </Text>
                    </View>
                  )}

                  <View style={styles.memberInfo}>
                    <Text style={styles.memberName}>{profile?.full_name}</Text>
                    <Text style={styles.memberUsername}>You</Text>
                  </View>

                  <View style={styles.roleBadge}>
                    <Text style={styles.roleText}>Owner</Text>
                  </View>
                </View>

                {members.map((member) => (
                  <View key={member.id} style={styles.memberRow}>
                    {member.avatar_url ? (
                      <Image
                        source={{ uri: member.avatar_url }}
                        style={styles.memberAvatar}
                      />
                    ) : (
                      <View style={styles.memberAvatarPlaceholder}>
                        <Text style={styles.memberAvatarText}>
                          {member.full_name?.charAt(0).toUpperCase() ?? "?"}
                        </Text>
                      </View>
                    )}

                    <View style={styles.memberInfo}>
                      <Text style={styles.memberName} numberOfLines={1}>
                        {member.full_name}
                      </Text>
                    </View>

                    <View style={styles.roleBadge}>
                      <Text style={styles.roleText}>
                        {member.role === "editor" ? "Editor" : "Viewer"}
                      </Text>
                    </View>
                  </View>
                ))}

                {/* Add people */}
                <TouchableOpacity
                  style={styles.addPeopleButton}
                  onPress={handleAddPeople}
                  activeOpacity={0.7}
                >
                  <View style={styles.addPeopleIcon}>
                    <Users size={17} color="#111" />
                  </View>

                  <Text style={styles.addPeopleText}>Add people +</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </Animated.View>
      </KeyboardAwareScrollView>

      {/* Floating Action Bar Drawer */}
      <BlurView
        intensity={20}
        style={[styles.saveDrawer, { paddingBottom: insets.bottom }]}
      >
        <TouchableOpacity
          style={[styles.saveBtn, saveMutation.isPending && styles.disabledBtn]}
          onPress={handleSubmit}
          disabled={saveMutation.isPending}
          activeOpacity={0.85}
        >
          {saveMutation.isPending ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.saveBtnText}>
              {isEditing ? "Save Changes" : "Create Book"}
            </Text>
          )}
        </TouchableOpacity>
      </BlurView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.bg,
  },
  centered: {
    justifyContent: "center",
    alignItems: "center",
  },
  backButton: {
    marginLeft: 0,
    padding: 4,
  },
  scrollBody: {
    paddingHorizontal: 16,
    paddingTop: 92,
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: theme.colors.text.primary,
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  coverBox: {
    height: 180,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 18,
    overflow: "hidden",
    backgroundColor: "rgba(0, 0, 0, 0.1)",
  },
  coverImage: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  placeholderContainer: {
    alignItems: "center",
    gap: 8,
  },
  placeholderText: {
    fontSize: 13,
    fontWeight: "500",
    color: "#8E8E93",
  },
  inputGroup: {
    marginBottom: 16,
  },
  boxInput: {
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 12,
    fontSize: 15,
    color: theme.colors.text.primary,
    backgroundColor: "rgba(0, 0, 0, 0.1)",
  },
  textAreaInput: {
    minHeight: 110,
    textAlignVertical: "top",
  },
  saveDrawer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "rgba(0,0,0,0.1)",
    paddingHorizontal: 16,
    paddingTop: 12,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 8,
  },
  saveBtn: {
    backgroundColor: theme.colors.secondary,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  disabledBtn: {
    opacity: 0.6,
  },
  saveBtnText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  sharingSelector: {
    flexDirection: "row",
    gap: 8,
    marginTop: 8,
  },

  sharingCard: {
    flex: 1,
    height: 52,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,

    backgroundColor: "#F5F5F5",
    borderWidth: 1,
    borderColor: "#E5E5E5",
    borderRadius: 12,
  },

  sharingCardSelected: {
    backgroundColor: "#FFFFFF",
    borderColor: "#111111",
    borderWidth: 1.5,
  },

  sharingText: {
    fontSize: 15,
    fontWeight: "500",
    color: "#777",
  },

  sharingTextSelected: {
    color: "#111",
    fontWeight: "600",
  },
  accessSection: {
    marginTop: 18,
  },

  accessHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },

  membersCard: {
    backgroundColor: "rgba(0,0,0,0.05)",
    borderRadius: 12,
    overflow: "hidden",
  },

  memberRow: {
    minHeight: 68,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "rgba(0,0,0,0.4)",
  },

  memberAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },

  memberAvatarPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#E1E1E1",
    alignItems: "center",
    justifyContent: "center",
  },

  memberAvatarText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#666",
  },

  memberInfo: {
    flex: 1,
    marginLeft: 11,
    marginRight: 8,
  },

  memberName: {
    fontSize: 15,
    fontWeight: "600",
    color: "#111",
  },

  memberUsername: {
    marginTop: 2,
    fontSize: 12,
    color: "#8E8E93",
  },

  roleBadge: {
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 7,
    backgroundColor: "#FFFFFF",
  },

  roleText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#666",
  },

  addPeopleButton: {
    height: 52,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
  },

  addPeopleIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFFFF",
  },

  addPeopleText: {
    marginLeft: 10,
    fontSize: 14,
    fontWeight: "600",
    color: "#111",
  },
});
