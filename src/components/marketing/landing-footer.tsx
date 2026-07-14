import Link from 'next/link';
import { APP_NAME } from '@/lib/constants';

const productLinks = [
  { href: '#features', label: 'Features' },
  { href: '#solutions', label: 'Solutions' },
  { href: '#pricing', label: 'Pricing' },
];

const companyLinks = [
  { href: '#', label: 'About' },
  { href: '#', label: 'Blog' },
  { href: '#', label: 'Contact' },
];

const legalLinks = [
  { href: '#', label: 'Privacy' },
  { href: '#', label: 'Terms' },
];

function MarkPOSLogoSmall() {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 28 28"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <rect x="2" y="2" width="24" height="24" rx="6" className="fill-primary" />
      <rect x="7" y="10" width="3" height="8" rx="1" className="fill-primary-foreground" />
      <rect x="12.5" y="7" width="3" height="11" rx="1" className="fill-primary-foreground" />
      <rect x="18" y="12" width="3" height="6" rx="1" className="fill-primary-foreground" />
    </svg>
  );
}

export function LandingFooter() {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t bg-background">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          <div className="space-y-3">
            <Link href="/" className="flex items-center gap-2">
              <MarkPOSLogoSmall />
              <span className="text-base font-bold">{APP_NAME}</span>
            </Link>
            <p className="text-sm leading-relaxed text-muted-foreground">
              Modern cloud-based point-of-sale platform for growing businesses.
            </p>
          </div>
          <div>
            <h4 className="mb-3 text-sm font-semibold">Product</h4>
            <ul className="space-y-2">
              {productLinks.map((link) => (
                <li key={link.label}>
                  <a
                    href={link.href}
                    className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h4 className="mb-3 text-sm font-semibold">Company</h4>
            <ul className="space-y-2">
              {companyLinks.map((link) => (
                <li key={link.label}>
                  <a
                    href={link.href}
                    className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h4 className="mb-3 text-sm font-semibold">Legal</h4>
            <ul className="space-y-2">
              {legalLinks.map((link) => (
                <li key={link.label}>
                  <a
                    href={link.href}
                    className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>
        <div className="mt-10 border-t pt-6 text-center text-sm text-muted-foreground">
          &copy; {year} {APP_NAME}. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
