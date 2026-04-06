// EasyFlow checkout links — centralized
const LINKS: Record<string, string> = {
  monthly: 'https://pay.easyflow.digital/checkouts/offer/53711ff2-4e3f-4a3e-bf4f-b6297fb5d8e9',
  biannual: 'https://pay.easyflow.digital/checkouts/offer/d3e5725e-2ebc-4134-b6dd-a439c9d105df',
  annual: 'https://pay.easyflow.digital/checkouts/offer/b6079b86-6ae8-40fc-ab7f-40483cafca15',
};

export function getEasyflowLink(plan: string, email?: string): string | null {
  const base = LINKS[plan];
  if (!base) return null;
  if (email) return `${base}?email=${encodeURIComponent(email)}`;
  return base;
}

export function openEasyflowCheckout(plan: string, email?: string) {
  const link = getEasyflowLink(plan, email);
  if (link) window.open(link, '_blank');
}
