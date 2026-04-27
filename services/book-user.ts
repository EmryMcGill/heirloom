import { supabase } from "../lib/supabase";

export const createBookUser = async (bookId: number, userId: string) => {
  return supabase.from("book_user").insert({
    book_id: bookId,
    user_id: userId,
  });
};
