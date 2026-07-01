import { RecipeRequest, SavedRecipe } from "@/models/recipe";
import { decode } from "base64-arraybuffer";
import * as ImagePicker from "expo-image-picker";
import { supabase } from "../lib/supabase";

const addSavedFlag = async <T extends { id: number }>(
  recipes: T[],
  userId?: string | null,
) => {
  if (!userId || recipes.length === 0) {
    return recipes.map((recipe) => ({ ...recipe, saved: false }));
  }

  const { data, error } = await supabase
    .from("saved_recipes")
    .select("recipe_id")
    .eq("user_id", userId);

  if (error) throw error;

  const savedRecipeIds = new Set((data ?? []).map((item) => item.recipe_id));

  return recipes.map((recipe) => ({
    ...recipe,
    saved: savedRecipeIds.has(recipe.id),
  }));
};

export const saveRecipeForUser = async (recipeId: number, userId: string) => {
  const { data: existingSavedRecipe, error: lookupError } = await supabase
    .from("saved_recipes")
    .select("id")
    .eq("user_id", userId)
    .eq("recipe_id", recipeId)
    .maybeSingle();

  if (lookupError) throw lookupError;
  if (existingSavedRecipe) return existingSavedRecipe as SavedRecipe;

  const { data, error } = await supabase
    .from("saved_recipes")
    .insert({ user_id: userId, recipe_id: recipeId })
    .select("id, user_id, recipe_id")
    .single();

  if (error) throw error;

  return data as SavedRecipe;
};

export const deleteSavedRecipeForUser = async (
  recipeId: number,
  userId: string,
) => {
  const { error } = await supabase
    .from("saved_recipes")
    .delete()
    .eq("user_id", userId)
    .eq("recipe_id", recipeId);

  if (error) throw error;
};

