export interface CommentRequest {
  body: string;
  recipe_id: number;
}

export interface Comment extends CommentRequest {
  id: number;
  created_at: string;
  user_id: string;
  user_name: string;
}
