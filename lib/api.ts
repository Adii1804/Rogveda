import { NextResponse } from 'next/server'

export function ok<T>(data: T, status = 200) {
  return NextResponse.json(data, { status })
}

export function err(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status })
}

export function validateFields(
  body: Record<string, unknown>,
  required: string[]
): string | null {
  for (const field of required) {
    if (!body[field] && body[field] !== 0) return `Missing required field: ${field}`
  }
  return null
}
