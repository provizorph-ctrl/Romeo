export interface DodgeBounds {
  maxX: number;
  maxY: number;
}

export interface Offset2D {
  x: number;
  y: number;
}

/**
 * Вычисляет безопасное смещение для уворачивающейся кнопки «Нет»,
 * чтобы она оставалась внутри допустимой зоны и не улетала за границы экрана.
 */
export function computeDodgeOffset(params: {
  currentOffset: Offset2D;
  bounds: DodgeBounds;
  attempt: number;
  seed?: number;
}): Offset2D {
  const { currentOffset, bounds, attempt, seed = 0 } = params;
  const safeMaxX = Math.max(24, Math.floor(bounds.maxX));
  const safeMaxY = Math.max(16, Math.floor(bounds.maxY));

  // Детерминированные, но живые углы смещения в противоположную сторону
  const angleBase = ((attempt * 137.5 + seed * 53) % 360) * (Math.PI / 180);
  const stepX = Math.cos(angleBase) * safeMaxX * 0.85;
  const stepY = Math.sin(angleBase) * safeMaxY * 0.85;

  let nextX = Math.round(stepX);
  let nextY = Math.round(stepY);

  // Если новое положение слишком близко к текущему, отражаем его
  if (Math.abs(nextX - currentOffset.x) < safeMaxX * 0.35) {
    nextX = currentOffset.x >= 0 ? -Math.round(safeMaxX * 0.7) : Math.round(safeMaxX * 0.7);
  }
  if (Math.abs(nextY - currentOffset.y) < safeMaxY * 0.25) {
    nextY = currentOffset.y >= 0 ? -Math.round(safeMaxY * 0.65) : Math.round(safeMaxY * 0.65);
  }

  return {
    x: Math.max(-safeMaxX, Math.min(safeMaxX, nextX)),
    y: Math.max(-safeMaxY, Math.min(safeMaxY, nextY)),
  };
}
