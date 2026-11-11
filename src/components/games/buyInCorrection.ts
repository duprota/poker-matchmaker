export function parseBuyIn(value: string): number | null {
  const amount = Number(value.trim().replace(',', '.'));
  return value.trim() !== '' && Number.isFinite(amount) && amount > 0 ? amount : null;
}

export function previewBuyIn(buyIn: number, rebuys: number, finalResult: number | null) {
  const invested = buyIn * (1 + rebuys);
  return { invested, balance: finalResult === null ? null : finalResult - invested };
}