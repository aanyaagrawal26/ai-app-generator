import { z } from 'zod'
import type { Field } from '@/lib/config/schema'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function buildZodSchema(fields: Field[]): z.ZodObject<any> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const shape: Record<string, any> = {}

  for (const field of fields) {
    let schema: z.ZodTypeAny

    switch (field.type) {
      case 'email':
        schema = z.string().email(); break
      case 'url':
        schema = z.string().url(); break
      case 'number':
        schema = (() => {
          let s = z.coerce.number()
          if (field.validation?.min !== undefined) s = s.min(field.validation.min)
          if (field.validation?.max !== undefined) s = s.max(field.validation.max)
          return s
        })(); break
      case 'boolean':
        schema = z.boolean(); break
      case 'date': case 'datetime':
        schema = z.string(); break
      case 'select':
        schema = field.options?.length
          ? z.enum(field.options as [string, ...string[]])
          : z.string(); break
      case 'multiselect':
        schema = field.options?.length
          ? z.array(z.enum(field.options as [string, ...string[]]))
          : z.array(z.string()); break
      case 'json':
        schema = z.record(z.string(), z.unknown()); break
      default:
        schema = field.validation?.pattern
          ? z.string().regex(new RegExp(field.validation.pattern))
          : z.string()
    }

    if (!field.required) schema = schema.optional()
    if (field.defaultValue !== undefined) {
      const dv = field.defaultValue
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      schema = (schema as any).default(() => dv)
    }
    shape[field.name] = schema
  }

  return z.object(shape)
}
