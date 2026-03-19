import * as StoreReview from 'expo-store-review';
import AsyncStorage from '@react-native-async-storage/async-storage';

const REVIEW_KEY = 'review_requested';

export async function requestReviewIfAppropriate(): Promise<void> {
  try {
    const hasRequested = await AsyncStorage.getItem(REVIEW_KEY);
    if (hasRequested) return;

    const isAvailable = await StoreReview.isAvailableAsync();
    if (isAvailable) {
      setTimeout(async () => {
        try {
          await StoreReview.requestReview();
          await AsyncStorage.setItem(REVIEW_KEY, 'true');
        } catch {}
      }, 2000);
    }
  } catch {}
}
