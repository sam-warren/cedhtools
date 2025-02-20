import { getServerSession } from "next-auth";
import { authConfig } from "./auth.config";

export async function getSession() {
  return await getServerSession(authConfig);
}

export async function getCurrentUser() {
  const session = await getSession();
  return session?.user;
}

export async function isAuthenticated() {
  const session = await getSession();
  return !!session?.user;
}

export function clearAuthData() {
  const authKeys = [
    'lastKnownSession',
  ];

  authKeys.forEach(key => {
    try {
      localStorage.removeItem(key);
    } catch (e) {
      console.error(`Failed to remove ${key} from localStorage:`, e);
    }
  });
} 