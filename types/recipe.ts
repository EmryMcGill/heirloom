// -----------------------------------------------------------------------------
// 1. NESTED STRUCTURES (JSONB)
// -----------------------------------------------------------------------------

export interface Ingredient {
  id?: string;
  amount: string;
  unit: string;
  name: string;
}

export interface InstructionStep {
  id?: string;
  stepNumber?: number;
  text: string;
}

// -----------------------------------------------------------------------------
// 2. MAIN RECIPE DATABASE MODEL
// -----------------------------------------------------------------------------

export interface Recipe {
  id: string;
  author_id: string;
  title: string;
  description: string | null;
  prep_time: string | null;
  cook_time: string | null;
  servings: number | null;
  image_url: string | null;
  source_url: string | null;
  ingredients: Ingredient[];
  instructions: InstructionStep[] | string[];
  created_at: string;
  updated_at: string;
  last_viewed_at: string;
}

// -----------------------------------------------------------------------------
// 3. MUTATION / FORM INPUT TYPES
// -----------------------------------------------------------------------------

export type CreateRecipeInput = Omit<
  Recipe,
  "id" | "author_id" | "created_at" | "updated_at"
>;

export type UpdateRecipeInput = Partial<CreateRecipeInput> & {
  id: string;
};
