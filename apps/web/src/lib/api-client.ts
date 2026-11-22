const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

interface ApiRequestOptions extends RequestInit {
  accessToken?: string;
}

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

export async function apiRequest<T>(endpoint: string, options: ApiRequestOptions = {}): Promise<T> {
  const { accessToken, headers, ...requestOptions } = options;

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...requestOptions,
    credentials: 'include',
    headers: {
      ...(requestOptions.body ? { 'Content-Type': 'application/json' } : {}),
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
      ...headers,
    },
  });

  const responseData = await response.json().catch(() => null);

  if (!response.ok) {
    throw new ApiError(responseData?.message ?? 'Something went wrong', response.status);
  }

  return responseData;
}
