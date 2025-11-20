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

// 이미지 업로드를 위한 별도 함수
export async function apiUploadImage<TResponse = unknown>(
  path: string,
  imageUri: string,
  fields: Record<string, string>,
  token?: string | null
): Promise<ApiResponse<TResponse>> {
  const url = `${config.apiBaseUrl}${path}`;
  const formData = new FormData();

  // 이미지 파일 추가
  const filename = imageUri.split('/').pop() || 'image.jpg';
  const match = /\.(\w+)$/.exec(filename);
  const type = match ? `image/${match[1]}` : 'image/jpeg';
  
  formData.append('image', {
    uri: imageUri,
    name: filename,
    type,
  } as any);

  // 다른 필드들 추가
  Object.keys(fields).forEach(key => {
    formData.append(key, fields[key]);
  });

  const headers: Record<string, string> = {};
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(url, {
    method: 'POST',
    headers,
    body: formData,
  });

  let data: TResponse;
  try {
    data = (await response.json()) as TResponse;
  } catch {
    data = {} as TResponse;
  }

  if (!response.ok) {
    const error = new Error('이미지 업로드가 실패했습니다.');
    (error as any).status = response.status;
    (error as any).data = data;
    throw error;
  }

  return {
    data,
    status: response.status,
  };
}

// 이미지 수정을 위한 별도 함수
export async function apiUpdateWithImage<TResponse = unknown>(
  path: string,
  imageUri: string | null,
  fields: Record<string, string>,
  token?: string | null
): Promise<ApiResponse<TResponse>> {
  const url = `${config.apiBaseUrl}${path}`;
  const formData = new FormData();

  // 이미지가 있으면 추가
  if (imageUri) {
    const filename = imageUri.split('/').pop() || 'image.jpg';
    const match = /\.(\w+)$/.exec(filename);
    const type = match ? `image/${match[1]}` : 'image/jpeg';
    
    formData.append('image', {
      uri: imageUri,
      name: filename,
      type,
    } as any);
  }

  // 다른 필드들 추가
  Object.keys(fields).forEach(key => {
    formData.append(key, fields[key]);
  });

  const headers: Record<string, string> = {};
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(url, {
    method: 'PUT',
    headers,
    body: formData,
  });

  let data: TResponse;
  try {
    data = (await response.json()) as TResponse;
  } catch {
    data = {} as TResponse;
  }

  if (!response.ok) {
    const error = new Error('상품 수정이 실패했습니다.');
    (error as any).status = response.status;
    (error as any).data = data;
    throw error;
  }

  return {
    data,
    status: response.status,
  };
}

