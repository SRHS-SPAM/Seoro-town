import { config } from '../constants/config';

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

export interface ApiRequestOptions<TBody = unknown> {
  method?: HttpMethod;
  body?: TBody;
  token?: string | null;
  headers?: Record<string, string>;
}

export interface ApiResponse<T> {
  data: T;
  status: number;
}

async function buildHeaders(
  token?: string | null,
  customHeaders?: Record<string, string>
): Promise<Record<string, string>> {
  const baseHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
    ...customHeaders,
  };

  if (token) {
    baseHeaders.Authorization = `Bearer ${token}`;
  }

  return baseHeaders;
}

export async function apiFetch<TResponse = unknown, TBody = unknown>(
  path: string,
  options: ApiRequestOptions<TBody> = {}
): Promise<ApiResponse<TResponse>> {
  const { method = 'GET', body, token, headers } = options;
  const url = `${config.apiBaseUrl}${path}`;

  const response = await fetch(url, {
    method,
    headers: await buildHeaders(token, headers),
    body: body ? JSON.stringify(body) : undefined,
  });

  let data: TResponse;
  try {
    data = (await response.json()) as TResponse;
  } catch {
    data = {} as TResponse;
  }

  if (!response.ok) {
    const error = new Error('API 요청이 실패했습니다.');
    (error as any).status = response.status;
    (error as any).data = data;
    throw error;
  }

  return {
    data,
    status: response.status,
  };
}

