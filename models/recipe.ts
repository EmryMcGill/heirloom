export interface RecipeRequest {
  title: string;
  description: string;
  story?: string;
  prep_time: number;
  cook_time: number;
  servings: number;
  image_url: string;
  tags: string; // JSON string
  notes: string;
  ingredients: string[];
  steps: string[];
  // Changed from book_id: number;
  book_ids: number[];
}

export interface Recipe extends Omit<RecipeRequest, "book_ids"> {
  id: number;
  created_at: string;
  owner_id: string;
  owner: any;
  // Changed from book: any to support a list of linked books
  books: any[];
  comments: any[];
  saved?: boolean;
}

export interface SavedRecipe {
  id: number;
  user_id: string;
  recipe_id: number;
}

// The new join table schema structure (for your database/backend tracking)
export interface BookRecipe {
  id: number;
  book_id: number;
  recipe_id: number;
  created_at: string;
}
