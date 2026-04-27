export interface BookRequest {
  title: string;
  description: string;
}

export interface Book extends BookRequest {
  id: string;
  owner_id: string;
  owner: any;
}
