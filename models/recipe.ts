export interface Recipe {
  id: number;
  created_at: string;
  owner_id: string;
  book_id: number;
  title: string;
  description?: string;
  prep_time?: number;
  cook_time?: number;
  servings?: number;
  ingredients?: string[];
  steps?: string[];
}
