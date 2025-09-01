const API_BASE_URL = "http://localhost:4000/api"

const getAuthHeaders = () => {
  const token = localStorage.getItem("token")
  return {
    "Content-Type": "application/json",
    ...(token && { Authorization: `Bearer ${token}` }),
  }
}

const handleResponse = async (response) => {
  if (!response.ok) {
    // intenta parsear json de error si existe
    let error = { message: "Error en la petición" }
    try {
      const body = await response.json()
      error = body || error
    } catch (e) {
      // nada
    }
    throw new Error(error.message || "Error en la petición")
  }
  // Algunas respuestas pueden no tener body (204)
  try {
    return await response.json()
  } catch {
    return null
  }
}

// Generic CRUD factory
const createCRUDService = (endpoint) => ({
  async getAll() {
    const response = await fetch(`${API_BASE_URL}/${endpoint}`, {
      headers: getAuthHeaders(),
    })
    return handleResponse(response)
  },

  async getById(id) {
    const response = await fetch(`${API_BASE_URL}/${endpoint}/${id}`, {
      headers: getAuthHeaders(),
    })
    return handleResponse(response)
  },

  async create(data) {
    const response = await fetch(`${API_BASE_URL}/${endpoint}`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    })
    return handleResponse(response)
  },

  async update(id, data) {
    const response = await fetch(`${API_BASE_URL}/${endpoint}/${id}`, {
      method: "PUT",
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    })
    return handleResponse(response)
  },

  async delete(id) {
    const response = await fetch(`${API_BASE_URL}/${endpoint}/${id}`, {
      method: "DELETE",
      headers: getAuthHeaders(),
    })
    return handleResponse(response)
  },
})

export const apiService = {
  caja: {
    // Obtener la caja única
    async get() {
      const response = await fetch(`${API_BASE_URL}/caja`, {
        headers: getAuthHeaders(),
      });
      return handleResponse(response);
    },

    // Agregar ingreso
    async addIngreso(data) {
      const response = await fetch(`${API_BASE_URL}/caja/ingresos`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify(data),
      });
      return handleResponse(response);
    },

    // Listar ingresos con filtros opcionales
    async listIngresos(params = {}) {
      const qs = new URLSearchParams(params).toString();
      const url = `${API_BASE_URL}/caja/ingresos${qs ? `?${qs}` : ""}`;
      const response = await fetch(url, { headers: getAuthHeaders() });
      return handleResponse(response);
    },

    // Eliminar ingreso
    async deleteIngreso(id) {
      const response = await fetch(`${API_BASE_URL}/caja/ingresos/${id}`, {
        method: "DELETE",
        headers: getAuthHeaders(),
      });
      return handleResponse(response);
    }
  },

  gastosFijos: createCRUDService("gastos-fijos"),
  gastosVariables: createCRUDService("gastos-variables"),
  compras: createCRUDService("compras"),
  deudas: createCRUDService("deudas"),
  abonos: createCRUDService("abonos"),
};
