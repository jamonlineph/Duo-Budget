
export type Payer = 'Partner1' | 'Partner2' | 'Partner3' | 'Shared' | string;

export interface PartnerSettings {
  p1Name: string;
  p2Name: string;
  p3Name?: string;
  p3Enabled: boolean;
  currency: string;
}

export interface Transaction {
  id: string;
  date: string;
  description: string;
  amount: number;
  category: string;
  payer: Payer;
  originalImage?: string;
}

export interface BudgetSummary {
  partnerTotals: Record<string, number>;
  sharedTotal: number;
}

export const CATEGORIES = [
  'Groceries',
  'Dining',
  'Utilities',
  'Rent',
  'Entertainment',
  'Transport',
  'Shopping',
  'Health',
  'Other'
];

export const CURRENCIES = [
  { symbol: '$', name: 'USD' },
  { symbol: '€', name: 'EUR' },
  { symbol: '£', name: 'GBP' },
  { symbol: '¥', name: 'JPY' },
  { symbol: '₱', name: 'PHP' },
  { symbol: 'A$', name: 'AUD' },
  { symbol: 'C$', name: 'CAD' }
];
