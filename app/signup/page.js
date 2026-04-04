import { redirect } from 'next/navigation';

export default async function LegacySignupRedirectPage({ searchParams }) {
  const params = await searchParams;
  const query = new URLSearchParams(params || {}).toString();
  const target = query ? `/sign-up?${query}` : '/sign-up';
  redirect(target);
}

