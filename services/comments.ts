import { CommentRequest } from "@/models/comments";
import { supabase } from "../lib/supabase";

export const saveComment = async (commentRequest: CommentRequest) => {
  const { data, error } = await supabase
    .from("comments")
    .upsert(commentRequest)
    .select(
      `
      id,
      created_at,
      user_id,
      recipe_id,
      body,
      user_name:profiles ( full_name )
    `,
    )
    .single();

  if (error) {
    console.error("Error saving comment:", error);
    throw error;
  }

  return data;
};
