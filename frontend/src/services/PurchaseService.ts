import Purchases, { PurchasesPackage, CustomerInfo } from 'react-native-purchases';

const REVENUECAT_API_KEY = 'appl_PpZmqUkOybeXgtKOiADJootjceF';
const ENTITLEMENT_ID = 'Fixi - Schuldenfrei mit Plan Pro';

let isConfigured = false;

export async function initRevenueCat(): Promise<void> {
  try {
    await Purchases.configure({ apiKey: REVENUECAT_API_KEY });
    isConfigured = true;
  } catch {
    isConfigured = false;
  }
}

export async function getOfferings(): Promise<PurchasesPackage[]> {
  try {
    if (!isConfigured) return [];
    const offerings = await Purchases.getOfferings();
    if (offerings.current && offerings.current.availablePackages) {
      return offerings.current.availablePackages;
    }
    return [];
  } catch {
    return [];
  }
}

export async function purchasePackage(pkg: PurchasesPackage): Promise<boolean> {
  try {
    const { customerInfo } = await Purchases.purchasePackage(pkg);
    return isPremiumActive(customerInfo);
  } catch (error: any) {
    if (error.userCancelled) return false;
    throw error;
  }
}

export async function restorePurchases(): Promise<boolean> {
  try {
    const customerInfo = await Purchases.restorePurchases();
    return isPremiumActive(customerInfo);
  } catch {
    return false;
  }
}

export async function checkPremiumStatus(): Promise<boolean> {
  try {
    if (!isConfigured) return false;
    const customerInfo = await Purchases.getCustomerInfo();
    return isPremiumActive(customerInfo);
  } catch {
    return false;
  }
}

function isPremiumActive(customerInfo: CustomerInfo): boolean {
  return customerInfo.entitlements.active[ENTITLEMENT_ID] !== undefined;
}
