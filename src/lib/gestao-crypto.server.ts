import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto";

function chave(): Buffer {
  const raw = process.env["GESTAO_CRYPTO_KEY"];
  if (!raw) throw new Error("GESTAO_CRYPTO_KEY não configurada.");
  return createHash("sha256").update(raw).digest();
}

export function cifrar(texto: string): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", chave(), iv);
  const ct = Buffer.concat([cipher.update(texto, "utf8"), cipher.final()]);
  return Buffer.concat([iv, cipher.getAuthTag(), ct]).toString("base64");
}

export function decifrar(armazenado: string): string {
  const buf = Buffer.from(armazenado, "base64");
  const iv = buf.subarray(0, 12);
  const tag = buf.subarray(12, 28);
  const ct = buf.subarray(28);
  const decipher = createDecipheriv("aes-256-gcm", chave(), iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(ct), decipher.final()]).toString("utf8");
}

export function mascarar(valor: string | null): string | null {
  if (!valor) return null;
  const fim = valor.slice(-4);
  return `••••••••${fim}`;
}
