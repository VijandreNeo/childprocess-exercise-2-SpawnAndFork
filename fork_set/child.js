import crypto from 'node:crypto'

process.on('message', (message) => {
  const { publicKey, fileName, fileContent } = message
  const encryptedContent = crypto.publicEncrypt(publicKey, Buffer.from(fileContent))
  const encryptedFileName = crypto.publicEncrypt(publicKey, Buffer.from(fileName))

  process.send({ encryptedFileName, encryptedContent })
})
