import { spawn } from 'node:child_process'
import path from 'node:path'
import fs from 'node:fs'
import * as dotenv from 'dotenv'

import generateKey from '../lib/keyGenerator.js'

try {
  const [, , inputFilePath] = process.argv
  const normalizedFilePath = path.normalize(inputFilePath)

  if (!fs.existsSync(normalizedFilePath)) {
    fs.writeFileSync(normalizedFilePath, 'placeholder')
  }

  const { secretPhrase } = dotenv.config().parsed
  const { publicKey, privateKey } = generateKey(secretPhrase)

  const fileContent = fs.readFileSync(normalizedFilePath)

  const childProcess = spawn('node', ['./child.js'], { stdio: ['ipc'] })

  childProcess.send({ publicKey, fileName: normalizedFilePath, fileContent })

  childProcess.on('message', (message) => {
    console.log(Buffer.from(message.data).toString())
  })

  childProcess.stderr.on('error', (error) => {
    console.error(error)
  })
} catch (error) {
  console.error(error)
}
