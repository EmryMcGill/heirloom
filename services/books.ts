import { BookRequest } from "@/models/book";
import { supabase } from "../lib/supabase";
import { getFriends } from "./friends";

export const getBooks = async (userId: string) => {
  const { data, error } = await supabase
    .from("book_user")
    .select(
      `
      book:book_id (*)
    `,
    )
    .eq("user_id", userId);

  if (error) {
    console.log("ERROR:", error);
    return [];
  }

  return (
    data?.map((row) => ({
      ...row.book,
    })) ?? []
  );
};

export const saveBook = async (book: BookRequest) => {
  const { data, error } = await supabase
    .from("books")
    .upsert(book)
    .select(
      `
      *,
      owner:profiles ( full_name )
    `,
    )
    .single();

  if (error) {
    console.error("Error saving book:", error);
    throw error;
  }

  const session = await supabase.auth.getSession();
  const userId = session.data.session?.user?.id;

  if (!userId) {
    throw new Error("Unable to create book members. User not authenticated.");
  }

  const friends = await getFriends(userId);
  let bookUsers = [];
  if (friends.length > 0) {
    bookUsers = friends.map((friend) => ({
      book_id: data.id,
      user_id: friend.id,
      role: 1,
    }));
  }

  bookUsers.push({
    book_id: data.id,
    user_id: userId,
    role: 0,
  });

  const { error: bookUserError } = await supabase
    .from("book_user")
    .insert(bookUsers);

  if (bookUserError) {
    console.error("Error creating book members:", bookUserError);
    throw bookUserError;
  }

  return data;
};
