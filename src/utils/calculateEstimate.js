import prices from "../config/prices.json";

export const MAX_QUANTITY = 99;

export function normalizeQuantity(value) {
  const number = Number(value);
  return Number.isFinite(number)
    ? Math.min(MAX_QUANTITY, Math.max(0, Math.floor(number)))
    : 0;
}

export function withTax(amount) {
  return Math.round((amount * (100 + prices.taxRatePercent)) / 100);
}

export function formatYen(amount) {
  return new Intl.NumberFormat("ja-JP").format(amount);
}

export function calculateEstimate({
  service = "website",
  coding = {},
  options = {},
  maintenance = false,
} = {}) {
  const items = [];
  const selected = prices.services[service];
  if (selected?.price)
    items.push({
      id: service,
      ...selected,
      quantity: 1,
      amount: selected.price,
    });
  if (service === "coding") {
    for (const [id, item] of Object.entries(prices.coding)) {
      const quantity = normalizeQuantity(coding[id]);
      if (quantity)
        items.push({ id, ...item, quantity, amount: quantity * item.price });
    }
  }
  for (const [id, item] of Object.entries(prices.options)) {
    if (id === "form" && service === "website") continue;
    const quantity = item.quantity
      ? normalizeQuantity(options[id])
      : Number(Boolean(options[id]));
    if (quantity)
      items.push({ ...item, id, quantity, amount: quantity * item.price });
  }
  const initial = items.reduce((sum, item) => sum + item.amount, 0);
  const monthly = maintenance ? prices.maintenance.price : 0;
  return {
    items,
    initial,
    initialWithTax: withTax(initial),
    monthly,
    monthlyWithTax: withTax(monthly),
    from: items.some((item) => item.from),
    consultation: Boolean(selected?.consultation),
  };
}

export function createDocumentDetails(date = new Date()) {
  const expires = new Date(date);
  expires.setDate(expires.getDate() + 30);
  const day = (value) =>
    `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(2, "0")}-${String(value.getDate()).padStart(2, "0")}`;
  return {
    date: day(date),
    expires: day(expires),
    number: `TCS-${day(date).replaceAll("-", "")}-${crypto.randomUUID().slice(0, 8).toUpperCase()}`,
  };
}
