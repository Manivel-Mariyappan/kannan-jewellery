/**
 * Admin-only entities from the planned backend (ASP.NET Core + MySQL): categories, admin users,
 * enquiries and gold-rate history. UI only for now; see LocalCollection.
 */

export interface AdminCategory {
  id: string;
  name: string;
  slug: string;
  description: string;
  image: string;
  parentId: string | null;
  displayOrder: number;
  active: boolean;
  showInMenu: boolean;
  metaTitle: string;
  metaDescription: string;
  updatedAt: string;
}

export type AdminRole = 'Admin' | 'Staff';

export interface AdminUser {
  id: string;
  fullName: string;
  username: string;
  email: string;
  mobile: string;
  role: AdminRole;
  active: boolean;
  lastLogin: string | null;
  createdAt: string;
}

export type EnquirySource = 'WhatsApp' | 'Phone call' | 'Walk-in' | 'Website';
export type EnquiryStatus = 'New' | 'Contacted' | 'Follow-up' | 'Converted' | 'Closed';

export interface Enquiry {
  id: string;
  date: string;
  customerName: string;
  mobile: string;
  email: string;
  productCode: string;
  productName: string;
  source: EnquirySource;
  status: EnquiryStatus;
  message: string;
  followUpDate: string | null;
  assignedTo: string;
  notes: string;
}

export interface GoldRateHistoryEntry {
  id: string;
  effectiveAt: string;
  rate22k: number;
  rate24k: number;
  rate18k: number | null;
  silver: number | null;
  updatedBy: string;
  note: string;
}

export type StockStatus = 'In stock' | 'Made to order' | 'Out of stock';
