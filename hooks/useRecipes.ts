import { useAuth } from "@/contexts/AuthContext";
import { getRecipesByUserId, saveRecipe } from "@/services/recipes";
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
      // Invalidate and refetch all queries matching the 'recipes' key
      queryClient.invalidateQueries({ queryKey: ["recipes"] });
    },
  });
}

export function useRecipes() {
  const { session } = useAuth();
  const userId = session?.user?.id;

  return useQuery({
    queryKey: ["recipes", userId],
    queryFn: () => getRecipesByUserId(userId!),
    enabled: !!userId,
    staleTime: 1000 * 60 * 5, // 5 minutes cache
  });
}
