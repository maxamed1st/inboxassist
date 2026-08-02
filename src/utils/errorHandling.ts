export function ctxError(message: string, options?: { cause?: unknown, ctx?: Record<string, unknown>}) {
  const error = new Error(message, { cause: options?.cause })
  return Object.assign(error, { ctx: options?.ctx })
}
