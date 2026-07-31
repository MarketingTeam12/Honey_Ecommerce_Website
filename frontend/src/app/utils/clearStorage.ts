// Emergency localStorage cleanup utility
// This will be called on app initialization to clear any corrupted or oversized data

export function emergencyClearStorage() {
  try {
    const savedProducts = localStorage.getItem('admin_products');
    
    if (savedProducts) {
      const dataSize = new Blob([savedProducts]).size;
      const sizeMB = (dataSize / 1024 / 1024).toFixed(2);
      
      // If data is larger than 3MB, it's definitely problematic
      if (dataSize > 3000000) {
        console.warn(`🚨 EMERGENCY CLEANUP: Detected ${sizeMB}MB of data in localStorage`);
        console.log('🧹 Clearing admin_products...');
        
        localStorage.removeItem('admin_products');
        
        console.log('✅ Emergency cleanup complete!');
        console.log('💡 The app will now start fresh. Please add products again using the Admin Panel.');
        
        return true; // Cleanup was performed
      }
    }
    
    return false; // No cleanup needed
  } catch (error) {
    console.error('❌ Error during emergency cleanup:', error);
    // If there's any error, just clear everything to be safe
    localStorage.removeItem('admin_products');
    return true;
  }
}
