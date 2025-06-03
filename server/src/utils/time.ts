/**
 * Converts a time string (e.g., "15m", "7d", "2h") into seconds.
 * @param timeString The time string to convert.
 * @returns The equivalent time in seconds, or 0 if the format is invalid.
 */
export const timeStringToSeconds = (timeString: string): number => {
  if (!timeString) return 0;

  const lastChar = timeString.slice(-1);
  const value = parseInt(timeString.slice(0, -1));

  if (isNaN(value)) return 0;

  switch (lastChar) {
    case 's': // seconds
      return value;
    case 'm': // minutes
      return value * 60;
    case 'h': // hours
      return value * 60 * 60;
    case 'd': // days
      return value * 24 * 60 * 60;
    case 'w': // weeks
      return value * 7 * 24 * 60 * 60;
    default:
      // If no unit, assume it's seconds (e.g., "300")
      if (/^\d+$/.test(timeString)) {
        return parseInt(timeString);
      }
      return 0; // Invalid format
  }
}; 