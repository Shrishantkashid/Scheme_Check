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

import { Platform, NativeModules } from "react-native";

const DEFAULT_API_URL = "https://scheme-check.onrender.com/api";

const normalizeApiUrl = (url: string) => url.trim().replace(/\/+$/, "");

let configuredApiUrl = process.env.EXPO_PUBLIC_API_URL;

// Dynamically determine the backend IP during development if a local IP is configured
if (__DEV__) {
  const isLocalEnvUrl =
    !configuredApiUrl ||
    configuredApiUrl.includes("localhost") ||
    configuredApiUrl.includes("127.0.0.1") ||
    /http:\/\/(192\.168\.|10\.|172\.)/.test(configuredApiUrl);

  if (isLocalEnvUrl) {
    if (Platform.OS === "web") {
      configuredApiUrl = "http://localhost:5000/api";
    } else {
      const scriptURL = NativeModules.SourceCode?.scriptURL;
      if (scriptURL) {
        const match = scriptURL.match(/https?:\/\/([^:]+)/);
        if (match && match[1]) {
          const packagerIp = match[1];
          // Use the packager IP to hit the local backend
          configuredApiUrl = `http://${packagerIp}:5000/api`;
        }
      }
    }
  }
}

export const API_URL = normalizeApiUrl(configuredApiUrl || DEFAULT_API_URL);
export const API_BASE_URL = API_URL.replace(/\/api$/, "");
