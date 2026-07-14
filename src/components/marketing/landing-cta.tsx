import Link from 'next/link';
import { Button } from '@/components/ui/button';

export function LandingCTA() {
  return (
    <section id="cta" className="scroll-mt-20">
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-24 lg:px-8">
        <div className="relative overflow-hidden rounded-2xl bg-primary px-6 py-12 sm:px-12 sm:py-16">
          <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top_left,oklch(1_1_1/0.1),transparent_60%)]" />
          <div className="mx-auto max-w-xl text-center">
            <h2 className="text-3xl font-bold tracking-tight text-primary-foreground sm:text-4xl">
              Ready to run your business smarter?
            </h2>
            <p className="mt-4 text-base text-primary-foreground/80">
              Set up your store, add your products, and start selling with MarkPOS.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <Link href="/register">
                <Button
                  size="lg"
                  variant="secondary"
                  className="min-w-[140px] bg-primary-foreground text-primary hover:bg-primary-foreground/90"
                >
                  Get started
                </Button>
              </Link>
              <Link href="/login">
                <Button
                  size="lg"
                  variant="ghost"
                  className="min-w-[140px] text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground"
                >
                  Sign in
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
