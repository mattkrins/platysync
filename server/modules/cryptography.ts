import crypto from 'crypto';
import database from '../components/database';

export interface Hash {
    hex: string;
    iv: string;
    it: number;
}

function salt(key: string, iterationCount = 100000): Buffer {
    return crypto.pbkdf2Sync(key, 'salt', iterationCount, 32, 'sha512');
}

export async function Encrypt(secret: string, key: string, strength = 100000) {
    const derivedKey = salt(key, strength);
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv('aes-256-cbc', derivedKey, iv);
    let hex = cipher.update(secret, 'utf8', 'hex');
    hex += cipher.final('hex');
    return { hex, iv: iv.toString('hex'), it: strength };
}

export async function Decrypt(hash: Hash, key: string, strength = 100000): Promise<string> {
  try {
    const derivedKey = salt(key, hash.it||strength);
    const decipher = crypto.createDecipheriv('aes-256-cbc', derivedKey, Buffer.from(hash.iv, 'hex'));
    decipher.setAutoPadding(true);
    let decrypted = decipher.update(hash.hex, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  } catch (e) {
    if (String((e as {message: string}).message).includes("bad decrypt")) throw Error("Bad decrypt: Encryption key incorrect/compromised.");
    throw Error(e as string);
  }
}

export async function getKey() {
    if (process.env.PSYC_KEY) return process.env.PSYC_KEY;
    const db = await database();
    const { data: { settings } } = db;
    if (settings.key) return settings.key;
    settings.key = crypto.randomBytes(16).toString('hex');
    await db.write();
    return settings.key;
}

export async function encrypt(secret: string): Promise<Hash> {
    return await Encrypt(secret, await getKey());
}

export async function decrypt(hash: Hash): Promise<string> {
    return await Decrypt(hash, await getKey());
}