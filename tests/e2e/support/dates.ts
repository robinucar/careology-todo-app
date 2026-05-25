export const futureDateInput = (daysFromToday: number): string => {
  const date = new Date()
  date.setDate(date.getDate() + daysFromToday)

  return date.toISOString().slice(0, 10)
}

export const pastDateInput = (): string => {
  const date = new Date()
  date.setDate(date.getDate() - 1)

  return date.toISOString().slice(0, 10)
}
