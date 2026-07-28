export interface User {
  id: string;
  username: string;
  email: string;
  role: "USER" | "ADMIN";
  avatar: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}
