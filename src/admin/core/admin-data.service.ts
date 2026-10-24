import { Injectable } from '@angular/core';
import { CATEGORIES } from '../../app/core/config/categories';
import { AdminCategory, AdminUser, Enquiry, GoldRateHistoryEntry } from './admin-models';
import { LocalCollection } from './local-collection';

const now = () => new Date().toISOString();
const daysAgo = (n: number) => new Date(Date.now() - n * 86_400_000).toISOString();

/**
 * UI-only data for the admin screens planned in the backend (Categories, Admin users,
 * Enquiries, Gold-rate history). Seeded with clearly fictional sample rows.
 */
@Injectable({ providedIn: 'root' })
export class AdminDataService {
  readonly categories = new LocalCollection<AdminCategory>('kj.admin.categories', () =>
    CATEGORIES.filter((c) => !c.virtual).map((c, i) => ({
      id: `cat-${c.slug}`,
      name: c.name,
      slug: c.slug,
      description: c.blurb,
      image: c.image,
      parentId: null,
      displayOrder: i + 1,
      active: true,
      showInMenu: c.slug !== 'traditional',
      metaTitle: `${c.name} | Kannan Jewellery`,
      metaDescription: c.blurb,
      updatedAt: now(),
    })),
  );

  readonly users = new LocalCollection<AdminUser>('kj.admin.users', () => [
    {
      id: 'usr-admin',
      fullName: 'Shop Administrator',
      username: 'admin',
      email: '',
      mobile: '',
      role: 'Admin',
      active: true,
      lastLogin: null,
      createdAt: now(),
    },
  ]);

  readonly enquiries = new LocalCollection<Enquiry>('kj.admin.enquiries', () => [
    {
      id: 'enq-sample-1',
      date: daysAgo(0),
      customerName: 'Sample Customer',
      mobile: '9000000001',
      email: '',
      productCode: 'KJ-BR-601',
      productName: 'Maharani Bridal Haram',
      source: 'WhatsApp',
      status: 'New',
      message: 'Sample enquiry: please share the latest price and availability.',
      followUpDate: null,
      assignedTo: 'admin',
      notes: 'Demo row — delete once real enquiries are recorded.',
    },
    {
      id: 'enq-sample-2',
      date: daysAgo(2),
      customerName: 'Sample Customer 2',
      mobile: '9000000002',
      email: '',
      productCode: 'KJ-BG-301',
      productName: 'Ruby Studded Kada',
      source: 'Phone call',
      status: 'Follow-up',
      message: 'Sample enquiry: wants to see the kada at the showroom.',
      followUpDate: daysAgo(-1),
      assignedTo: 'admin',
      notes: 'Demo row.',
    },
  ]);

  readonly goldRateHistory = new LocalCollection<GoldRateHistoryEntry>('kj.admin.goldRateHistory', () => []);
}
