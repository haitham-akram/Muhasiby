export async function fetcher<JSON = any>(
  input: RequestInfo,
  init?: RequestInit
): Promise<JSON> {
  const res = await fetch(input, init)

  if (!res.ok) {
    const error = new Error('An error occurred while fetching the data.')
    // Attach extra info to the error object.
    const info = await res.json().catch(() => ({}))
    ;(error as any).info = info
    ;(error as any).status = res.status
    throw error
  }

  return res.json()
}
