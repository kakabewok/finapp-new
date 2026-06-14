export function useIsDeveloper(email?: string | null): boolean {
  if (!email) return false;
  // Use NEXT_PUBLIC_DEV_EMAIL if available, fallback to the known dev email
  const devEmail = process.env.NEXT_PUBLIC_DEV_EMAIL || "rizalnov667@gmail.com";
  return email.toLowerCase() === devEmail.toLowerCase();
}
