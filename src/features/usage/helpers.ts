export function getRemainingUsage(used: number, limit: number): number {
  if (limit <= 0) {
    return 0;
  }

  return Math.max(0, limit - Math.max(0, used));
}

export function isUsageLimitReached(used: number, limit: number): boolean {
  if (limit <= 0) {
    return false;
  }

  return used >= limit;
}

export function getUsageProgressPercent(used: number, limit: number): number {
  if (limit <= 0) {
    return 0;
  }

  const ratio = Math.max(0, used) / limit;

  return Math.min(100, Math.max(0, Math.round(ratio * 100)));
}
