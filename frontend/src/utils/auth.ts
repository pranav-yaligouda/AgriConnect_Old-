// Utility to get the current logged-in user ID from localStorage JWT
// (Assumes JWT payload contains userId or _id)

export function getCurrentUserId(): string | undefined {
  const token = localStorage.getItem('token');
  if (!token) return undefined;
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.userId || payload._id;
  } catch {
    return undefined;
  }
}
