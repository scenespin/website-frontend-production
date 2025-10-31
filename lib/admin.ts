/**
 * Admin utilities
 * 
 * Check if current user has admin access
 */

const ADMIN_EMAILS = [
  'jeff@gardensc.com',
  // Add more admin emails here as needed
]; // Can be expanded

export async function isAdmin(): Promise<boolean> {
  try {
    const token = localStorage.getItem('token');
    if (!token) return false;

    // Try to hit admin endpoint - if it works, user is admin
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/api/admin/overview`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    return response.ok;
  } catch {
    return false;
  }
}

// Quick check based on email (for UI only, backend validates properly)
export function isAdminEmail(email: string): boolean {
  return ADMIN_EMAILS.some(adminEmail => 
    email.toLowerCase() === adminEmail.toLowerCase()
  );
}

