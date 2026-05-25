const createUtcDate = (daysFromToday: number): Date => {
  const today = new Date();

  return new Date(
    Date.UTC(
      today.getUTCFullYear(),
      today.getUTCMonth(),
      today.getUTCDate() + daysFromToday,
    ),
  );
};

export const createFutureUtcDate = (daysFromToday = 30): Date => {
  return createUtcDate(daysFromToday);
};

export const formatDateInput = (date: Date): string => {
  return date.toISOString().slice(0, 10);
};

export const createFutureDateInput = (daysFromToday = 30): string => {
  return formatDateInput(createFutureUtcDate(daysFromToday));
};

export const createFutureDateTimeInput = (
  daysFromToday = 30,
  time = "10:30:00.000Z",
): string => {
  return `${createFutureDateInput(daysFromToday)}T${time}`;
};
