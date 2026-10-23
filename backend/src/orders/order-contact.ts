import { ServiceUnavailableException } from '@nestjs/common';

export function storeWhatsapp() {
  const phone = (process.env.STORE_WHATSAPP ?? '').replace(/[\s()+-]/g, '');
  return /^55[1-9]\d{9,10}$/.test(phone) ? phone : null;
}

export function requireOrderContact() {
  const phone = storeWhatsapp();
  if (!phone)
    throw new ServiceUnavailableException(
      'O atendimento pelo WhatsApp está sendo configurado. Tente novamente mais tarde.',
    );
  return phone;
}

// Taxa única por pedido, incluída no mesmo Pix quando o cliente escolhe entrega.
export const OWN_DELIVERY_FEE_CENTS = 1500;
