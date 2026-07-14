import { Card, CardContent } from '@/components/ui/card';

export function LandingPricing() {
  return (
    <section id="pricing" className="scroll-mt-20 border-y bg-muted/30">
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-24 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Simple plans that grow with your business.
          </h2>
          <p className="mt-4 text-base text-muted-foreground">
            Flexible plans coming soon. We&rsquo;re building pricing that scales with your
            needs&mdash;from single-store startups to multi-location operations.
          </p>
        </div>
        <div className="mt-10 flex justify-center">
          <Card className="max-w-md shadow-md">
            <CardContent className="flex flex-col items-center gap-4 p-8 text-center">
              <span className="inline-flex items-center rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
                Coming soon
              </span>
              <h3 className="text-xl font-bold">Start free, scale when you&rsquo;re ready</h3>
              <p className="text-sm text-muted-foreground">
                All core features included during early access. Transparent pricing with no
                surprise fees.
              </p>
              <a
                href="#cta"
                className="inline-flex h-12 min-h-[44px] min-w-[44px] items-center justify-center rounded-lg bg-primary px-6 text-base font-medium text-primary-foreground transition-colors hover:opacity-90"
              >
                Get notified
              </a>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
}
