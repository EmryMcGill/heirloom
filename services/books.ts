import { supabase } from "@/lib/supabase"; // Adjust import path to your Supabase client setup
import { Book, CreateBookInput, UpdateBookInput } from "@/types/book";
import { Recipe } from "@/types/recipe";

/**
 * Fetch all books owned by the authenticated user,
 * including the total count of recipes in each book.
 */
export async function getUserBooks(userId: string): Promise<Book[]> {
  const { data, error } = await supabase
    .from("books")
    .select(
      `
      *,
      book_recipes (count)
    `,
    )
    .eq("user_id", userId)
    .order("updated_at", { ascending: false })
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return (data || []).map((book: any) => ({
    ...book,
    recipe_count: book.book_recipes?.[0]?.count ?? 0,
  }));
}

export async function fetchUserBooks(userId: string): Promise<Book[]> {
  const { data: memberships, error: membershipsError } = await supabase
    .from("book_members")
    .select("book_id, role")
    .eq("user_id", userId);

  if (membershipsError) {
    throw new Error(membershipsError.message);
  }

  const memberRoles = new Map(
    (memberships ?? []).map(({ book_id, role }) => [book_id, role]),
  );
  const memberBookIds = [...memberRoles.keys()];
  const bookSelection = `
    *,
    owner:profiles (id, full_name, avatar_url),
    book_recipes (count)
  `;

  const { data: ownedBooks, error: ownedBooksError } = await supabase
    .from("books")
    .select(bookSelection)
    .eq("user_id", userId);

  if (ownedBooksError) {
    throw new Error(ownedBooksError.message);
  }

  const { data: memberBooks, error: memberBooksError } =
    memberBookIds.length > 0
      ? await supabase
          .from("books")
          .select(bookSelection)
          .in("id", memberBookIds)
      : { data: [], error: null };

  if (memberBooksError) {
    throw new Error(memberBooksError.message);
  }

  const booksById = new Map(
    [...(ownedBooks ?? []), ...(memberBooks ?? [])].map((book) => [
      book.id,
      book,
    ]),
  );

  return [...booksById.values()]
    .map((book) => {
      const { book_recipes, ...bookData } = book;
      const role =
        book.user_id === userId ? "owner" : memberRoles.get(book.id) ?? "viewer";

      return {
        ...bookData,
        role,
        recipe_count: book_recipes?.[0]?.count ?? 0,
      };
    })
    .sort(
      (a, b) =>
        new Date(b.updated_at || b.created_at).getTime() -
        new Date(a.updated_at || a.created_at).getTime(),
    );
}

/**
 * Fetch a single book by ID along with all its attached recipes.
 */
export async function getBookWithRecipes(bookId: string): Promise<Book> {
  const { data, error } = await supabase
    .from("books")
    .select(
      `
      *,
      owner:profiles (id, full_name, avatar_url),
      book_members (
        user_id,
        role
      ),
      book_recipes (
        position,
        recipes (*)
      )
    `,
    )
    .eq("id", bookId)
    .single();

  if (error) {
    throw new Error(error.message);
  }

  // Extract nested recipe objects from the junction query and order by position
  const sortedJunctions = (data.book_recipes || []).sort(
    (a: any, b: any) => (a.position ?? 0) - (b.position ?? 0),
  );

  const recipes: Recipe[] = sortedJunctions
    .map((item: any) => item.recipes)
    .filter(Boolean);

  return {
    ...data,
    recipe_count: recipes.length,
    recipes,
  };
}

/**
 * Create a new book.
 */
export async function createBook(
  input: CreateBookInput,
  userId: string,
  members: { userId: string; role: string }[] = [],
): Promise<Book> {
  // Create the book
  const { data: book, error: bookError } = await supabase
    .from("books")
    .insert({
      title: input.title,
      description: input.description ?? null,
      cover_image_url: input.cover_image_url ?? null,
      user_id: userId,
    })
    .select()
    .single();

  if (bookError) {
    throw new Error(bookError.message);
  }

  // Create the owner + selected members
  const bookMembers = [
    ...members.map((member) => ({
      book_id: book.id,
      user_id: member.userId,
      role: member.role,
    })),
  ];

  const { error: membersError } = await supabase
    .from("book_members")
    .insert(bookMembers);

  if (membersError) {
    // Remove the book if creating its members failed
    await supabase.from("books").delete().eq("id", book.id);

    throw new Error(membersError.message);
  }

  return book;
}

/**
 * Update an existing book's metadata.
 */
