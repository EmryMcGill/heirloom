import { supabase } from "../lib/supabase";

// 🔹 Get all accepted friends for current user
export const getFriends = async (userId: string) => {
  const { data, error } = await supabase
    .from("friendships")
    .select(
      `
      *,
      requester:profiles!friendships_requester_id_fkey ( id, full_name ),
      receiver:profiles!friendships_receiver_id_fkey ( id, full_name )
    `,
    )
    .eq("status", 1)
    .or(`requester_id.eq.${userId},receiver_id.eq.${userId}`);

  if (error) throw error;

  // normalize → always return "the other user"
  const friends =
    data?.map((f) => (f.requester_id === userId ? f.receiver : f.requester)) ??
    [];

  return friends;
};

export const sendFriendRequest = async (
  requesterId: string,
  receiverId: string,
) => {
  const { data, error } = await supabase
    .from("friendships")
    .insert({
      requester_id: requesterId,
      receiver_id: receiverId,
      status: 0,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const getFriendRequests = async (userId: string) => {
  const { data, error } = await supabase
    .from("friendships")
    .select(
      `
      *,
      requester:profiles!friendships_requester_id_fkey ( id, full_name )
    `,
    )
    .eq("receiver_id", userId)
    .eq("status", 0);

  if (error) throw error;
  return data ?? [];
};

export const getOutgoingRequests = async (userId: string) => {
  const { data, error } = await supabase
    .from("friendships")
    .select("receiver_id")
    .eq("requester_id", userId)
    .eq("status", 0);

  if (error) throw error;
  return data ?? [];
};

export const acceptFriendRequest = async (id: number) => {
  const { data, error } = await supabase
    .from("friendships")
    .update({ status: 1 })
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const declineFriendRequest = async (id: string) => {
  const { error } = await supabase.from("friendships").delete().eq("id", id);

  if (error) throw error;
};

export const searchUsers = async (query: string) => {
  const { data, error } = await supabase
    .from("profiles")
    .select("id, full_name")
    .ilike("full_name", `%${query}%`)
    .limit(10);

  if (error) throw error;
  return data ?? [];
};
