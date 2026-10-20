import type { ProductCategory } from './product-categories';

export type Product = {
  id: number;
  name: string;
  description: string | null;
  imageUrl: string | null;
  imageUrls: string[];
  category: ProductCategory;
  price: string;
  createdAt: string;
  updatedAt: string;
};

export type NewProduct = Pick<Product, 'name' | 'price' | 'category'> & { description?: string; imageUrl?: string | null };

async function requestProducts<T>(options: RequestInit = {}, path = '/api/products'): Promise<T> {
  let response: Response;
  try {
    const timeout = AbortSignal.timeout(10000);
    response = await fetch(path, {
      ...options,
      headers: { 'X-MaiaShoes-Request': '1', ...options.headers },
      cache: 'no-store',
      signal: options.signal ? AbortSignal.any([options.signal, timeout]) : timeout,
    });
  } catch {
    throw new Error('Não foi possível acessar a API. Confira se o back-end está rodando e tente novamente.');
  }

  if (!response.ok) {
    if (response.status === 401) throw new Error('Sua sessão expirou. Entre novamente para continuar.');
    if (response.status === 403) throw new Error('Você não tem permissão para alterar os produtos.');
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

export function updateProductCategory(id: number, category: ProductCategory) {
  return requestProducts<Product>({
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ category }),
  }, `/api/products/${id}/category`);
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
