interface Reading {
  rate: number
  peak: number
  megabytes: number
}

function buildTrace(rawMbps: readonly number[]): Reading[] {
  const readings: Reading[] = [{ rate: 0, peak: 0, megabytes: 0 }]
  // The Android display filter integrates three seconds, then applies a 1 s exponential filter.
  const alpha = 1 - Math.exp(-1)
  let sum = 0
  rawMbps.forEach((raw, index) => {
    sum += raw - (rawMbps[index - 3] ?? 0)
    const windowMean = sum / Math.min(index + 1, 3)
    const previous = readings[index]!
    const rate = windowMean === 0 ? 0 : previous.rate + alpha * (windowMean - previous.rate)
    readings.push({
      rate,
      peak: Math.max(previous.peak, rate),
      megabytes: previous.megabytes + raw / 8,
    })
  })
  return readings
}

// Synthetic one-second payload rates (Mbps). Only the last 30 s are drawn; totals span 02:49.
const trace = {
  down: buildTrace([
    84, 207, 330, 391, 420, 433, 441, 437, 448, 448, 427, 432, 442, 429, 421, 440, 451, 441, 445,
    467, 468, 454, 460, 471, 456, 439, 446, 448, 428, 422, 437, 439, 426, 436, 458, 455, 448, 463,
    475, 460, 451, 462, 458, 435, 432, 443, 434, 419, 410, 447, 439, 437, 458, 468, 455, 456, 472,
    465, 445, 447, 454, 437, 422, 434, 440, 426, 427, 449, 454, 444, 455, 473, 465, 452, 462, 466,
    445, 434, 444, 441, 422, 413, 467, 492, 515, 528, 518, 518, 531, 510, 485, 472, 436, 447, 436,
    415, 419, 429, 417, 409, 428, 439, 429, 434, 455, 456, 442, 448, 459, 444, 426, 433, 436, 416,
    409, 425, 427, 415, 425, 446, 444, 436, 451, 463, 448, 438, 449, 446, 423, 419, 431, 422, 407,
    419, 435, 428, 450, 454, 453, 448, 438, 439, 449, 442, 439, 448, 464, 443, 449, 451, 458, 449,
    425, 406, 415, 447, 468, 468, 453, 462, 434, 448, 450, 456, 436, 461, 510, 515, 543,
  ]),
  up: buildTrace([
    16, 26, 36, 40, 43, 46, 51.9, 48.5, 44.3, 43.7, 45.2, 45.5, 43.8, 43.6, 46.8, 50.7, 51.8, 50.3,
    49.8, 51.5, 52, 49.1, 45, 43.7, 45, 45.6, 44, 43.2, 45.8, 50, 51.7, 50.5, 49.7, 51.2, 52.3, 50,
    45.8, 43.8, 44.9, 45.7, 44.3, 43, 45, 49.2, 51.5, 50.6, 49.6, 50.9, 51.7, 50.8, 46.7, 44, 44.7,
    45.8, 44.6, 42.9, 44.2, 48.3, 51.2, 50.8, 49.6, 50.6, 52.5, 51.5, 47.6, 44.4, 44.6, 45.8, 44.9,
    43, 43.6, 47.4, 50.7, 50.9, 49.6, 50.3, 52.3, 52.1, 48.5, 44.9, 44.5, 45.8, 45.3, 43.2, 43,
    46.4, 50.2, 50.9, 49.7, 50, 52.1, 52.6, 49.4, 45.5, 44.5, 45.7, 45.6, 43.4, 42.7, 45.5, 49.5,
    50.8, 49.7, 49.7, 51.8, 52.9, 50.3, 46.3, 44.6, 45.6, 45.8, 43.8, 42.4, 44.7, 48.7, 50.7, 49.8,
    49.5, 51.4, 53, 51.1, 47.1, 44.8, 45.5, 46, 44.5, 42.7, 44.2, 48.2, 50.7, 50.2, 49.6, 51.3,
    53.3, 52.2, 48.2, 55, 54, 57, 59, 56, 50, 47, 46, 44, 45, 41, 39, 42, 44, 43, 38, 36, 43, 53,
    54, 47, 61, 58, 57, 60, 70, 55, 59, 55, 67, 77, 93, 101.4,
  ]),
}
export const speedDuration = trace.down.length - 1
const directions = ['down', 'up'] as const
function traffic(mb: number) {
  return mb >= 1000 ? (mb / 1000).toFixed(2) + ' GB' : mb.toFixed(1) + ' MB'
}

/** One snapshot of the session. Averages and totals include samples before the plot. */
export function speedFrame(second: number, windowSize: number, divisor = 1) {
  return directions.map((direction) => {
    const readings = trace[direction]
    const { rate, peak, megabytes } = readings[second]!
    return {
      direction,
      rate: rate / divisor,
      average: second ? (megabytes * 8) / second / divisor : 0,
      peak: peak / divisor,
      traffic: traffic(megabytes),
      samples: readings
        .slice(Math.max(1, second - windowSize + 1), second + 1)
        .map((p) => p.rate / divisor),
    }
  })
}

export function sessionTraffic(second: number) {
  return traffic(trace.down[second]!.megabytes + trace.up[second]!.megabytes)
}
