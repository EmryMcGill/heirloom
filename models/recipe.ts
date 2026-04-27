export interface RecipeRequest {
  book_id: number;
  title: string;
  description?: string;
  prep_time?: number;
  cook_time?: number;
  servings?: number;
  ingredients?: string[];
  steps?: string[];
  image_url: string;
}

export interface Recipe extends RecipeRequest {
  id: number;
  created_at: string;
  owner_id: string;
  owner: any;
  book: any;
  comments: any[];
}
