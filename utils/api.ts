import { APIRequestContext, expect } from '@playwright/test';
import { b64EncodeUnicode } from './password';

/** Base URL of the DemoBlaze REST API (from the site's config.json). */
export const API_URL = 'https://api.demoblaze.com';

export type Category = 'phone' | 'notebook' | 'monitor';

export interface Product {
  id: number;
  title: string;
  /** Numeric price, e.g. 360 (the UI renders it as "$360"). */
  price: number;
  desc: string;
  img: string;
  /** Present on catalog responses only. */
  cat?: Category;
}

export interface PagedProducts {
  Items: Product[];
  /** Present on paginated responses only (the catalog has 15 products: 9 + 6). */
  ScannedCount?: number;
  LastEvaluatedKey?: { id: string };
}

export interface CartEntry {
  id: string;
  prod_id: number;
  cookie?: string;
  flag?: boolean;
}

/** Mirrors the app's `guid()` helper used for cart entry ids. */
function guid(): string {
  const s4 = () => Math.floor((1 + Math.random()) * 0x10000).toString(16).substring(1);
  return `${s4()}${s4()}-${s4()}-${s4()}-${s4()}-${s4()}${s4()}${s4()}`;
}

/**
 * Typed client for https://api.demoblaze.com.
 * All endpoints are POST with JSON bodies, except GET /entries.
 * Passwords must be base64-encoded (see utils/password.ts).
 */
export class DemoBlazeAPI {
  constructor(private readonly request: APIRequestContext) {}

  /** GET /entries — first page of the catalog (9 products). */
  async getProducts(): Promise<PagedProducts> {
    const response = await this.request.get(`${API_URL}/entries`);
    expect(response.ok(), `GET /entries failed with ${response.status()}`).toBeTruthy();
    return response.json();
  }

  /** POST /view — product details by id. */
  async getProduct(id: number | string): Promise<Product> {
    const response = await this.request.post(`${API_URL}/view`, { data: { id: String(id) } });
    expect(response.ok(), `POST /view failed with ${response.status()}`).toBeTruthy();
    return response.json();
  }

  /** POST /bycat — all products of a category (no pagination keys). */
  async getProductsByCategory(cat: Category): Promise<Product[]> {
    const response = await this.request.post(`${API_URL}/bycat`, { data: { cat } });
    expect(response.ok(), `POST /bycat failed with ${response.status()}`).toBeTruthy();
    const body = await response.json();
    return body.Items as Product[];
  }

  /** POST /pagination — next/previous page of the catalog. */
  async getProductsPage(afterId: number | string): Promise<PagedProducts> {
    const response = await this.request.post(`${API_URL}/pagination`, { data: { id: String(afterId) } });
    expect(response.ok(), `POST /pagination failed with ${response.status()}`).toBeTruthy();
    return response.json();
  }

  /**
   * POST /login — the API answers either with a JSON-encoded string
   * ("Auth_token: <token>") or with a JSON object ({ errorMessage }).
   * @throws if the API answers with an errorMessage (e.g. "Wrong password.").
   */
  async login(username: string, password: string): Promise<string> {
    const response = await this.request.post(`${API_URL}/login`, {
      data: { username, password: b64EncodeUnicode(password) },
    });
    const raw = await response.text();

    let body: unknown;
    try {
      body = JSON.parse(raw);
    } catch {
      body = raw;
    }

    const errorMessage =
      typeof body === 'object' && body !== null
        ? (body as { errorMessage?: string }).errorMessage
        : undefined;
    if (errorMessage) {
      throw new Error(`Login failed for "${username}": ${errorMessage}`);
    }

    const token = String(body).replace('Auth_token: ', '').trim();
    if (token.includes('errorMessage')) {
      throw new Error(`Login failed for "${username}": ${token}`);
    }
    return token;
  }

  /** POST /signup — creates a user; @throws when the user already exists. */
  async signUp(username: string, password: string): Promise<void> {
    const response = await this.request.post(`${API_URL}/signup`, {
      data: { username, password: b64EncodeUnicode(password) } },
    );
    const body = await response.json().catch(() => ({}));
    if (body && (body as { errorMessage?: string }).errorMessage) {
      throw new Error(`Signup failed for "${username}": ${(body as { errorMessage: string }).errorMessage}`);
    }
  }

  /** POST /check — validates a token, returns { Item: { username } }. */
  async checkToken(token: string): Promise<{ Item: { username: string } }> {
    const response = await this.request.post(`${API_URL}/check`, { data: { token } });
    expect(response.ok(), `POST /check failed with ${response.status()}`).toBeTruthy();
    return response.json();
  }

  /** POST /addtocart — adds a product to the cart keyed by cookie/token. */
  async addToCart(cookie: string, productId: number, flag = true): Promise<void> {
    const response = await this.request.post(`${API_URL}/addtocart`, {
      data: { id: guid(), cookie, prod_id: productId, flag },
    });
    expect(response.ok(), `POST /addtocart failed with ${response.status()}`).toBeTruthy();
  }

  /** POST /viewcart — returns { Items: [{ id, prod_id }] }. */
  async viewCart(cookie: string, flag = false): Promise<CartEntry[]> {
    const response = await this.request.post(`${API_URL}/viewcart`, { data: { cookie, flag } });
    expect(response.ok(), `POST /viewcart failed with ${response.status()}`).toBeTruthy();
    const body = await response.json();
    return body.Items as CartEntry[];
  }

  /** POST /deleteitem — removes one cart entry by id. */
  async deleteCartItem(id: string): Promise<void> {
    await this.request.post(`${API_URL}/deleteitem`, { data: { id } });
  }

  /** POST /deletecart — clears the whole cart for a cookie/token (cleanup helper). */
  async deleteCart(cookie: string): Promise<void> {
    await this.request.post(`${API_URL}/deletecart`, { data: { cookie } });
  }
}
