import { useAuth } from "@/contexts/AuthContext";
import { getAccessibleRecipes, saveRecipe } from "@/services/recipes";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

export function useCreateRecipe() {
  const queryClient = useQueryClient();
  const { session } = useAuth();
  const userId = session?.user?.id;

  return useMutation({
    mutationFn: (input: Parameters<typeof saveRecipe>[0]) => {
      if (!userId) throw new Error("User must be logged in");
      return saveRecipe(input, userId);
    },
    onSuccess: () => {
      // Refresh both owned-recipe and accessible-recipe lists.
      queryClient.invalidateQueries({ queryKey: ["recipes"] });
      queryClient.invalidateQueries({ queryKey: ["accessible-recipes"] });
    },
  });
}

export function useRecipes() {
  const { session } = useAuth();
  const userId = session?.user?.id;

  return useQuery({
    queryKey: ["accessible-recipes", userId],
    queryFn: () => getAccessibleRecipes(userId!),
    enabled: !!userId,
    staleTime: 1000 * 60 * 5, // 5 minutes cache
  });
}
