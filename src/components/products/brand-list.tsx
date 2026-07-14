'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { createBrand, updateBrand, archiveBrand, restoreBrand } from '@/lib/products/actions';

interface Brand {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  is_active: boolean;
}

interface BrandListProps {
  brands: Brand[];
}

export function BrandList({ brands }: BrandListProps) {
  const router = useRouter();
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function handleCreate(formData: FormData) {
    setPending(true);
    setError(null);
    const result = await createBrand(null, formData);
    if (result.error) {
      setError(result.error);
      setPending(false);
      return;
    }
    setShowForm(false);
    setPending(false);
    router.refresh();
  }

  async function handleUpdate(id: string, formData: FormData) {
    setPending(true);
    setError(null);
    const result = await updateBrand(id, null, formData);
    if (result.error) {
      setError(result.error);
      setPending(false);
      return;
    }
    setEditingId(null);
    setPending(false);
    router.refresh();
  }

  async function handleArchive(id: string) {
    await archiveBrand(id);
    router.refresh();
  }

  async function handleRestore(id: string) {
    await restoreBrand(id);
    router.refresh();
  }

  return (
    <div className="space-y-4">
      {error && (
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-sm text-destructive">
          {error}
        </div>
      )}

      <Button onClick={() => setShowForm(!showForm)}>
        {showForm ? 'Cancel' : 'Add Brand'}
      </Button>

      {showForm && (
        <form action={handleCreate} className="space-y-4 rounded-lg border p-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="name">Name *</Label>
              <Input id="name" name="name" required maxLength={100} />
            </div>
            <div>
              <Label htmlFor="slug">Slug (leave blank to auto-generate)</Label>
              <Input id="slug" name="slug" />
            </div>
            <div className="sm:col-span-2">
              <Label htmlFor="description">Description</Label>
              <Textarea id="description" name="description" rows={2} />
            </div>
          </div>
          <Button type="submit" isLoading={pending}>Create Brand</Button>
        </form>
      )}

      <div className="overflow-x-auto rounded-lg border">
        <table className="w-full text-sm">
          <thead className="bg-muted/50">
            <tr>
              <th className="px-4 py-3 text-left font-medium">Name</th>
              <th className="px-4 py-3 text-left font-medium">Slug</th>
              <th className="px-4 py-3 text-left font-medium">Status</th>
              <th className="px-4 py-3 text-right font-medium">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {brands.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-muted-foreground">
                  No brands yet
                </td>
              </tr>
            ) : (
              brands.map((brand) => (
                <tr key={brand.id} className="hover:bg-muted/30">
                  <td className="px-4 py-3">
                    {editingId === brand.id ? (
                      <form action={(fd) => handleUpdate(brand.id, fd)} className="flex gap-2">
                        <Input name="name" defaultValue={brand.name} required className="max-w-[200px]" />
                        <Button type="submit" size="sm" isLoading={pending}>Save</Button>
                        <Button type="button" variant="ghost" size="sm" onClick={() => setEditingId(null)}>Cancel</Button>
                      </form>
                    ) : (
                      <span className="font-medium">{brand.name}</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{brand.slug}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                      brand.is_active
                        ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                        : 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400'
                    }`}>
                      {brand.is_active ? 'Active' : 'Archived'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    {editingId !== brand.id && (
                      <>
                        <Button variant="ghost" size="sm" onClick={() => setEditingId(brand.id)}>Edit</Button>
                        {brand.is_active ? (
                          <Button variant="ghost" size="sm" onClick={() => handleArchive(brand.id)}>Archive</Button>
                        ) : (
                          <Button variant="ghost" size="sm" onClick={() => handleRestore(brand.id)}>Restore</Button>
                        )}
                      </>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
