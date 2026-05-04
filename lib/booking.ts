export const TIME_SLOTS = [
  '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00'
]

export const TICKET_PRICE = 150
export const DEPOSIT_PER_PERSON = 100
export const MAX_PER_SLOT = 20

export function calcDeposit(numPeople: number): number {
  return numPeople * DEPOSIT_PER_PERSON
}

export function calcTotal(numPeople: number): number {
  return numPeople * TICKET_PRICE
}

export function getSlotEndTime(startTime: string): string {
  const [h, m] = startTime.split(':').map(Number)
  const end = new Date(2000, 0, 1, h + 2, m)
  return `${String(end.getHours()).padStart(2, '0')}:${String(end.getMinutes()).padStart(2, '0')}`
}
