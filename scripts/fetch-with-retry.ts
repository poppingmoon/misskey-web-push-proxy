export async function fetchWithRetry(
  input: URL | Request | string,
  init?: RequestInit,
  options?: {
    retryAttempts?: number;
    maxRetries?: number;
    minDelay?: number;
    maxDelay?: number;
  },
): Promise<Response> {
  const response = await fetch(input, init);
  if (response.ok) {
    return response;
  }

  const retryOptions = {
    retryAttempts: 0,
    maxRetries: 4,
    minDelay: 1000,
    maxDelay: 60 * 1000,
    ...options,
  };

  if (
    retryOptions.retryAttempts <= retryOptions.maxRetries &&
    (response.status === 429 || response.status === 503)
  ) {
    const delay = getRetryDelay(response, retryOptions);
    if (delay <= retryOptions.maxDelay) {
      await new Promise((resolve) => setTimeout(resolve, delay));
      return fetchWithRetry(
        input,
        init,
        {
          ...retryOptions,
          retryAttempts: retryOptions.retryAttempts + 1,
        },
      );
    }
  }

  throw response;
}

function getRetryDelay(
  response: Response,
  options: {
    retryAttempts: number;
    minDelay: number;
    maxDelay: number;
  },
): number {
  const retryAfter = response.headers.get("retry-after");
  if (retryAfter !== null) {
    const delaySeconds = parseInt(retryAfter);
    if (!isNaN(delaySeconds)) {
      return delaySeconds * 1000;
    }
    const retryAt = new Date(retryAfter).getTime();
    if (!isNaN(retryAt)) {
      const delay = retryAt - Date.now();
      if (delay > 0) {
        return delay;
      }
    }
  }

  return Math.min(
    2 ** options.retryAttempts * options.minDelay * (1 + Math.random()),
    options.maxDelay,
  );
}
