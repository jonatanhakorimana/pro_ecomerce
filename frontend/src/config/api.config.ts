export const getApiBaseUrl = (): string => {
  if (typeof window !== "undefined") {
    const customUrl = localStorage.getItem("shopeazy_custom_api_url");
    if (customUrl) return customUrl;
  }

  const envBaseUrl = (import.meta as any).env?.VITE_API_BASE_URL;
  return envBaseUrl || "/api";
};

export const setApiBaseUrl = (url: string): void => {
  if (typeof window !== "undefined") {
    localStorage.setItem("shopeazy_custom_api_url", url);
  }
};

export const resetApiBaseUrl = (): void => {
  if (typeof window !== "undefined") {
    localStorage.removeItem("shopeazy_custom_api_url");
  }
};