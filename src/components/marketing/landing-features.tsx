import { Zap, Package, BarChart3, Users, Shield, Building2, Check } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

const benefits = [
  { icon: <Zap className="size-5" />, title: 'Fast checkout', description: 'Process transactions in seconds with our intuitive POS interface.' },
  { icon: <Package className="size-5" />, title: 'Real-time inventory', description: 'Track stock levels and receive low-stock alerts automatically.' },
  { icon: <BarChart3 className="size-5" />, title: 'Actionable reports', description: 'Understand sales trends and business performance at a glance.' },
  { icon: <Shield className="size-5" />, title: 'Secure cloud access', description: 'Your data is encrypted, backed up, and accessible from anywhere.' },
];

const features = [
  { icon: <Zap className="size-6" />, title: 'Fast Point of Sale', description: 'Process transactions quickly through a simple, responsive checkout experience.' },
  { icon: <Package className="size-6" />, title: 'Inventory Management', description: 'Track products and stock levels in real time and identify low-stock items before they run out.' },
  { icon: <BarChart3 className="size-6" />, title: 'Sales Analytics', description: 'Understand revenue, orders, trends, and top-performing products from one dashboard.' },
  { icon: <Users className="size-6" />, title: 'Customer Management', description: 'Build customer profiles and understand purchasing activity.' },
  { icon: <Shield className="size-6" />, title: 'Staff and Permissions', description: 'Give team members the right level of access with secure role-based permissions.' },
  { icon: <Building2 className="size-6" />, title: 'Multi-store Ready', description: 'Manage multiple locations as your business expands.' },
];

const showcaseItems = [
  {
    icon: <Zap className="size-6" />,
    title: 'Faster checkout',
    description: 'Ring up sales in seconds with barcode scanning, category browsing, and quick-search. Your entire catalog is at your fingertips.',
  },
  {
    icon: <Package className="size-6" />,
    title: 'Better inventory visibility',
    description: 'Know exactly what is in stock, what is running low, and what needs reordering—across every location.',
  },
  {
    icon: <BarChart3 className="size-6" />,
    title: 'Clear business insights',
    description: 'Understand your best-selling products, peak sales hours, and revenue trends with charts and reports built into your dashboard.',
  },
];

const businessTypes = [
  'Retail stores',
  'Convenience stores',
  'Cafés',
  'Small restaurants',
  'Specialty shops',
  'Growing multi-location businesses',
];

