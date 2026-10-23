import { ServiceUnavailableException } from '@nestjs/common';

function field(id: string, value: string) {
  const length = Buffer.byteLength(value, 'utf8');
  if (length > 99) throw new Error('Campo Pix muito longo.');
  return id + length.toString().padStart(2, '0') + value;
}

export function crc16(value: string) {
  let crc = 0xffff;
  for (const byte of Buffer.from(value, 'utf8')) {
    crc ^= byte << 8;
    for (let bit = 0; bit < 8; bit++) {
      crc = ((crc << 1) ^ (crc & 0x8000 ? 0x1021 : 0)) & 0xffff;
    }
  }
  return crc.toString(16).toUpperCase().padStart(4, '0');
}

function normalized(value: string, max: number) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toUpperCase()
    .replace(/[^A-Z0-9 ]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, max);
}

export function pixConfig() {
  const key = process.env.PIX_KEY?.trim() ?? '';
  const receiver = process.env.PIX_RECEIVER?.trim() ?? '';
  const city = normalized(process.env.PIX_CITY ?? '', 15);
  const name = normalized(receiver, 25);
  const validKey =
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(key) ||
    /^\+55\d{10,11}$/.test(key) ||
    /^\d{11}$|^\d{14}$/.test(key) ||
    /^[a-f0-9]{8}(-[a-f0-9]{4}){3}-[a-f0-9]{12}$/i.test(key);
  if (!validKey || Buffer.byteLength(key) > 77 || !name || !city) {
    throw new ServiceUnavailableException(
      'O Pix está sendo configurado. Tente novamente mais tarde.',
    );
  }
  return { key, receiver, name, city };
}

export function createPixPayload(
  config: ReturnType<typeof pixConfig>,
  cents: number,
  txid: string,
) {
  if (
    !Number.isSafeInteger(cents) ||
    cents <= 0 ||
    cents > 999999999 ||
    !/^[a-zA-Z0-9]{1,25}$/.test(txid)
  ) {
    throw new Error('Valor ou referência Pix inválida.');
  }
  const payload =
    field('00', '01') +
    field('26', field('00', 'br.gov.bcb.pix') + field('01', config.key)) +
    field('52', '0000') +
    field('53', '986') +
    field('54', (cents / 100).toFixed(2)) +
    field('58', 'BR') +
    field('59', config.name) +
    field('60', config.city) +
    field('62', field('05', txid)) +
    '6304';
  return payload + crc16(payload);
}
