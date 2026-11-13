export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export class ApiContractError extends Error {
  constructor(public readonly detail: string) {
    super('Сервис вернул данные в неподдерживаемом формате.');
    this.name = 'ApiContractError';
  }
}

export type ApiOptions = { baseUrl?: string; fetcher?: typeof fetch };

export class CatalogStorageError extends Error {
  constructor() {
    super(
      'Не удалось сохранить данные в браузере. Проверьте, разрешено ли хранилище для этого сайта.',
    );
    this.name = 'CatalogStorageError';
  }
}

export function createJsonClient({ baseUrl = '', fetcher = fetch }: ApiOptions = {}) {
  const base = baseUrl.replace(/\/$/, '');
  return async function request(path: string, init: RequestInit = {}): Promise<unknown> {
    const headers = new Headers(init.headers);
    headers.set('Accept', 'application/json');
    if (init.body !== undefined) headers.set('Content-Type', 'application/json');
    const response = await fetcher(`${base}${path}`, {
      ...init,
      headers,
      credentials: 'include',
      cache: 'no-store',
    });
    const text = response.status === 204 ? '' : await response.text();
    let body: unknown;
    try {
      body = text ? JSON.parse(text) : undefined;
    } catch {
      if (response.ok) throw new ApiContractError(`${path}: expected JSON`);
    }
    if (!response.ok) {
      const message =
        body && typeof body === 'object' && 'error' in body && typeof body.error === 'string'
          ? body.error
          : response.status === 401
            ? 'Войдите в аккаунт, чтобы продолжить.'
            : 'Не удалось выполнить запрос. Попробуйте ещё раз.';
      throw new ApiError(response.status, message);
    }
    return body;
  };
}

export function isUnauthorized(error: unknown) {
  return error instanceof ApiError && error.status === 401;
}

export function errorMessage(error: unknown) {
  return error instanceof ApiError ||
    error instanceof ApiContractError ||
    error instanceof CatalogStorageError
    ? error.message
    : 'Не удалось связаться с сервисом. Попробуйте ещё раз.';
}
