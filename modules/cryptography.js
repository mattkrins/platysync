import crypto from 'crypto';
import { keyring } from "@zowe/secrets-for-zowe-sdk";
function salt(key) {
    return new Promise((resolve, reject) => {
        crypto.pbkdf2(key, 'salt', 100000, 32, 'sha512', (err, derivedKey) => {
            if (err)
                reject(err);
            else
                resolve(derivedKey);
        });
    });
}
export let key;
async function regenerate(force = false) {
    const saved = await keyring.getPassword("cdapp", "key");
    if (saved && !force) {
        key = saved;
    }
    else {
        const random = crypto.randomBytes(16).toString('hex');
        await keyring.setPassword("cdapp", "key", random);
        key = random;
    }
    return key;
}
export async function encrypt(secret) {
    if (!key)
        await regenerate();
    const derivedKey = await salt(key);
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv('aes-256-cbc', derivedKey, iv);
    let encrypted = cipher.update(secret, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return { encrypted, iv: iv.toString('hex') };
}
export async function decrypt(hash) {
    if (!key)
        await regenerate();
    try {
        const derivedKey = await salt(key);
        const decipher = crypto.createDecipheriv('aes-256-cbc', derivedKey, Buffer.from(hash.iv, 'hex'));
        decipher.setAutoPadding(true);
        let decrypted = decipher.update(hash.encrypted, 'hex', 'utf8');
        decrypted += decipher.final('utf8');
        return decrypted;
    }
    catch (e) {
        // Assume CredMan altered if decrypt fails and pull new key:
        if (String(e.message).includes("bad decrypt"))
            await regenerate();
        throw Error(e);
    }
}
