import { redirect } from 'next/navigation';

export default async function LegacySignupRedirectPage({ searchParams }) {
  await searchParams;
  redirect('/private-access');
}

