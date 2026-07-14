'use client';

export function PrintButton() {
  return (
    <button
      onClick={() => window.print()}
      className="ml-auto h-9 px-4 rounded-md bg-primary text-primary-foreground text-sm font-medium"
    >
      Print
    </button>
  );
}
