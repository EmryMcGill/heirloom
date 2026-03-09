import { supabase } from "../lib/supabase";

export const getRecipesByBookId = async (bookId: number) => {
  return await supabase.from("recipes").select("*").eq("book_id", bookId);
};
