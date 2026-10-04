import { Recipe } from "./recipe";

export type BookRole = "owner" | "editor" | "viewer";

export interface BookOwner {
  id: string;
  full_name?: string | null;
  avatar_url?: string | null;
  email?: string | null;
}

export interface Book {
  id: string;
  user_id: string;
  title: string;
  description?: string | null;
  cover_image_url?: string | null;
  created_at: string;
  updated_at: string;
  last_viewed_at: string;
  // Optional join fields when fetching a book with its recipes
  recipe_count?: number;
  recipes?: Recipe[];
  role?: BookRole;
  owner?: BookOwner | null;
  book_members: any[];
}

export interface BookRecipe {
  id: string;
  book_id: string;
  recipe_id: string;
  position: number;
  created_at: string;

  // Optional nested recipe data when querying junction records
  recipe?: Recipe;
}

export interface CreateBookInput {
  title: string;
  description?: string | null;
  cover_image_url?: string | null;
}

export interface UpdateBookInput {
  title?: string;
  description?: string | null;
  cover_image_url?: string | null;
}
