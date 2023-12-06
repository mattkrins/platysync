import keytar from 'keytar';
import crypto from 'crypto';

const algorithm = 'aes-256-ctr';
// todo: unify functions
export const encrypt = (text, key) => {
    return new Promise((resolve, reject) => {
        try{
            let hash = key;
            if (key.password) {
                const salt = crypto.randomBytes(16).toString('hex');
                hash = crypto.pbkdf2Sync(key.password, salt, 1000, 64, `sha512`).toString(`hex`)
            }
            const iv = crypto.randomBytes(16);
            const cipher = crypto.createCipheriv(algorithm, hash, iv);
            const encrypted = Buffer.concat([cipher.update(text), cipher.final()]);
            resolve({ iv: iv.toString('hex'), content: encrypted.toString('hex') });
        } catch(e) { reject(e); }
    });
};

export const decrypt = (hash, key) => {
    return new Promise((resolve, reject) => {
        try{
            if (typeof(hash)==="string") hash = JSON.parse(hash);
            const decipher = crypto.createDecipheriv(algorithm, key, Buffer.from(hash.iv, 'hex'));
            const decrpyted = Buffer.concat([decipher.update(Buffer.from(hash.content, 'hex')), decipher.final()]);
            resolve(decrpyted.toString());
        } catch(e) { reject(e); }
    });
};

export const getKey = () => {
    return new Promise((resolve, reject) => {
        try{
            const regenerate = () => {
                const key = crypto.randomBytes(16).toString('hex');
                keytar.setPassword('ldap-provisioner', "auth", key);
                return key;
            }
            keytar.getPassword("ldap-provisioner", "auth").then((key) => {
                resolve(key || regenerate());
            });
        } catch(e) { reject(e); }
    });
};

function salt(key) {
  return new Promise((resolve, reject) => {
    crypto.pbkdf2(key, 'salt', 100000, 32, 'sha512', (err, derivedKey) => {
      if (err) reject(err);
      else resolve(derivedKey);
    });
  });
}

export async function encryptStr(text, key) {
  const derivedKey = await salt(key);
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv('aes-256-cbc', derivedKey, iv);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return { encrypted, iv: iv.toString('hex') };
}

export async function decryptStr(hash, key) {
  const derivedKey = await salt(key);
  const decipher = crypto.createDecipheriv('aes-256-cbc', derivedKey, Buffer.from(hash.iv, 'hex'));
  decipher.setAutoPadding(true);
  let decrypted = decipher.update(hash.encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}