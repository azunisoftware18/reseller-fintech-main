const getApiBaseUrl = () => {
  const host = window.location.hostname;
  if (host === "localhost") {
    return `http://localhost:3001/${process.env.NEXT_PUBLIC_API_VERSION}`;
  }
  return `https://${host}/api/${process.env.NEXT_PUBLIC_API_VERSION}`;
};

export const apiClient = async (url, options = {}) => {
  const isFormData = options.body instanceof FormData;
  const API_URL = getApiBaseUrl();

  const res = await fetch(`${API_URL}${url}`, {
    ...options,
    credentials: "include",
    headers: {
      ...(isFormData ? {} : { "Content-Type": "application/json" }),
      ...options.headers,
    },
  });

  const data = await res.json();

  if (!res.ok) {
    const error = new Error(data?.message || "Request failed");
    error.response = { data };
    error.status = res.status;

    if (data?.errors && Array.isArray(data.errors)) {
      error.type = "FIELD";
      error.errors = data.errors;
    }

    throw error;
  }

  return data;
};
