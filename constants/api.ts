import { API_URL } from "./config";

const DEFAULT_TIMEOUT_MS = 60000;

export class ApiError extends Error {
  status?: number;
  data?: unknown;

  constructor(message: string, status?: number, data?: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.data = data;
  }
}

type ApiFetchOptions = RequestInit & {
  timeoutMs?: number;
};

const buildUrl = (path: string) => {
  if (/^https?:\/\//i.test(path)) {
    return path;
  }

  return `${API_URL}${path.startsWith("/") ? path : `/${path}`}`;
};

const readResponseBody = async (response: Response) => {
  const text = await response.text();

  if (!text) {
    return null;
  }

  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
};

const getServerMessage = (data: unknown) => {
  if (data && typeof data === "object") {
    const body = data as { message?: unknown; error?: unknown };
    if (typeof body.message === "string") return body.message;
    if (typeof body.error === "string") return body.error;
  }

  return null;
};

export const apiFetch = async (path: string, options: ApiFetchOptions = {}) => {
  const { timeoutMs = DEFAULT_TIMEOUT_MS, headers, ...fetchOptions } = options;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await fetch(buildUrl(path), {
      ...fetchOptions,
      headers,
      signal: controller.signal,
    });
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      throw new ApiError(
        "Request timed out. Please check your connection and try again.",
      );
    }

    throw new ApiError(
      `Unable to reach the server. Check that your backend URL is correct and reachable from this device. Current API URL: ${API_URL}`,
    );
  } finally {
    clearTimeout(timeout);
  }
};

export const parseApiResponse = async <T>(response: Response): Promise<T> => {
  const data = await readResponseBody(response);

  if (!response.ok) {
    throw new ApiError(
      getServerMessage(data) || `Request failed with status ${response.status}`,
      response.status,
      data,
    );
  }

  return data as T;
};

export const getApiErrorMessage = (
  error: unknown,
  fallback = "Something went wrong. Please try again.",
) => {
  if (error instanceof ApiError || error instanceof Error) {
    return error.message || fallback;
  }

  return fallback;
};
