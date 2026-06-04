import 'server-only'
import Papa from 'papaparse'
import { prisma } from '@/lib/db/prisma'
import { buildZodSchema } from '@/lib/runtime/schemaBuilder'
import type { Field } from '@/lib/config/schema'

export interface ImportResult {
  processedRows: number
  failedRows:    number
  errors:        Array<{ row: number; message: string }>
}

export async function processCSV(
  jobId:         string,
  appId:         string,
  resourceName:  string,
  csvText:       string,
  columnMapping: Record<string, string>,
  fields:        Field[]
): Promise<ImportResult> {
  await prisma.importJob.update({
    where: { id: jobId },
    data:  { status: 'PROCESSING', startedAt: new Date() },
  })

  const parsed = Papa.parse<Record<string, string>>(csvText, { header: true, skipEmptyLines: true })
  const totalRows = parsed.data.length
  await prisma.importJob.update({ where: { id: jobId }, data: { totalRows } })

  const zodSchema = buildZodSchema(fields).partial()
  const errors: Array<{ row: number; message: string }> = []
  let processedRows = 0
  let failedRows = 0
  const validRows: Record<string, unknown>[] = []
  const CHUNK = 500

  for (let i = 0; i < parsed.data.length; i++) {
    const csvRow = parsed.data[i]
    const mapped: Record<string, unknown> = {}
    for (const [csvCol, fieldName] of Object.entries(columnMapping)) {
      if (fieldName) mapped[fieldName] = csvRow[csvCol]
    }

    const result = zodSchema.safeParse(mapped)
    if (result.success) {
      validRows.push(result.data as Record<string, unknown>)
    } else {
      failedRows++
      errors.push({ row: i + 1, message: result.error.issues.map(e => `${e.path.join('.')}: ${e.message}`).join('; ') })
    }

    if (validRows.length >= CHUNK) {
      await bulkInsert(appId, resourceName, validRows)
      processedRows += validRows.length
      validRows.length = 0
      await prisma.importJob.update({ where: { id: jobId }, data: { processedRows, failedRows } })
    }
  }

  if (validRows.length > 0) {
    await bulkInsert(appId, resourceName, validRows)
    processedRows += validRows.length
  }

  const finalStatus = failedRows === totalRows && totalRows > 0 ? 'FAILED' : 'COMPLETED'
  await prisma.importJob.update({
    where: { id: jobId },
    data:  { status: finalStatus, processedRows, failedRows, errors: errors.length > 0 ? JSON.stringify(errors) : null, completedAt: new Date() },
  })

  return { processedRows, failedRows, errors }
}

async function bulkInsert(appId: string, resourceName: string, rows: Record<string, unknown>[]) {
  for (const data of rows) {
    await prisma.dynamicRecord.create({
      data: { appId, resourceName, data: JSON.stringify(data), createdBy: 'csv-import' },
    })
  }
}
