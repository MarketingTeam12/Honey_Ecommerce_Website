/**
 * Remote Storage.prototype monkey-patching was removed because Auth, Cart, and Wishlist
 * persist natively in browser localStorage and remote syncing interfered with third-party
 * keys (e.g. Zoho SalesIQ's `siq_embed`) and cleared native storage on bootstrap.
 * Kept as a safe no-op export for backwards compatibility.
 */
export async function initializePersistentStorage(): Promise<void> {
  return Promise.resolve();
}

export function isPersistentStorageReady(): boolean {
  return true;
}
