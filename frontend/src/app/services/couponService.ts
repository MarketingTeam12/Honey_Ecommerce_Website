/**
 * Coupon Service
 * Centralized service for coupon management and usage tracking
 */

import { API_URL } from "@/app/utils/api";

const STORAGE_KEY = "honey_admin_coupons";

export interface Coupon {
  id: string;
  code: string;
  discountType: "percentage" | "fixed";
  discountValue: number;
  minOrderValue?: number;
  maxDiscount?: number;
  usageLimit?: number;
  usedCount: number;
  validFrom: string;
  validUntil: string;
  isActive: boolean;
  description?: string;
}

/**
 * Fetch the shared, server-side coupon list (the source of truth that all
 * admins and customers see, regardless of browser/device) and cache it in
 * localStorage so the existing synchronous helpers below stay in sync.
 * Call this once when a page that reads coupons mounts, before reading them.
 */
export const syncCouponsFromServer = async (): Promise<Coupon[]> => {
  try {
    const response = await fetch(`${API_URL}/coupons`);
    if (!response.ok) {
      throw new Error(`Failed to fetch coupons: ${response.status}`);
    }
    const data = await response.json();
    const serverCoupons: Coupon[] = (data.coupons || []).map((c: any) => ({
      id: String(c.id),
      code: c.code,
      discountType: c.discountType,
      discountValue: Number(c.discountValue),
      minOrderValue: c.minOrderValue != null ? Number(c.minOrderValue) : undefined,
      maxDiscount: c.maxDiscount != null ? Number(c.maxDiscount) : undefined,
      usageLimit: c.usageLimit != null ? Number(c.usageLimit) : undefined,
      usedCount: Number(c.usedCount || 0),
      validFrom: c.validFrom,
      validUntil: c.validUntil,
      isActive: c.isActive !== false && c.status !== "inactive",
      description: c.description,
    }));
    localStorage.setItem(STORAGE_KEY, JSON.stringify(serverCoupons));
    return serverCoupons;
  } catch (error) {
    console.warn(
      "⚠️ [CouponService] Could not sync coupons from server, using cached/local coupons instead:",
      error,
    );
    return loadCoupons();
  }
};

/**
 * Load all coupons from localStorage
 */
export const loadCoupons = (): Coupon[] => {
  try {
    const storedCoupons = localStorage.getItem(STORAGE_KEY);
    if (storedCoupons) {
      return JSON.parse(storedCoupons);
    }
    return [];
  } catch (error) {
    console.error(
      "❌ [CouponService] Error loading coupons:",
      error,
    );
    return [];
  }
};

/**
 * Save coupons to localStorage
 */
export const saveCoupons = (coupons: Coupon[]): boolean => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(coupons));
    console.log(
      "✅ [CouponService] Coupons saved successfully",
    );
    return true;
  } catch (error) {
    console.error(
      "❌ [CouponService] Error saving coupons:",
      error,
    );
    return false;
  }
};

/**
 * Find a coupon by code
 */
export const findCouponByCode = (
  code: string,
): Coupon | null => {
  const coupons = loadCoupons();
  return (
    coupons.find(
      (c) => c.code.toUpperCase() === code.toUpperCase(),
    ) || null
  );
};

/**
 * Increment coupon usage count
 * Called when an order is successfully completed
 */
export const incrementCouponUsage = (
  couponCode: string,
): boolean => {
  try {
    const coupons = loadCoupons();
    const couponIndex = coupons.findIndex(
      (c) => c.code.toUpperCase() === couponCode.toUpperCase(),
    );

    if (couponIndex === -1) {
      console.warn(
        "⚠️ [CouponService] Coupon not found for usage increment:",
        couponCode,
      );
      return false;
    }

    coupons[couponIndex].usedCount += 1;

    console.log(
      `✅ [CouponService] Incremented usage for coupon "${couponCode}":`,
      {
        usedCount: coupons[couponIndex].usedCount,
        usageLimit: coupons[couponIndex].usageLimit,
      },
    );

    return saveCoupons(coupons);
  } catch (error) {
    console.error(
      "❌ [CouponService] Error incrementing coupon usage:",
      error,
    );
    return false;
  }
};

/**
 * Validate a coupon for the given order total
 * Returns validation result with error message if invalid
 */
export const validateCoupon = (
  code: string,
  orderTotal: number,
): { valid: boolean; error?: string; coupon?: Coupon } => {
  const coupon = findCouponByCode(code);

  if (!coupon) {
    return { valid: false, error: "Invalid coupon code" };
  }

  if (!coupon.isActive) {
    return { valid: false, error: "This coupon is not active" };
  }

  // Check minimum order value
  if (
    coupon.minOrderValue &&
    orderTotal < coupon.minOrderValue
  ) {
    return {
      valid: false,
      error: `This coupon requires a minimum order of ₹${coupon.minOrderValue}`,
    };
  }

  // Check usage limit
  if (
    coupon.usageLimit &&
    coupon.usedCount >= coupon.usageLimit
  ) {
    return {
      valid: false,
      error: "This coupon has reached its usage limit",
    };
  }

  // Check validity dates
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (coupon.validFrom) {
    const validFrom = new Date(coupon.validFrom);
    validFrom.setHours(0, 0, 0, 0);
    if (today < validFrom) {
      return {
        valid: false,
        error: `This coupon will be valid from ${coupon.validFrom}`,
      };
    }
  }

  if (coupon.validUntil) {
    const validUntil = new Date(coupon.validUntil);
    validUntil.setHours(23, 59, 59, 999);
    if (today > validUntil) {
      return { valid: false, error: "This coupon has expired" };
    }
  }

  return { valid: true, coupon };
};

/**
 * Calculate the discount amount for a given coupon and order total
 */
export const calculateDiscount = (
  coupon: Coupon,
  orderTotal: number,
): number => {
  if (coupon.discountType === "percentage") {
    const calculatedDiscount =
      (orderTotal * coupon.discountValue) / 100;
    // Apply max discount cap if specified
    if (
      coupon.maxDiscount &&
      calculatedDiscount > coupon.maxDiscount
    ) {
      return coupon.maxDiscount;
    }
    return calculatedDiscount;
  } else {
    // Fixed discount
    return Math.min(coupon.discountValue, orderTotal); // Don't exceed order total
  }
};

/**
 * Get all active coupons (for display purposes)
 */
export const getActiveCoupons = (): Coupon[] => {
  const coupons = loadCoupons();
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return coupons.filter((coupon) => {
    const isActive = coupon.isActive;

    // Check expiry
    let isNotExpired = true;
    if (coupon.validUntil) {
      const validUntil = new Date(coupon.validUntil);
      validUntil.setHours(23, 59, 59, 999);
      isNotExpired = today <= validUntil;
    }

    // Check usage limit
    const hasUsageLeft =
      !coupon.usageLimit ||
      coupon.usedCount < coupon.usageLimit;

    return isActive && isNotExpired && hasUsageLeft;
  });
};