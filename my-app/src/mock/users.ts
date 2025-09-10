export type UserRole = "doctor" | "pharmacy" | "normal";

export interface User {
  username: string;
  email: string;
  password: string;
  role: UserRole;
}

export const users: User[] = [
  { username: "admin", email: "admin@example.com", password: "1234", role: "normal" },
  { username: "drsmith", email: "drsmith@example.com", password: "abcd", role: "doctor" },
  { username: "drmark", email: "drsmith@example.com", password: "abcd", role: "doctor" },
  { username: "pharma1", email: "pharma1@example.com", password: "pass123", role: "pharmacy" },
];
