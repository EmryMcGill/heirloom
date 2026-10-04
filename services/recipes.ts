import { supabase } from "@/lib/supabase";
import { CreateRecipeInput, Recipe } from "@/types/recipe";
import { decode } from "base64-arraybuffer";
import { File } from "expo-file-system";
import * as ImagePicker from "expo-image-picker";

export async function uploadRecipeImage(
  pickerResult: ImagePicker.ImagePickerResult,
): Promise<string> {
  if (pickerResult.canceled || !pickerResult.assets?.[0]) return "";

  const asset = pickerResult.assets[0];
  const uri = asset.uri;

  try {
    // 1. Instantiate File with local URI and read base64 string
    const file = new File(uri);
    const base64 = await file.base64();

    // 2. Decode base64 to ArrayBuffer (Supabase native upload format)
    const arrayBuffer = decode(base64);

    const rawExt = uri.split(".").pop()?.toLowerCase() ?? "jpeg";
    const fileExt = rawExt === "jpg" ? "jpeg" : rawExt;
    const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
    const filePath = `recipes/${fileName}`;

    // 3. Upload ArrayBuffer with explicit content type
    const { error: uploadError } = await supabase.storage
      .from("recipe-images")
      .upload(filePath, arrayBuffer, {
        contentType: `image/${fileExt}`,
        upsert: true,
      });

    if (uploadError) {
      throw new Error(`Image upload failed: ${uploadError.message}`);
    }

    const { data } = supabase.storage
      .from("recipe-images")
      .getPublicUrl(filePath);

    return data.publicUrl;
  } catch (err) {
    console.error("Recipe image upload error:", err);
    throw err;
  }
}

export async function saveRecipe(
  input: CreateRecipeInput & { id?: string },
  userId: string,
) {
  // Extract id out so it is not included in the insert body
  const { id, ...recipeData } = input;

  // 1. UPDATE EXISTING RECIPE
  if (id) {
    const { data, error } = await supabase
      .from("recipes")
      .update({
        ...recipeData,
        author_id: userId,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .eq("author_id", userId)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data;
  }

  // 2. CREATE NEW RECIPE (id is omitted completely)
  const { data, error } = await supabase
    .from("recipes")
    .insert([
      {
        ...recipeData,
        author_id: userId,
      },
    ])
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
}

export async function getRecipesByUserId(userId: string): Promise<Recipe[]> {
  const { data, error } = await supabase
    .from("recipes")
    .select("*")
    .eq("author_id", userId)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return data || [];
}

export async function getRecipeById(id: string): Promise<Recipe | null> {
  const { data, error } = await supabase
    .from("recipes")
    .select("*")
    .eq("id", id)
    .single();

  if (error) {
    console.error("Error fetching recipe:", error.message);
    throw new Error(error.message);
  }

  return data;
}

export async function deleteRecipe(recipeId: string): Promise<void> {
  // 1. Clean up junction table references first
  const { error: junctionError } = await supabase
    .from("book_recipes")
    .delete()
    .eq("recipe_id", recipeId);

  if (junctionError) {
    throw new Error(
      `Failed to remove recipe associations: ${junctionError.message}`,
    );
  }

  // 2. Delete the actual recipe
  const { error: deleteError } = await supabase
    .from("recipes")
    .delete()
    .eq("id", recipeId);

  if (deleteError) {
    throw new Error(`Failed to delete recipe: ${deleteError.message}`);
  }
}

export async function viewRecipe(bookId: string) {
  const { data, error } = await supabase
    .from("recipes")
    .update({
      last_viewed_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", bookId)
    .select()
    .single();

  if (error) {
    throw new Error(error.message);
  }
}

export async function getAccessibleRecipes(userId: string): Promise<Recipe[]> {
  const { data, error } = await supabase.from("accessible_recipes").select("*");

  return data ?? [];
}
