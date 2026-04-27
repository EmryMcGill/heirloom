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
import { Ionicons } from "@expo/vector-icons";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
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
  const { session } = useAuth();
  const userId = session?.user?.id;
  const queryClient = useQueryClient();

  const [search, setSearch] = useState("");
  const [sentRequests, setSentRequests] = useState<string[]>([]);

  // 🔹 Friends
  const { data: friends = [] } = useQuery({
    queryKey: ["friends"],
    queryFn: () => getFriends(userId!),
    enabled: !!userId,
  });

  // 🔹 Requests
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

  // 🔹 Search
  const { data: results = [] } = useQuery({
    queryKey: ["searchUsers", search],
    queryFn: () => searchUsers(search),
    enabled: search.length > 1,
  });

  // 🔹 Accept
  const acceptMutation = useMutation({
    mutationFn: acceptFriendRequest,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["friends"] });
      queryClient.invalidateQueries({ queryKey: ["friendRequests"] });
    },
  });

  // 🔹 Decline
  const declineMutation = useMutation({
    mutationFn: declineFriendRequest,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["friendRequests"] });
    },
  });

  // 🔹 Send request
  const sendMutation = useMutation({
    mutationFn: (receiverId: string) => sendFriendRequest(userId!, receiverId),
    onSuccess: (_, receiverId) => {
      setSentRequests((prev) => [...prev, receiverId]);
    },
  });

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Friends</Text>
      </View>

      {/* Search */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={18} color="#666" />
        <TextInput
          placeholder="Search users"
          value={search}
          onChangeText={setSearch}
          style={styles.searchInput}
        />
      </View>

      <FlatList
        data={[]}
        ListHeaderComponent={
          <>
            {/* 🔍 Search Results */}
            {search.length > 1 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Search</Text>

                {results.map((user: Profile) => {
                  if (user.id === userId) return null;

                  const isRequested =
                    sentRequests.includes(user.id) ||
                    outgoing.some((r) => r.receiver_id === user.id);

                  return (
                    <View key={user.id} style={styles.row}>
                      <Text style={styles.name}>{user.full_name}</Text>

                      {isRequested ? (
                        <Text style={styles.requestedText}>Requested ✓</Text>
                      ) : (
                        <TouchableOpacity
                          onPress={() => sendMutation.mutate(user.id)}
                        >
                          <Text style={styles.addText}>Add</Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  );
                })}
              </View>
            )}

            {/* 📩 Requests */}
            {requests.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Requests</Text>

                {requests.map((req: any) => (
                  <View key={req.id} style={styles.row}>
                    <Text style={styles.name}>
                      {req?.requester?.full_name ?? "Unknown"}
                    </Text>

                    <View style={styles.actions}>
                      <TouchableOpacity
                        style={styles.acceptBtn}
                        onPress={() => acceptMutation.mutate(req.id)}
                      >
                        <Text style={styles.acceptText}>Accept</Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={styles.declineBtn}
                        onPress={() => declineMutation.mutate(req.id)}
                      >
                        <Text style={styles.declineText}>Decline</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                ))}
              </View>
            )}

            {/* 👥 Friends */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Your Friends</Text>

              {friends.length === 0 ? (
                <Text style={styles.emptyText}>
                  No friends yet. Start by adding some 👇
                </Text>
              ) : (
                friends.map((user: Profile) => (
                  <View key={user.id} style={styles.row}>
                    <Text style={styles.name}>{user.full_name}</Text>
                    <Ionicons
                      name="ellipsis-horizontal"
                      size={20}
                      color="#666"
                    />
                  </View>
                ))
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
    backgroundColor: "#fff",
    paddingHorizontal: 16,
  },
  header: {
    paddingBottom: 10,
  },
  title: {
    fontSize: 22,
    fontWeight: "600",
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f2f2f2",
    borderRadius: 10,
    paddingHorizontal: 10,
    height: 40,
    marginBottom: 16,
    gap: 6,
  },
  searchInput: {
    flex: 1,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 10,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 10,
    borderBottomWidth: 0.5,
    borderColor: "#ddd",
  },
  name: {
    fontSize: 15,
  },
  actions: {
    flexDirection: "row",
    gap: 8,
  },
  acceptBtn: {
    backgroundColor: "#4CAF50",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
  },
  acceptText: {
    color: "#fff",
    fontSize: 13,
  },
  declineBtn: {
    backgroundColor: "#eee",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
  },
  declineText: {
    fontSize: 13,
    color: "#333",
  },
  addText: {
    color: "#007AFF",
    fontWeight: "500",
  },
  requestedText: {
    color: "#888",
    fontWeight: "500",
  },
  emptyText: {
    color: "#888",
    fontSize: 14,
  },
});
