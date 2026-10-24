import { enquiryMessages, normaliseWhatsappNumber, whatsappUrl } from './whatsapp.service';

describe('WhatsApp links', () => {
  it('normalises numbers to digits only', () => {
    expect(normaliseWhatsappNumber('+91 98765-43210')).toBe('919876543210');
    expect(normaliseWhatsappNumber(undefined)).toBe('');
  });

  it('builds a wa.me URL with an encoded message', () => {
    const msg = enquiryMessages.product({ name: 'Ruby Kada & Set', code: 'KJ-BG-301' });
    const url = whatsappUrl('+91 98765 43210', msg)!;
    expect(url.startsWith('https://wa.me/919876543210?text=')).toBe(true);
    expect(decodeURIComponent(url.split('?text=')[1])).toBe(
      'Hello, I am interested in Ruby Kada & Set, Product Code: KJ-BG-301. Please share the latest price and availability.',
    );
    expect(url).not.toContain(' ');
    expect(url).toContain('%26');
  });

  it('returns null when no number is configured', () => {
    expect(whatsappUrl('', 'hi')).toBeNull();
  });
});
