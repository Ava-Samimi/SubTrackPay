export const PACKAGE_NAME_BY_ID = {
  1: "Starter",
  2: "Basic",
  3: "Standard",
  4: "Pro",
  5: "Plus",
  6: "Business",
  7: "Premium",
  8: "Enterprise",
  9: "Student",
  10: "VIP",
};

export function getPackageName(packageID) {
  return PACKAGE_NAME_BY_ID[Number(packageID)] ?? `Package #${packageID}`;
}
