import { useAuth } from "@/contexts/AuthContext";
import { fetchUserBooks } from "@/services/books";
import { Book } from "@/types/book";
import { useQuery } from "@tanstack/react-query";

export function useBooks() {
  const { session } = useAuth();
  const userId = session?.user?.id;

  return useQuery<Book[], Error>({
    queryKey: ["books", userId],
    queryFn: () => {
      if (!userId) return Promise.resolve([]);
      return fetchUserBooks(userId);
    },
    enabled: !!userId,
  });
}
