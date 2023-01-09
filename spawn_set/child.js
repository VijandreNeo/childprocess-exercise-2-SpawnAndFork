import crypto from 'node:crypto'

process.on('message', (message) => {
  const { publicKey, fileName, fileContent } = message

  process.send(crypto.publicEncrypt(publicKey, Buffer.from(fileContent)))
})

process.on('SIGHUP', () => {
  console.log('received signal')
  process.exit(0)
})
