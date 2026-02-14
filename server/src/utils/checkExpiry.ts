export function checkExpiry(expiryDate: number, age: number): Boolean {
  return age > expiryDate;
}
