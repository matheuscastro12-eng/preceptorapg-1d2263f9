// EasyFlow checkout links — centralized
const LINKS: Record<string, string> = {
  monthly: 'https://pay.easyflow.digital/checkouts/offer/53711ff2-4e3f-4a3e-bf4f-b6297fb5d8e9',
  biannual: 'https://pay.easyflow.digital/checkouts/offer/5f3656be-83d5-4aa6-9e5e-4992a6d28864',
  annual: 'https://pay.easyflow.digital/checkouts/offer/694e4345-758b-4aaa-9187-407708447194',
};

export function getEasyflowLink(plan: string, email?: string): string | null {
  const base = LINKS[plan];
  if (!base) return null;
  if (email) return `${base}?email=${encodeURIComponent(email)}`;
  return base;
}

export function openEasyflowCheckout(plan: string, email?: string) {
  const link = getEasyflowLink(plan, email);
  if (link) window.location.href = link;
}
