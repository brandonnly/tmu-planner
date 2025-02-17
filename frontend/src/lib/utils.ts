import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export async function getCachedImage(url: string, cacheKey: string) {
  const cache = await caches.open('tmu-planner-images')
  let cachedResponse = await cache.match(url)

  const fetchAndCache = async () => {
    try {
      const response = await fetch(url)
      if (!response.ok) throw new Error('Failed to fetch image')
      // Store the response in cache
      await cache.put(url, response.clone())
      return response
    } catch (error) {
      console.error('Error fetching image:', error)
      // If we have a cached response, use it even if it's old
      if (cachedResponse) return cachedResponse
      throw error
    }
  }

  try {
    // If no cache or cached response is invalid, fetch again
    if (!cachedResponse || !cachedResponse.ok) {
      cachedResponse = await fetchAndCache()
    }

    // Get the image data as a blob and create an object URL
    const blob = await cachedResponse.blob()
    return URL.createObjectURL(blob)
  } catch (error) {
    console.error('Failed to get cached image:', error)
    return url
  }
}

// Clean up object URLs when they're no longer needed
export function revokeObjectURL(url: string) {
  if (url.startsWith('blob:')) {
    URL.revokeObjectURL(url)
  }
}
