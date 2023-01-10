import { fork } from 'node:child_process'
import crypto from 'node:crypto'
import path from 'node:path'
import fs from 'node:fs'
import dotenv from 'dotenv'

import generateKey from '../lib/keyGenerator.js'

console.time('Elapsed Time')
try {
  const [, , inputFilePath] = process.argv
  const normalizedFilePath = path.normalize(inputFilePath)

  if (!fs.existsSync(normalizedFilePath)) {
    fs.writeFileSync(normalizedFilePath, 'placeholder')
  }

  const { secretPhrase } = dotenv.config().parsed
  const { publicKey, privateKey } = generateKey(secretPhrase)
  const fileContent = fs.readFileSync(normalizedFilePath)
  const childProcess = fork('./child.js')

  childProcess.send({ publicKey, fileName: normalizedFilePath, fileContent })

  childProcess.on('message', (file) => {
    const encryptedFileName = Buffer.from(file.encryptedFileName.data)
    const encryptedContent = Buffer.from(file.encryptedContent.data)

    const decryptedFileName = crypto.privateDecrypt({
      key: privateKey, passphrase: secretPhrase,
    }, encryptedFileName).toString()
    const decryptedContent = crypto.privateDecrypt({
      key: privateKey, passphrase: secretPhrase,
    }, encryptedContent).toString()

    if (path.basename(decryptedFileName) === path.basename(normalizedFilePath)) {
      if (decryptedContent === fileContent.toString()) {
        console.log(`Memory Used: ${process.memoryUsage().external} mb`)
        childProcess.kill('SIGKILL')
      }
    }
  })

  childProcess.stderr.on('error', (error) => {
    console.error(error)
  })
} catch (error) {
  console.error(error)
}
console.timeEnd('Elapsed Time')
