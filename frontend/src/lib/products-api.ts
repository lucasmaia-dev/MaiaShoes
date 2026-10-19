export type Product = {
  id: number;
  name: string;
  description: string | null;
  imageUrl: string | null;
  price: string;
  createdAt: string;
  updatedAt: string;
};

export type NewProduct = Pick<Product, 'name' | 'price'> & { description?: string; imageUrl?: string | null };

async function requestProducts<T>(options: RequestInit = {}, path = '/api/products'): Promise<T> {
  let response: Response;
  try {
    const timeout = AbortSignal.timeout(10000);
    response = await fetch(path, {
      ...options,
      cache: 'no-store',
      signal: options.signal ? AbortSignal.any([options.signal, timeout]) : timeout,
    });
  } catch {
    throw new Error('Não foi possível acessar a API. Confira se o back-end está rodando e tente novamente.');
  }

  if (!response.ok) {
    if (response.status === 400) {
      const error = await response.json().catch(() => null);
      if (Array.isArray(error?.message) && error.message.every((item: unknown) => typeof item === 'string')) {
        throw new Error(error.message.join(' '));
      }
    }
    throw new Error('Não foi possível concluir a solicitação. Confira o back-end e tente novamente.');
  }
  return response.json();
}

export function updateProductImage(id: number, imageUrl: string | null) {
  return requestProducts<Product>({
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ imageUrl }),
  }, `/api/products/${id}/image`);
}

export function listProducts(signal?: AbortSignal) {
  return requestProducts<Product[]>({ signal });
}

export function createProduct(product: NewProduct) {
  return requestProducts<Product>({
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(product),
  });
}