export function LandingValueStrip() {
  return (
    <section className="border-y bg-muted/30">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {benefits.map((b) => (
            <div key={b.title} className="flex items-start gap-4">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                {b.icon}
              </div>
              <div>
                <h3 className="text-sm font-semibold">{b.title}</h3>
                <p className="mt-0.5 text-sm text-muted-foreground">{b.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export function LandingFeatures() {
  return (
    <section id="features" className="scroll-mt-20">
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-24 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Everything you need to sell, manage, and grow.
          </h2>
          <p className="mt-4 text-base text-muted-foreground">
            MarkPOS combines point-of-sale, inventory, analytics, and customer tools into one
            unified platform.
          </p>
        </div>
        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((f) => (
            <Card key={f.title} className="transition-shadow hover:shadow-md">
              <CardContent className="flex flex-col gap-3 p-6">
                <div className="flex size-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  {f.icon}
                </div>
                <h3 className="text-base font-semibold">{f.title}</h3>
                <p className="text-sm leading-relaxed text-muted-foreground">{f.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}

export function LandingShowcase() {
  return (
    <section id="solutions" className="scroll-mt-20 border-y bg-muted/30">
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-24 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Built for real-world retail.
          </h2>
          <p className="mt-4 text-base text-muted-foreground">
            Every feature in MarkPOS is designed to solve problems that brick-and-mortar
            businesses face daily.
          </p>
        </div>
        <div className="mt-16 space-y-20">
          {showcaseItems.map((item, i) => (
            <div
              key={item.title}
              className={`grid items-center gap-8 lg:gap-16 ${
                i % 2 === 0 ? 'lg:grid-cols-[1fr_1fr]' : 'lg:grid-cols-[1fr_1fr]'
              }`}
            >
              <div className={i % 2 === 1 ? 'lg:order-2' : ''}>
                <div className="flex size-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  {item.icon}
                </div>
                <h3 className="mt-4 text-2xl font-bold tracking-tight">{item.title}</h3>
                <p className="mt-3 text-base leading-relaxed text-muted-foreground">
                  {item.description}
                </p>
              </div>
              <div className={i % 2 === 1 ? 'lg:order-1' : ''}>
                <Card className="overflow-hidden shadow-md">
                  <div className="border-b bg-muted/30 px-4 py-2">
                    <div className="flex items-center gap-2">
                      <div className="flex gap-1.5">
                        <span className="size-2.5 rounded-full bg-destructive/60" />
                        <span className="size-2.5 rounded-full bg-warning/60" />
                        <span className="size-2.5 rounded-full bg-success/60" />
                      </div>
                      <span className="ml-2 text-xs font-medium text-muted-foreground">
                        {i === 0
                          ? 'POS Terminal'
                          : i === 1
                            ? 'Inventory'
                            : 'Dashboard Analytics'}
                      </span>
                    </div>
                  </div>
                  <CardContent className="p-4 sm:p-6">
                    {i === 0 && (
                      <div className="space-y-3">
                        <div className="flex gap-3">
                          <div className="flex-1 rounded-md border bg-muted/20 p-2 text-left text-xs">
                            <p className="font-medium">Organic Coffee Beans</p>
                            <p className="text-muted-foreground">$12.50</p>
                          </div>
                          <div className="flex-1 rounded-md border bg-muted/20 p-2 text-left text-xs">
                            <p className="font-medium">Artisan Bread</p>
                            <p className="text-muted-foreground">$5.75</p>
                          </div>
                          <div className="flex-1 rounded-md border bg-primary/10 p-2 text-left text-xs">
                            <p className="font-medium">Fresh Milk</p>
                            <p className="text-muted-foreground">$4.50</p>
                          </div>
                        </div>
                        <div className="flex items-center justify-between rounded-md border bg-card p-3">
                          <span className="text-xs text-muted-foreground">Cart total</span>
                          <span className="text-sm font-bold">$22.75</span>
                        </div>
                      </div>
                    )}
                    {i === 1 && (
                      <div className="space-y-2">
                        {[
                          { name: 'Organic Coffee Beans', stock: 24, status: 'ok' as const },
                          { name: 'Fresh Milk', stock: 3, status: 'low' as const },
                          { name: 'Artisan Bread', stock: 8, status: 'ok' as const },
                          { name: 'Filter Papers', stock: 1, status: 'critical' as const },
                        ].map((item) => (
                          <div
                            key={item.name}
                            className="flex items-center justify-between rounded-md border-b border-border/50 pb-2 text-xs last:border-0 last:pb-0"
                          >
                            <span className="font-medium">{item.name}</span>
                            <span
                              className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${
                                item.status === 'critical'
                                  ? 'bg-destructive/10 text-destructive'
                                  : item.status === 'low'
                                    ? 'bg-warning/10 text-warning'
                                    : 'bg-success/10 text-success'
                              }`}
                            >
                              {item.stock} in stock
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                    {i === 2 && (
                      <div>
                        <div className="mb-3 grid grid-cols-3 gap-3">
                          <div className="rounded-md border bg-card p-2 text-center">
                            <p className="text-xs text-muted-foreground">Revenue</p>
                            <p className="text-sm font-bold">$12.4k</p>
                          </div>
                          <div className="rounded-md border bg-card p-2 text-center">
                            <p className="text-xs text-muted-foreground">Orders</p>
                            <p className="text-sm font-bold">142</p>
                          </div>
                          <div className="rounded-md border bg-card p-2 text-center">
                            <p className="text-xs text-muted-foreground">Growth</p>
                            <p className="text-sm font-bold text-success">+12%</p>
                          </div>
                        </div>
                        <div className="flex items-end gap-1">
                          <div className="h-8 w-full rounded-sm bg-primary/20" />
                          <div className="h-12 w-full rounded-sm bg-primary/30" />
                          <div className="h-6 w-full rounded-sm bg-primary/20" />
                          <div className="h-16 w-full rounded-sm bg-primary/40" />
                          <div className="h-10 w-full rounded-sm bg-primary/30" />
                          <div className="h-20 w-full rounded-sm bg-primary/50" />
                          <div className="h-14 w-full rounded-sm bg-primary/35" />
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export function LandingBusinessTypes() {
  return (
    <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-24 lg:px-8">
      <div className="mx-auto max-w-2xl text-center">
        <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
          Built for businesses that move fast.
        </h2>
        <p className="mt-4 text-base text-muted-foreground">
          From independent shops to growing multi-location operations, MarkPOS adapts to how you
          work.
        </p>
      </div>
      <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {businessTypes.map((type) => (
          <div
            key={type}
            className="flex items-center gap-3 rounded-xl border bg-card p-4 shadow-sm"
          >
            <Check className="size-5 shrink-0 text-primary" />
            <span className="text-sm font-medium">{type}</span>
          </div>
        ))}
      </div>
    </section>
  );
}