export const getRecipesByBookId = async (bookId: number | string) => {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const targetBookId = Number(bookId);

  // Step 1: Explicitly grab the IDs of the recipes linked to this book
  const { data: junctionRows, error: junctionError } = await supabase
    .from("book_recipes")
    .select("recipe_id")
    .eq("book_id", targetBookId);

  if (junctionError) {
    console.error("Error fetching junction IDs:", junctionError);
    throw junctionError;
  }

  // If no records match inside the junction table, return early to prevent broad queries
  const recipeIds =
    junctionRows?.map((row) => row.recipe_id).filter(Boolean) ?? [];
  if (recipeIds.length === 0) {
    return [];
  }

  // Step 2: Fetch the actual fully populated recipes using a flat lookup filter
  const { data, error } = await supabase
    .from("recipes")
    .select(
      `
      *,
      owner:profiles ( full_name ),
      books:book_recipes (
        ...books ( id, title )
      ),
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
    .in("id", recipeIds)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching recipes by matched IDs:", error);
    throw error;
  }

  return addSavedFlag(data ?? [], user?.id);
};

export const getRecipesByUserId = async (userId: string) => {
  const { data: bookUsers, error: bookUserError } = await supabase
    .from("book_user")
    .select("book_id")
    .eq("user_id", userId);

  if (bookUserError) throw bookUserError;

  const bookIds = bookUsers?.map((item) => item.book_id) ?? [];

  // First, get all unique recipe IDs that belong to the user's books
  let sharedRecipeIds: number[] = [];
  if (bookIds.length > 0) {
    const { data: bookRecipes, error: bookRecipesError } = await supabase
      .from("book_recipes")
      .select("recipe_id")
      .in("book_id", bookIds);

    if (bookRecipesError) throw bookRecipesError;
    sharedRecipeIds = bookRecipes?.map((br) => br.recipe_id) ?? [];
  }

  // Get all recipe IDs that are linked to ANY book to know who is unlinked/orphaned
  const { data: allLinked, error: allLinkedError } = await supabase
    .from("book_recipes")
    .select("recipe_id");

  if (allLinkedError) throw allLinkedError;
  const globallyLinkedRecipeIds = new Set(
    allLinked?.map((br) => br.recipe_id) ?? [],
  );

  // Build the main recipe lookup query
  let query = supabase.from("recipes").select(`
    *,
    owner:profiles ( full_name ),
    books:book_recipes (
      ...books ( id, title )
    ),
    comments:comments (
      id,
      created_at,
      user_id,
      recipe_id,
      body,
      user_name:profiles ( full_name )
    )
  `);

  const filterParts: string[] = [];

  // Rule A: Recipe is in one of my books
  if (sharedRecipeIds.length > 0) {
    filterParts.push(`id.in.(${sharedRecipeIds.join(",")})`);
  }

  // Rule B: Recipe belongs to no books at all
  // Since we can't filter an array relation for empty easily on client queries,
  // we filter by picking IDs that weren't present in the join table query.
  const { data: allRecipeIds, error: idError } = await supabase
    .from("recipes")
    .select("id");
  if (!idError && allRecipeIds) {
    const unlinkedIds = allRecipeIds
      .map((r) => r.id)
      .filter((id) => !globallyLinkedRecipeIds.has(id));

    if (unlinkedIds.length > 0) {
      filterParts.push(`id.in.(${unlinkedIds.join(",")})`);
    }
  }

  // Apply filtered conditions dynamically
  if (filterParts.length > 0) {
    query = query.or(filterParts.join(","));
  } else {
    // Fallback if no books and no orphaned files exist to protect layout
    return [];
  }

  const { data, error } = await query
    .order("created_at", { ascending: false })
    .order("created_at", {
      foreignTable: "comments",
      ascending: false,
    });

  if (error) throw error;

  return addSavedFlag(data ?? [], userId);
};

export const saveRecipe = async (recipe: RecipeRequest & { id?: number }) => {
  // Destructure book_ids out to handle it separately via our join table
  const { book_ids, ...recipeData } = recipe;

  // 1. Upsert core structural changes into primary table
  const { data: upsertedRecipe, error: recipeError } = await supabase
    .from("recipes")
    .upsert(recipeData)
    .select(
      `
      *,
      owner:profiles ( full_name )
    `,
    )
    .single();

  if (recipeError) {
    console.error("Error saving core recipe data:", recipeError);
    throw recipeError;
  }

  const targetRecipeId = upsertedRecipe.id;

  // 2. Clear old join map links for this recipe entirely
  const { error: deleteError } = await supabase
    .from("book_recipes")
    .delete()
    .eq("recipe_id", targetRecipeId);

  if (deleteError) {
    console.error("Error clearing stale recipe books:", deleteError);
    throw deleteError;
  }

  // 3. Insert fresh mappings if target arrays exist
  if (book_ids && book_ids.length > 0) {
    const newRelationshipRows = book_ids.map((bId) => ({
      book_id: bId,
      recipe_id: targetRecipeId,
    }));

    const { error: insertLinksError } = await supabase
      .from("book_recipes")
      .insert(newRelationshipRows);

    if (insertLinksError) {
      console.error("Error generating new recipe book rows:", insertLinksError);
      throw insertLinksError;
    }
  }

  // Fetch updated full relational model matching expectations
  const { data: finalRecipeObject, error: finalFetchError } = await supabase
    .from("recipes")
    .select(
      `
      *,
      owner:profiles ( full_name ),
      books:book_recipes (
        ...books ( id, title )
      )
    `,
    )
    .eq("id", targetRecipeId)
    .single();

  if (finalFetchError) throw finalFetchError;

  return finalRecipeObject;
};

export const deleteRecipe = async (recipeId: number | string) => {
  const id = Number(recipeId);
  if (Number.isNaN(id) || id <= 0) {
    throw new Error("Invalid recipe ID");
  }

  // Clear subtable comments first to honor foreign constraints safely
  const { error: commentError } = await supabase
    .from("comments")
    .delete()
    .eq("recipe_id", id);

  if (commentError) {
    console.error("Error deleting recipe comments:", commentError);
    throw commentError;
  }

  // Clear cross-linked entries inside the book join table
  const { error: relationError } = await supabase
    .from("book_recipes")
    .delete()
    .eq("recipe_id", id);

  if (relationError) {
    console.error(
      "Error clearing recipe book cross references:",
      relationError,
    );
    throw relationError;
  }

  const { data, error } = await supabase
    .from("recipes")
    .delete()
    .eq("id", id)
    .select();

  if (error) {
    console.error("Error deleting recipe:", error);
    throw error;
  }

  if (!data || (Array.isArray(data) && data.length === 0)) {
    throw new Error("No recipe was deleted.");
  }

  return true;
};

export const uploadImage = async (uri: ImagePicker.ImagePickerResult) => {
  if (!uri.assets || uri.assets.length === 0) {
    throw new Error("No image selected");
  }

  const firstAsset = uri.assets[0];
  if (!firstAsset.base64) {
    throw new Error("Image data is missing");
  }

  const fileExt = firstAsset.uri.split(".").pop()?.toLowerCase() || "jpg";
  const fileName = `${Date.now()}.${fileExt}`;
  const base64File = decode(firstAsset.base64);
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
