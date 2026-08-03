export async function fetcher<JSON = unknown>(
  input: RequestInfo,
  init?: RequestInit
): Promise<JSON> {
  const res = await fetch(input, init)

  if (!res.ok) {
    const error = new Error('An error occurred while fetching the data.') as Error & { info: unknown; status: number }
    // Attach extra info to the error object.
    const info = await res.json().catch(() => ({}))
    error.info = info
    error.status = res.status
    throw error
  }

  return res.json()
}
