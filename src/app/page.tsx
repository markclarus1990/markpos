import type { Metadata } from 'next';
import { LandingNav } from '@/components/marketing/landing-nav';
import { LandingHero } from '@/components/marketing/landing-hero';
import { LandingValueStrip, LandingFeatures, LandingShowcase, LandingBusinessTypes } from '@/components/marketing/landing-features';
import { LandingPricing } from '@/components/marketing/landing-pricing';
import { LandingCTA } from '@/components/marketing/landing-cta';
import { LandingFooter } from '@/components/marketing/landing-footer';

export const metadata: Metadata = {
  title: 'MarkPOS — Modern Point of Sale for Growing Businesses',
  description:
    'Manage sales, inventory, customers, and business performance with MarkPOS, a modern cloud-based point-of-sale platform.',
  openGraph: {
    title: 'MarkPOS — Modern Point of Sale for Growing Businesses',
    description:
      'Manage sales, inventory, customers, and business performance with MarkPOS, a modern cloud-based point-of-sale platform.',
    type: 'website',
    siteName: 'MarkPOS',
  },
};

export default function LandingPage() {
  return (
    <>
      <LandingNav />
      <main>
        <LandingHero />
        <LandingValueStrip />
        <LandingFeatures />
        <LandingShowcase />
        <LandingBusinessTypes />
        <LandingPricing />
        <LandingCTA />
      </main>
      <LandingFooter />
    </>
  );
}
