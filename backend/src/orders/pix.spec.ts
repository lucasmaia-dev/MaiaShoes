import { createPixPayload, crc16, pixConfig } from './pix.js';

describe('Pix estático BR Code', () => {
  afterEach(() => vi.unstubAllEnvs());
  it('calcula o CRC16-CCITT conhecido', () => {
    expect(crc16('123456789')).toBe('29B1');
  });
  it('gera campos com valor em centavos e referência do pedido', () => {
    const payload = createPixPayload(
      {
        key: 'loja@example.com',
        receiver: 'Loja Teste',
        name: 'LOJA TESTE',
        city: 'ANAPOLIS',
      },
      20001,
      'PEDIDO123',
    );
    expect(payload).toContain('5406200.01');
    expect(payload).toContain('5910LOJA TESTE');
    expect(payload).toContain('6008ANAPOLIS');
    expect(payload).toContain('0509PEDIDO123');
    expect(payload.slice(-4)).toBe(crc16(payload.slice(0, -4)));
  });
  it.each([0, -1, 1.2, NaN, 1000000000])(
    'rejeita valor inválido %s',
    (cents) => {
      expect(() =>
        createPixPayload(
          {
            key: 'a@b.com',
            receiver: 'Teste',
            name: 'TESTE',
            city: 'ANAPOLIS',
          },
          cents,
          'PEDIDO',
        ),
      ).toThrow();
    },
  );
  it('não libera pagamento sem configuração e normaliza acentos', () => {
    vi.stubEnv('PIX_KEY', '');
    expect(() => pixConfig()).toThrow();
    vi.stubEnv('PIX_KEY', 'loja@example.com');
    vi.stubEnv('PIX_RECEIVER', 'Lója de Teste');
    vi.stubEnv('PIX_CITY', 'Anápolis');
    expect(pixConfig()).toMatchObject({
      name: 'LOJA DE TESTE',
      city: 'ANAPOLIS',
    });
  });
});
