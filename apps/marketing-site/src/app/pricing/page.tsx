import { redirect } from 'next/navigation';

/**
 * Pricing page is hidden — we work with clients to find the right fit.
 * Redirect to Contact so prospects can reach us directly.
 */
export default function PricingPage() {
  redirect('/contact');
}
