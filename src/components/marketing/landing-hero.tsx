import Link from 'next/link';
import { DollarSign, ShoppingCart, TrendingUp, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

function StatBox({ icon, value, label }: { icon: React.ReactNode; value: string; label: string }) {
  return (
    <div className="flex items-center gap-3 rounded-lg border bg-card p-3 sm:p-4">
      <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
        {icon}
      </div>
      <div>
        <p className="text-lg font-bold leading-tight sm:text-xl">{value}</p>
        <p className="text-xs text-muted-foreground">{label}</p>
      </div>
    </div>
  );
}

export function LandingHero() {
  return (
    <section className="relative overflow-hidden pt-24 sm:pt-32 lg:pt-40">
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top_right,oklch(0.55_0.2_260/0.06),transparent_50%)]" />
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
          {/* Text */}
          <div className="flex flex-col gap-6">
            <p className="text-sm font-semibold uppercase tracking-[0.15em] text-primary">
              Smarter Point of Sale
            </p>
            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
              Run your entire business from one powerful POS.
            </h1>
            <p className="max-w-lg text-base leading-relaxed text-muted-foreground sm:text-lg">
              Sell faster, manage inventory in real time, understand your performance, and grow
              your business&mdash;all from one simple platform.
            </p>
            <div className="flex flex-wrap items-center gap-3">
              <Link href="/register">
                <Button size="lg" className="min-w-[140px]">
                  Start for free
                </Button>
              </Link>
              <a href="#features">
                <Button variant="outline" size="lg">
                  Explore features
                </Button>
              </a>
            </div>
            <p className="text-xs text-muted-foreground">
              No credit card required &bull; Quick setup &bull; Built for growing businesses
            </p>
          </div>

          {/* Preview */}
          <div className="relative">
            <div className="absolute -inset-4 -z-10 rounded-3xl bg-gradient-to-b from-primary/5 to-transparent blur-2xl" />
            <Card className="overflow-hidden shadow-xl">
              <div className="border-b bg-muted/30 px-4 py-2.5">
                <div className="flex items-center gap-2">
                  <div className="flex gap-1.5">
                    <span className="size-2.5 rounded-full bg-destructive/60" />
                    <span className="size-2.5 rounded-full bg-warning/60" />
                    <span className="size-2.5 rounded-full bg-success/60" />
                  </div>
                  <span className="ml-2 text-xs font-medium text-muted-foreground">
                    Dashboard &mdash; Today&rsquo;s Overview
                  </span>
                </div>
              </div>
              <CardContent className="space-y-4 p-4 sm:p-6">
                <div className="grid grid-cols-2 gap-3">
                  <StatBox
                    icon={<DollarSign className="size-5" />}
                    value="$4,280"
                    label="Today&rsquo;s Sales"
                  />
                  <StatBox
                    icon={<ShoppingCart className="size-5" />}
                    value="47"
                    label="Total Orders"
                  />
                  <StatBox
                    icon={<TrendingUp className="size-5" />}
                    value="$91.06"
                    label="Avg. Order Value"
                  />
                  <StatBox
                    icon={<AlertTriangle className="size-5" />}
                    value="3"
                    label="Low Stock Alerts"
                  />
                </div>
                <div className="rounded-lg border bg-muted/30 p-3 sm:p-4">
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Sales Trend
                  </p>
                  <div className="flex items-end gap-1 sm:gap-1.5" aria-label="Sales trend chart">
                    <div className="h-12 w-full rounded-sm bg-primary/20" />
                    <div className="h-16 w-full rounded-sm bg-primary/30" />
                    <div className="h-10 w-full rounded-sm bg-primary/20" />
                    <div className="h-20 w-full rounded-sm bg-primary/40" />
                    <div className="h-14 w-full rounded-sm bg-primary/30" />
                    <div className="h-24 w-full rounded-sm bg-primary/50" />
                    <div className="h-18 w-full rounded-sm bg-primary/35" />
                  </div>
                  <div className="mt-1.5 flex justify-between text-[10px] text-muted-foreground">
                    <span>Mon</span>
                    <span>Tue</span>
                    <span>Wed</span>
                    <span>Thu</span>
                    <span>Fri</span>
                    <span>Sat</span>
                    <span>Sun</span>
                  </div>
                </div>
                <div className="rounded-lg border bg-muted/30 p-3 sm:p-4">
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Recent Transactions
                  </p>
                  <div className="space-y-2">
                    {[
                      { name: 'Organic Coffee Beans', amount: '$24.50', time: '2 min ago' },
                      { name: 'Artisan Bread Loaf', amount: '$8.75', time: '15 min ago' },
                      { name: 'Fresh Produce Bundle', amount: '$32.00', time: '1 hour ago' },
                    ].map((t, i) => (
                      <div
                        key={i}
                        className="flex items-center justify-between rounded-md border-b border-border/50 pb-2 last:border-0 last:pb-0"
                      >
                        <div>
                          <p className="text-sm font-medium">{t.name}</p>
                          <p className="text-xs text-muted-foreground">{t.time}</p>
                        </div>
                        <span className="text-sm font-semibold">{t.amount}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </section>
  );
}
