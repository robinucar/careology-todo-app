const createUtcDate = (daysFromToday: number): Date => {
  const today = new Date()

  return new Date(
    Date.UTC(
      today.getUTCFullYear(),
      today.getUTCMonth(),
      today.getUTCDate() + daysFromToday,
    ),
  )
}

export const createFutureDateInput = (daysFromToday = 30): string => {
  return createUtcDate(daysFromToday).toISOString().slice(0, 10)
}

export const createFutureDateIso = (daysFromToday = 30): string => {
  return createUtcDate(daysFromToday).toISOString()
}

export const createFutureDateLabel = (daysFromToday = 30): string => {
  return new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: '2-digit',
    timeZone: 'UTC',
    year: '2-digit',
  }).format(createUtcDate(daysFromToday))
}
