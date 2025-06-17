/**
 * Duration picker utilities for handling time durations in milliseconds
 */

/**
 * regular expression to check for valid minute/second format (00-59)
 */
export function isValidMinuteOrSecond(value: string) {
  return /^[0-5][0-9]$/.test(value);
}

/**
 * regular expression to check for valid hour format (00-99+ for duration)
 */
export function isValidDurationHour(value: string) {
  return /^[0-9]{1,3}$/.test(value) && parseInt(value, 10) >= 0;
}

type GetValidNumberConfig = { max: number; min?: number; loop?: boolean };

export function getValidNumber(
  value: string,
  { max, min = 0, loop = false }: GetValidNumberConfig,
) {
  let numericValue = parseInt(value, 10);

  if (!isNaN(numericValue)) {
    if (!loop) {
      if (numericValue > max) numericValue = max;
      if (numericValue < min) numericValue = min;
    } else {
      if (numericValue > max) numericValue = min;
      if (numericValue < min) numericValue = max;
    }

    // For hours, we don't pad with zeros if it's more than 2 digits
    if (max > 99) {
      return numericValue.toString();
    }
    return numericValue.toString().padStart(2, "0");
  }

  return "00";
}

export function getValidDurationHour(value: string) {
  if (isValidDurationHour(value)) return value.padStart(2, "0");
  return getValidNumber(value, { max: 999 }); // Max 999 hours for duration
}

export function getValidMinuteOrSecond(value: string) {
  if (isValidMinuteOrSecond(value)) return value;
  return getValidNumber(value, { max: 59 });
}

type GetValidArrowNumberConfig = {
  min: number;
  max: number;
  step: number;
};

export function getValidArrowNumber(
  value: string,
  { min, max, step }: GetValidArrowNumberConfig,
) {
  let numericValue = parseInt(value, 10);
  if (!isNaN(numericValue)) {
    numericValue += step;
    return getValidNumber(String(numericValue), { min, max, loop: false });
  }
  return "00";
}

export function getValidArrowDurationHour(value: string, step: number) {
  return getValidArrowNumber(value, { min: 0, max: 999, step });
}

export function getValidArrowMinuteOrSecond(value: string, step: number) {
  return getValidArrowNumber(value, { min: 0, max: 59, step });
}

export type DurationPickerType = "hours" | "minutes" | "seconds";

/**
 * Convert milliseconds to duration components
 */
export function millisecondsToComponents(milliseconds: number) {
  const totalSeconds = Math.floor(milliseconds / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  return {
    hours: hours.toString().padStart(2, "0"),
    minutes: minutes.toString().padStart(2, "0"),
    seconds: seconds.toString().padStart(2, "0"),
  };
}

/**
 * Convert duration components to milliseconds
 */
export function componentsToMilliseconds(
  hours: string,
  minutes: string,
  seconds: string,
) {
  const h = parseInt(hours, 10) || 0;
  const m = parseInt(minutes, 10) || 0;
  const s = parseInt(seconds, 10) || 0;

  return (h * 3600 + m * 60 + s) * 1000;
}

/**
 * Set duration component and return new total milliseconds
 */
export function setDurationByType(
  totalMilliseconds: number,
  value: string,
  type: DurationPickerType,
) {
  const components = millisecondsToComponents(totalMilliseconds);

  switch (type) {
    case "hours":
      components.hours = getValidDurationHour(value);
      break;
    case "minutes":
      components.minutes = getValidMinuteOrSecond(value);
      break;
    case "seconds":
      components.seconds = getValidMinuteOrSecond(value);
      break;
  }

  return componentsToMilliseconds(
    components.hours,
    components.minutes,
    components.seconds,
  );
}

/**
 * Get duration component value from total milliseconds
 */
export function getDurationByType(
  totalMilliseconds: number,
  type: DurationPickerType,
) {
  const components = millisecondsToComponents(totalMilliseconds);

  switch (type) {
    case "hours":
      return components.hours;
    case "minutes":
      return components.minutes;
    case "seconds":
      return components.seconds;
    default:
      return "00";
  }
}

/**
 * Get new duration value after arrow key press
 */
export function getArrowDurationByType(
  totalMilliseconds: number,
  step: number,
  type: DurationPickerType,
) {
  const currentValue = getDurationByType(totalMilliseconds, type);

  switch (type) {
    case "hours":
      return getValidArrowDurationHour(currentValue, step);
    case "minutes":
    case "seconds":
      return getValidArrowMinuteOrSecond(currentValue, step);
    default:
      return "00";
  }
}
