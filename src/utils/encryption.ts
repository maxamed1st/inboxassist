import crypto from "crypto"

// get secret key
function getEncryptionKey() {
  const key = process.env.ENCRYPTION_KEY;

  if(!key) {
    throw new Error("Missing encryption key");
  }

  return Buffer.from(key, "hex");
}

const key = getEncryptionKey();

// Encrypt data
export function encrypt(text: string) {
  // Generate a random initialization vector
  const iv = crypto.randomBytes(16);
  
  // Create cipher
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  
  // Encrypt the data
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  
  // Get the auth tag for authentication
  const authTag = cipher.getAuthTag();
  
  // Return iv, encrypted data, and auth tag
  const encryptedObject = {
    iv: iv.toString('hex'),
    encryptedData: encrypted,
    authTag: authTag.toString('hex')
  };

  return `${encryptedObject.iv}:${encryptedObject.authTag}:${encryptedObject.encryptedData}`
}

// Decrypt data
export function decrypt(encryptedString: string) {
  const parts = encryptedString.split(":")
  const [ iv, authTag, encryptedData ] = parts;

  if (!iv || !authTag || !encryptedData) {
    throw new Error("Wrong format for encrypted data");
  }

  // Create decipher
  const decipher = crypto.createDecipheriv(
    'aes-256-gcm',
    key,
    Buffer.from(iv, 'hex')
  );
  
  // Set the auth tag
  decipher.setAuthTag(Buffer.from(authTag, 'hex'));
  
  // Decrypt the data
  let decrypted = decipher.update(encryptedData, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  
  return decrypted;
}
