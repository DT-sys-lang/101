import Image, { type ImageProps } from 'next/image'

const imageLoadingPlaceholder = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 10"%3E%3Cdefs%3E%3ClinearGradient id="g" x1="0" y1="0" x2="1" y2="1"%3E%3Cstop stop-color="%23F2F4F6"/%3E%3Cstop offset="1" stop-color="%23DDE4EA"/%3E%3C/linearGradient%3E%3C/defs%3E%3Crect width="16" height="10" fill="url(%23g)"/%3E%3C/svg%3E' as const

function shouldServeDirectly(src: ImageProps['src']) {
  return typeof src === 'string' && (
    src.startsWith('/images/home/')
    || src.startsWith('/images/site/')
    || src.startsWith('/images/brand/')
  )
}

export function OptimizedImage({
  decoding = 'async',
  placeholder = imageLoadingPlaceholder,
  unoptimized,
  ...props
}: ImageProps) {
  return (
    <Image
      decoding={decoding}
      placeholder={placeholder}
      unoptimized={unoptimized ?? shouldServeDirectly(props.src)}
      {...props}
    />
  )
}
