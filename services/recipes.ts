import { RecipeRequest } from "@/models/recipe";
import { decode } from "base64-arraybuffer";
import * as ImagePicker from "expo-image-picker";
import { supabase } from "../lib/supabase";

export const getRecipesByBookId = async (bookId) => {
  const { data, error } = await supabase
    .from("recipes")
    .select(
      `
      *,
      owner:profiles ( full_name ),
      book:books (title),
      comments:comments (
        id,
        created_at,
        user_id,
        recipe_id,
        body,
        user_name:profiles ( full_name )
      )
    `,
    )
    .eq("book_id", bookId)
    .order("created_at", { ascending: false })
    .order("created_at", { foreignTable: "comments", ascending: false });

  if (error) throw error;
  return data ?? [];
};

export const saveRecipe = async (recipe: RecipeRequest) => {
  const { data, error } = await supabase
    .from("recipes")
    .upsert(recipe)
    .select(
      `
      *,
      owner:profiles ( full_name ),
      book:books (title)
    `,
    )
    .single();

  if (error) {
    console.error("Error saving recipe:", error);
    throw error;
  }

  return data;
};
export const uploadImage = async (uri: ImagePicker.ImagePickerResult) => {
  const fileExt = uri.assets[0].uri.split(".").pop()?.toLowerCase() || "jpg";
  const fileName = `${Date.now()}.${fileExt}`;
  const base64File = decode(uri.assets[0].base64);
  const { data, error } = await supabase.storage
    .from("recipe-images")
    .upload(fileName, base64File, {
      contentType: "image/png",
    });

  return (
    process?.env?.EXPO_PUBLIC_SUPABASE_URL! +
    "/storage/v1/object/public/" +
    data?.fullPath
  );
};
