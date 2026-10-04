import { supabase } from "@/lib/supabase"; // Adjust import path to your Supabase client setup

export async function searchUsers(search: string) {
  const query = search.trim();

  if (!query) return [];

  const { data, error } = await supabase
    .from("profiles")
    .select("id, full_name, username, avatar_url")
    .or(`username.ilike.%${query}%,full_name.ilike.%${query}%`)
    .limit(20);

  if (error) throw error;

  return data ?? [];
}

export async function addBookMember({
  bookId,
  userId,
  role,
}: {
  bookId: string;
  userId: string;
  role: "viewer" | "editor";
}) {
  const { data, error } = await supabase
    .from("book_members")
    .insert({
      book_id: bookId,
      user_id: userId,
      role,
    })
    .select()
    .single();

  if (error) throw error;

  return data;
}
