export interface UnitOfMeasure {
  id: string;
  code: string;
  name: string;
  abbreviation: string;
  allowsDecimal: boolean;
  isSystem: boolean;
  organizationId: string | null;
  createdAt: string;
}
