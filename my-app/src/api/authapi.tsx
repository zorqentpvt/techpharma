import { users, User, UserRole } from "../mock/users";

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export async function login({ username, password }: { username: string; password: string }) {
  await delay(500);
  const user = users.find(u => u.username === username && u.password === password);
  if (user) return { success: true, user };
  return { success: false, message: "Invalid username or password" };
}

export async function signup({
  username,
  email,
  password,
  role = "normal" as UserRole,
}: {
  username: string;
  email: string;
  password: string;
  role?: UserRole;
}) {
  await delay(500);
  const exists = users.find(u => u.username === username || u.email === email);
  if (exists) return { success: false, message: "Username or email already exists" };

  const newUser: User = { username, email, password, role };
  users.push(newUser);
  return { success: true, user: newUser };
}
