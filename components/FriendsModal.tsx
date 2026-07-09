import { theme } from "@/constants/theme";
import { useAuth } from "@/contexts/AuthContext";
import {
  acceptFriendRequest,
  declineFriendRequest,
  getFriendRequests,
  getFriends,
  getOutgoingRequests,
  searchUsers,
  sendFriendRequest,
} from "@/services/friends";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Stack, useRouter } from "expo-router"; // Imported Stack for native header config
import {
  ChevronLeft,
  MoreHorizontal,
  Search,
  UserPlus,
  Users,
} from "lucide-react-native";
import React, { useState } from "react";
import {
  FlatList,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type Profile = {
  id: string;
  full_name: string;
};

export default function FriendsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { session } = useAuth();
  const userId = session?.user?.id;
  const queryClient = useQueryClient();

  const [search, setSearch] = useState("");
  const [sentRequests, setSentRequests] = useState<string[]>([]);

  // 🔹 Friends Queries
  const { data: friends = [] } = useQuery({
    queryKey: ["friends"],
    queryFn: () => getFriends(userId!),
    enabled: !!userId,
  });

  const { data: requests = [] } = useQuery({
    queryKey: ["friendRequests"],
    queryFn: () => getFriendRequests(userId!),
    enabled: !!userId,
  });

  const { data: outgoing = [] } = useQuery({
    queryKey: ["outgoingRequests"],
    queryFn: () => getOutgoingRequests(userId!),
    enabled: !!userId,
  });

  const { data: results = [] } = useQuery({
    queryKey: ["searchUsers", search],
    queryFn: () => searchUsers(search),
    enabled: search.length > 1,
  });

  // 🔹 Mutations
  const acceptMutation = useMutation({
    mutationFn: acceptFriendRequest,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["friends"] });
      queryClient.invalidateQueries({ queryKey: ["friendRequests"] });
    },
  });

  const declineMutation = useMutation({
    mutationFn: declineFriendRequest,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["friendRequests"] });
    },
  });

  const sendMutation = useMutation({
    mutationFn: (receiverId: string) => sendFriendRequest(userId!, receiverId),
    onSuccess: (_, receiverId) => {
      setSentRequests((prev) => [...prev, receiverId]);
    },
  });

  return (
    <View style={styles.container}>
      {/* 🛠️ NATIVE HEADER CONFIGURATION (Matches NewRecipe Style) */}
      <Stack.Screen
        options={{
          headerShown: true,
          title: "Friends",
          headerTitleStyle: {
            fontFamily: theme.typography.fonts.regular,
            fontSize: 20,
            fontWeight: "600",
            color: theme.colors.black,
          },
          headerStyle: {
            backgroundColor: "#ffffff",
          },
          headerShadowVisible: true,
          headerLeft: () => (
            <TouchableOpacity
              onPress={() => router.back()}
              style={{ marginLeft: 4, padding: 4 }}
            >
              <ChevronLeft size={24} color={theme.colors.black} />
            </TouchableOpacity>
          ),
        }}
      />

      {/* Search Input Bar (Spaced cleanly below native header) */}
      <View style={styles.searchWrap}>
        <Search size={18} color="#999" style={styles.searchIcon} />
        <TextInput
          placeholder="Search for users..."
          placeholderTextColor="#999"
          value={search}
          onChangeText={setSearch}
          style={styles.searchInput}
        />
      </View>

      <FlatList
        data={[]}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: insets.bottom + 24 }}
        ListHeaderComponent={
          <>
            {/* 🔍 Search Results */}
            {search.length > 1 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Search results</Text>
                <View style={styles.groupCard}>
                  {results.length === 0 ? (
                    <Text style={styles.emptyText}>No users found.</Text>
                  ) : (
                    results.map((user: Profile, idx) => {
                      if (user.id === userId) return null;

                      const isRequested =
                        sentRequests.includes(user.id) ||
                        outgoing.some((r) => r.receiver_id === user.id);

                      return (
                        <View
                          key={user.id}
                          style={[
                            styles.row,
                            idx === 0 && { borderTopWidth: 0 },
                          ]}
                        >
                          <Text style={styles.name}>{user.full_name}</Text>
                          {isRequested ? (
                            <View style={styles.requestedBadge}>
                              <Text style={styles.requestedText}>Sent</Text>
                            </View>
                          ) : (
                            <TouchableOpacity
                              style={styles.addBtn}
                              onPress={() => sendMutation.mutate(user.id)}
                            >
                              <UserPlus size={16} color={theme.colors.black} />
                              <Text style={styles.addText}>Add</Text>
                            </TouchableOpacity>
                          )}
                        </View>
                      );
                    })
                  )}
                </View>
              </View>
            )}

            {/* 📩 Incoming Friend Requests */}
            {requests.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Incoming Requests</Text>
                <View style={styles.groupCard}>
                  {requests.map((req: any, idx) => (
                    <View
                      key={req.id}
                      style={[styles.row, idx === 0 && { borderTopWidth: 0 }]}
                    >
                      <Text style={styles.name}>
                        {req?.requester?.full_name ?? "Unknown user"}
                      </Text>
                      {/* 🛠️ Redesigned text-based buttons */}
                      <View style={styles.actions}>
                        <TouchableOpacity
                          style={styles.declineTextButton}
                          onPress={() => declineMutation.mutate(req.id)}
                        >
                          <Text style={styles.declineButtonText}>Ignore</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={styles.acceptTextButton}
                          onPress={() => acceptMutation.mutate(req.id)}
                        >
                          <Text style={styles.acceptButtonText}>Accept</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  ))}
                </View>
              </View>
            )}

            {/* 👥 Your Friends List */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Your friends</Text>
              {friends.length === 0 ? (
                <View style={styles.emptyContainer}>
                  <View style={styles.emptyCircle}>
                    <Users size={32} color={theme.colors.black} />
                  </View>
                  <Text style={styles.emptyMainText}>No friends yet</Text>
                  <Text style={styles.emptySubText}>
                    Search for users above to build your network!
                  </Text>
                </View>
              ) : (
                <View style={styles.groupCard}>
                  {friends.map((user: Profile, idx) => (
                    <View
                      key={user.id}
                      style={[styles.row, idx === 0 && { borderTopWidth: 0 }]}
                    >
                      <Text style={styles.name}>{user.full_name}</Text>
                      <TouchableOpacity style={styles.moreButton}>
                        <MoreHorizontal size={18} color="#8E8E93" />
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>
              )}
            </View>
          </>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 16,
  },
  searchWrap: {
    position: "relative",
    justifyContent: "center",
    marginBottom: 20,
    marginTop: 16,
  },
  searchIcon: {
    position: "absolute",
    left: 12,
    zIndex: 2,
  },
  searchInput: {
    padding: 10,
    paddingLeft: 38,
    borderRadius: theme.borderRadius.md || 8,
    fontSize: 16,
    color: "#111",
    borderWidth: 1,
    borderColor: "#c1c1c1",
    backgroundColor: "#FFFFFF",
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: "600",
    color: "#666",
    letterSpacing: 0.5,
    marginBottom: 8,
    marginLeft: 4,
  },
  groupCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#E5E5EA",
    overflow: "hidden",
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderTopWidth: 1,
    borderColor: "#E5E5EA",
  },
  name: {
    fontSize: 16,
    fontWeight: "500",
    color: theme.colors.black,
  },
  actions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  /* 🔹 New Action Buttons Styles */
  acceptTextButton: {
    backgroundColor: theme.colors.black,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 8,
  },
  acceptButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  declineTextButton: {
    paddingHorizontal: 6,
    paddingVertical: 6,
  },
  declineButtonText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#666666",
  },
  addBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: theme.colors.grey || "#F2F2F7",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
  },
  addText: {
    fontSize: 13,
    fontWeight: "600",
    color: theme.colors.black,
  },
  requestedBadge: {
    backgroundColor: "#E5E5EA",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
  },
  requestedText: {
    color: "#8E8E93",
    fontSize: 13,
    fontWeight: "500",
  },
  moreButton: {
    padding: 4,
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 36,
    gap: 8,
  },
  emptyCircle: {
    backgroundColor: theme.colors.grey || "#E5E5EA",
    padding: 16,
    borderRadius: 999,
    marginBottom: 4,
  },
  emptyMainText: {
    fontFamily: theme.typography.fonts.regular,
    fontSize: 18,
    fontWeight: "600",
    color: theme.colors.black,
  },
  emptySubText: {
    color: "grey",
    fontSize: 14,
    textAlign: "center",
    paddingHorizontal: 32,
  },
  emptyText: {
    color: "#8E8E93",
    fontSize: 14,
    textAlign: "center",
    paddingVertical: 16,
  },
});
