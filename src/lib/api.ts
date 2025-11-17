// Helper for making API requests with user email header
export async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const userEmail = localStorage.getItem('app_user')
    ? JSON.parse(localStorage.getItem('app_user')!).email
    : null

  const headers = {
    'Content-Type': 'application/json',
    ...(userEmail && { 'x-user-email': userEmail }),
    ...options.headers,
  }

  const response = await fetch(`/api/${endpoint}`, {
    ...options,
    headers,
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Request failed' }))
    throw new Error(error.error || `HTTP error! status: ${response.status}`)
  }

  return response.json()
}
