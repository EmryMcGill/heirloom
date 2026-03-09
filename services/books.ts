import { supabase } from "../lib/supabase";

export const getBooks = async () => {
  return await supabase.from("books").select("*");
};

export const createBook = async (title: string) =>
  supabase.from("books").insert({ title });
