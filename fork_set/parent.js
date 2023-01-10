import { fork } from 'node:child_process'
import crypto from 'node:crypto'
import path from 'node:path'
import fs from 'node:fs'
import dotenv from 'dotenv'

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

  console.time('Elapsed Time')

  const childProcess = fork('./child.js')

  childProcess.send({ publicKey, fileName: normalizedFilePath, fileContent })

  childProcess.on('message', (file) => {
    const encryptedFileName = Buffer.from(file.encryptedFileName.data)
    const encryptedContent = Buffer.from(file.encryptedContent.data)

    const decryptedFileName = crypto.privateDecrypt({
      key: privateKey, passphrase: secretPhrase,
    }, encryptedFileName).toString()
    const decryptedMessage = crypto.privateDecrypt({
      key: privateKey, passphrase: secretPhrase,
    }, encryptedContent).toString()

    if (path.basename(decryptedFileName) === path.basename(normalizedFilePath)) {
      if (decryptedMessage === fileContent.toString()) {
        console.timeEnd('Elapsed Time')
        console.log(`Memory Used: ${process.memoryUsage().heapUsed / 1048576} mb`)
        childProcess.kill('SIGKILL')
        process.exit(0)
      }
    }
  })

  childProcess.on('error', (error) => {
    console.error(error)
  })
} catch (error) {
  console.error(error)
}
