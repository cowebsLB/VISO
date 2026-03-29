/**
 * Builds wa.me URL. `phoneDigits` = country code + number, no + prefix.
 */
export function buildWhatsAppUrl(phoneDigits: string, message: string): string {
  const cleaned = phoneDigits.replace(/\D/g, "");
  const text = encodeURIComponent(message);
  return `https://wa.me/${cleaned}?text=${text}`;
}