export async function updateBook(
  bookId: string,
  input: UpdateBookInput,
): Promise<Book> {
  const { data, error } = await supabase
    .from("books")
    .update({
      ...input,
      updated_at: new Date().toISOString(),
    })
    .eq("id", bookId)
    .select()
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

/**
 * Delete a book by ID (junction records will cascade delete in DB).
 */
export async function deleteBook(bookId: string): Promise<void> {
  const { error } = await supabase.from("books").delete().eq("id", bookId);

  if (error) {
    throw new Error(error.message);
  }
}

/**
 * Add a recipe to a specific book.
 */
export async function addRecipeToBook(
  bookId: string,
  recipeId: string,
  position: number = 0,
): Promise<void> {
  const { error } = await supabase.from("book_recipes").insert({
    book_id: bookId,
    recipe_id: recipeId,
    position,
  });

  if (error) {
    // Ignore duplicate key error if already in the book
    if (error.code === "23505") return;
    throw new Error(error.message);
  }
}

/**
 * Remove a recipe from a specific book.
 */
export async function removeRecipeFromBook(
  bookId: string,
  recipeId: string,
): Promise<void> {
  const { error } = await supabase
    .from("book_recipes")
    .delete()
    .eq("book_id", bookId)
    .eq("recipe_id", recipeId);

  if (error) {
    throw new Error(error.message);
  }
}

/**
 * Fetch all book IDs that contain a specific recipe.
 * Useful for checkboxes/toggles in an "Add to Book" sheet.
 */
export async function getBookIdsForRecipe(recipeId: string): Promise<string[]> {
  const { data, error } = await supabase
    .from("book_recipes")
    .select("book_id")
    .eq("recipe_id", recipeId);

  if (error) {
    throw new Error(error.message);
  }

  return (data || []).map((item) => item.book_id);
}

/**
 * Sync a recipe's book assignments (batch adds missing, removes unchecked).
 */
export async function updateRecipeBooks(
  recipeId: string,
  selectedBookIds: string[],
): Promise<void> {
  const currentBookIds = await getBookIdsForRecipe(recipeId);

  const toAdd = selectedBookIds.filter((id) => !currentBookIds.includes(id));
  const toRemove = currentBookIds.filter((id) => !selectedBookIds.includes(id));

  // Remove unchecked books
  if (toRemove.length > 0) {
    const { error: deleteError } = await supabase
      .from("book_recipes")
      .delete()
      .eq("recipe_id", recipeId)
      .in("book_id", toRemove);

    if (deleteError) throw new Error(deleteError.message);
  }

  // Insert newly checked books
  if (toAdd.length > 0) {
    const newRows = toAdd.map((bookId) => ({
      recipe_id: recipeId,
      book_id: bookId,
    }));

    const { error: insertError } = await supabase
      .from("book_recipes")
      .insert(newRows);

    if (insertError) throw new Error(insertError.message);
  }
}

export async function updateBookRecipes(
  bookId: string,
  selectedRecipeIds: string[],
): Promise<void> {
  // 1. Fetch existing recipe IDs for this book
  const { data: currentRows, error: fetchError } = await supabase
    .from("book_recipes")
    .select("recipe_id")
    .eq("book_id", bookId);

  if (fetchError) throw new Error(fetchError.message);

  const currentRecipeIds = (currentRows || []).map((row) => row.recipe_id);

  // 2. Diff current vs selected
  const toAdd = selectedRecipeIds.filter(
    (id) => !currentRecipeIds.includes(id),
  );
  const toRemove = currentRecipeIds.filter(
    (id) => !selectedRecipeIds.includes(id),
  );

  // 3. Remove unselected recipes
  if (toRemove.length > 0) {
    const { error: deleteError } = await supabase
      .from("book_recipes")
      .delete()
      .eq("book_id", bookId)
      .in("recipe_id", toRemove);

    if (deleteError) throw new Error(deleteError.message);
  }

  // 4. Insert newly selected recipes
  if (toAdd.length > 0) {
    const newRows = toAdd.map((recipeId) => ({
      book_id: bookId,
      recipe_id: recipeId,
    }));

    const { error: insertError } = await supabase
      .from("book_recipes")
      .insert(newRows);

    if (insertError) throw new Error(insertError.message);
  }
}

export async function fetchBookById(bookId: string): Promise<Book> {
  const { data: book, error: bookError } = await supabase
    .from("books")
    .select("*")
    .eq("id", bookId)
    .single();

  if (bookError) {
    throw new Error(bookError.message);
  }

  const { data: members, error: membersError } = await supabase
    .from("book_members")
    .select(
      `
      user_id,
      role,
      profiles (
        id,
        full_name,
        avatar_url
      )
    `,
    )
    .eq("book_id", bookId);

  if (membersError) {
    throw new Error(membersError.message);
  }

  console.log("book", book);
  console.log("members", members);

  return {
    ...book,
    book_members: members,
  };
}

export async function viewBook(bookId: string) {
  const { data, error } = await supabase
    .from("books")
    .update({
      last_viewed_at: new Date().toISOString(),
    })
    .eq("id", bookId)
    .select()
    .single();

  if (error) {
    throw new Error(error.message);
  }
}
