import { createCipheriv, createDecipheriv, createHash, randomBytes } from 'node:crypto'
import { DomainError } from '@war-ticket/domain'

const FORMAT_VERSION = 1
const IV_LENGTH = 12
const TAG_LENGTH = 16

function deriveKey(secret: string): Buffer {
  return createHash('sha256').update(secret, 'utf8').digest()
}

export class EnvelopeCipher {
  private readonly key: Buffer

  constructor(secret: string) {
    if (secret.length < 32) {
      throw new DomainError('VALIDATION_ERROR', 'Encryption key must contain at least 32 characters')
    }
    this.key = deriveKey(secret)
  }

  encrypt(plaintext: string): Buffer {
    const iv = randomBytes(IV_LENGTH)
    const cipher = createCipheriv('aes-256-gcm', this.key, iv)
    const ciphertext = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()])
    const tag = cipher.getAuthTag()
    return Buffer.concat([Buffer.from([FORMAT_VERSION]), iv, tag, ciphertext])
  }

  decrypt(payload: Uint8Array): string {
    const buffer = Buffer.from(payload)
    if (buffer.length < 1 + IV_LENGTH + TAG_LENGTH || buffer[0] !== FORMAT_VERSION) {
      throw new DomainError('CONFLICT', 'Encrypted payload format is invalid')
    }
    const ivStart = 1
    const tagStart = ivStart + IV_LENGTH
    const ciphertextStart = tagStart + TAG_LENGTH
    const decipher = createDecipheriv(
      'aes-256-gcm',
      this.key,
      buffer.subarray(ivStart, tagStart),
    )
    decipher.setAuthTag(buffer.subarray(tagStart, ciphertextStart))
    try {
      return Buffer.concat([
        decipher.update(buffer.subarray(ciphertextStart)),
        decipher.final(),
      ]).toString('utf8')
    } catch (error) {
      throw new DomainError('CONFLICT', 'Encrypted payload could not be authenticated', {
        cause: error,
      })
    }
  }
}
