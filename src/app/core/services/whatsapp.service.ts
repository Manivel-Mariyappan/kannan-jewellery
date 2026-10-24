import { Injectable, computed, inject } from '@angular/core';
import { Product } from '../models';
import { ContentStore } from './content-store';

// "+91 98765-43210" becomes "919876543210"
export function normaliseWhatsappNumber(raw: string | null | undefined): string {
  return (raw ?? '').replace(/\D/g, '');
}

// Returns null when no WhatsApp number is set up yet.
export function whatsappUrl(number: string | null | undefined, message: string): string | null {
  const digits = normaliseWhatsappNumber(number);
  if (digits.length < 8) return null;
  return `https://wa.me/${digits}?text=${encodeURIComponent(message)}`;
}

export const enquiryMessages = {
  product: (p: Pick<Product, 'name' | 'code'>) =>
    `Hello, I am interested in ${p.name}, Product Code: ${p.code}. Please share the latest price and availability.`,
  collection: (collection: string) =>
    `Hello, I would like to see your ${collection} collection. Please share the available designs and prices.`,
  bridal: () =>
    'Hello, I would like to book a bridal jewellery consultation. Please share available dates and times.',
  general: (shopName: string) => `Hello ${shopName}, I have an enquiry about your jewellery.`,
};

@Injectable({ providedIn: 'root' })
export class WhatsappService {
  private readonly store = inject(ContentStore);

  readonly number = computed(() => normaliseWhatsappNumber(this.store.settings()?.whatsappNumber));
  readonly configured = computed(() => this.number().length >= 8);

  link(message: string): string | null {
    return whatsappUrl(this.number(), message);
  }

  productLink(product: Pick<Product, 'name' | 'code'>): string | null {
    return this.link(enquiryMessages.product(product));
  }

  collectionLink(collection: string): string | null {
    return this.link(enquiryMessages.collection(collection));
  }

  bridalLink(): string | null {
    return this.link(enquiryMessages.bridal());
  }

  generalLink(): string | null {
    return this.link(
      enquiryMessages.general(this.store.settings()?.shopName ?? 'Kannan Jewellery'),
    );
  }
}
