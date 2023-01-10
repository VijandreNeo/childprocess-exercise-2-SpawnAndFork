import crypto from 'node:crypto'

process.on('message', (message) => {
  try {
    const { publicKey, fileName, fileContent } = message
    const encryptedContent = crypto.publicEncrypt(publicKey, Buffer.from(fileContent))
    const encryptedFileName = crypto.publicEncrypt(publicKey, Buffer.from(fileName))

    process.send({ encryptedFileName, encryptedContent })
  } catch (error) {
    console.error(error)
  }
})

process.on('error', (error) => {
  console.error(error)
})
