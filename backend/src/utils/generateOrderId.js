export function generateOrderId(sequence = 10000) {
  const n = sequence + Math.floor(Math.random() * 90000);
  return `ORD-${n}`;
}
