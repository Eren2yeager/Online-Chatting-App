export async function apiRequest(path, { method = 'GET', body, headers } = {}) {
  const init = {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(headers || {})
    },
    ...(body !== undefined ? { body: JSON.stringify(body) } : {})
  };

  const res = await fetch(path, init);
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const message = data?.error || `Request failed (${res.status})`;
    const err = new Error(message);
    err.status = res.status;
    err.data = data;
    throw err;
  }
  return data;
}


