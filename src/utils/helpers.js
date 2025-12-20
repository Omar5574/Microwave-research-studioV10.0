/**
 * Bessel Function J1(x) approximation for X < 3
 * Used in Klystron bunching calculations
 */
export function besselJ1(x) {
  if (x < 0) return -besselJ1(-x);
  return (x/2) - (Math.pow(x,3)/16) + (Math.pow(x,5)/384);
}

// Add more utility functions as needed
export function calculateTransitAngle(frequency, distance, velocity) {
  const omega = 2 * Math.PI * frequency;
  return (omega * distance) / velocity;
}