/**
 * API configuration for Expo React Native.
 *
 * IMPORTANT FOR DEPLOYMENT:
 * 1. Set EXPO_PUBLIC_API_URL in your local/EAS environment to your deployed backend API URL.
 *    Example: EXPO_PUBLIC_API_URL=https://scheme-check.onrender.com/api
 * 2. Do not use localhost or 127.0.0.1 for physical Android/iOS devices. On a phone,
 *    localhost points to the phone itself, not your laptop or EC2 instance.
 * 3. If you move behind a domain or load balancer later, update EXPO_PUBLIC_API_URL
 *    to something like https://api.yourdomain.com/api.
 */

const DEFAULT_API_URL = "https://scheme-check.onrender.com/api";

const normalizeApiUrl = (url: string) => url.trim().replace(/\/+$/, "");

const configuredApiUrl = process.env.EXPO_PUBLIC_API_URL;

export const API_URL = normalizeApiUrl(configuredApiUrl || DEFAULT_API_URL);
export const API_BASE_URL = API_URL.replace(/\/api$/, "");

if (__DEV__ && API_URL.includes("YOUR_EC2_PUBLIC_IP")) {
  console.warn(
    "EXPO_PUBLIC_API_URL is not configured. Update DEFAULT_API_URL in constants/config.ts temporarily, or set EXPO_PUBLIC_API_URL to your backend URL.",
  );
}
