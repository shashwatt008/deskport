const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

interface ApiError {
  message: string;
  statusCode: number;
}

class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  private getToken(): string | null {
    if (typeof window === "undefined") return null;
    return localStorage.getItem("deskport_token");
  }

  private async request<T>(
    path: string,
    options: RequestInit = {}
  ): Promise<T> {
    const token = this.getToken();
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      ...(options.headers as Record<string, string>),
    };

    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    const response = await fetch(`${this.baseUrl}${path}`, {
      ...options,
      headers,
    });

    if (response.status === 401) {
      if (typeof window !== "undefined") {
        localStorage.removeItem("deskport_token");
        window.location.href = "/login";
      }
      throw { message: "Unauthorized", statusCode: 401 } as ApiError;
    }

    if (!response.ok) {
      const body = await response.json().catch(() => ({}));
      throw {
        message: body.message || response.statusText,
        statusCode: response.status,
      } as ApiError;
    }

    if (response.status === 204) {
      return undefined as T;
    }

    return response.json();
  }

  async get<T>(path: string): Promise<T> {
    return this.request<T>(path, { method: "GET" });
  }

  async post<T>(path: string, body?: unknown): Promise<T> {
    return this.request<T>(path, {
      method: "POST",
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  async put<T>(path: string, body?: unknown): Promise<T> {
    return this.request<T>(path, {
      method: "PUT",
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  async patch<T>(path: string, body?: unknown): Promise<T> {
    return this.request<T>(path, {
      method: "PATCH",
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  async delete<T>(path: string): Promise<T> {
    return this.request<T>(path, { method: "DELETE" });
  }

  getWsUrl(path: string): string {
    const wsBase = this.baseUrl
      .replace("https://", "wss://")
      .replace("http://", "ws://");
    const token = this.getToken();
    return `${wsBase}${path}${token ? `?token=${token}` : ""}`;
  }
}

export const api = new ApiClient(BASE_URL);
