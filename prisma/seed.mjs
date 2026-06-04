import { PrismaLibSql } from '@prisma/adapter-libsql'
import { getPrismaClientClass } from '../src/generated/prisma/client.ts'

// Use dynamic import to load the generated client
import('../src/generated/prisma/client.js').catch(() => {}).catch(() => {})

import bcryptjs from 'bcryptjs'
import { readFileSync } from 'fs'
import { createRequire } from 'module'

const require = createRequire(import.meta.url)
const { PrismaClient } = require('../src/generated/prisma/client.ts')
const bcrypt = require('bcryptjs')

const DB_PATH = process.env['DATABASE_URL'] ?? 'file:./prisma/dev.db'
const adapter = new PrismaLibSql({ url: DB_PATH })
const prisma = new PrismaClient({ adapter })
