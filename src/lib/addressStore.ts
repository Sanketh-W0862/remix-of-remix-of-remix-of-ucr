// Saved addresses store (Amazon-style address book)

export interface SavedAddress {
  id: string;
  label: string; // e.g. "Office", "Warehouse"
  address: string; // free text
}

let savedAddresses: SavedAddress[] = [];
let nextAddrId = 1;

export function generateAddressId(): string {
  return `ADDR-${String(nextAddrId++).padStart(4, "0")}`;
}

export function addSavedAddress(address: string, label?: string): SavedAddress {
  const id = generateAddressId();
  const entry: SavedAddress = { id, label: label || `Address ${savedAddresses.length + 1}`, address };
  savedAddresses = [...savedAddresses, entry];
  return entry;
}

export function getSavedAddresses(): SavedAddress[] {
  return savedAddresses;
}
