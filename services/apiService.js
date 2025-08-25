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
    const error = await response.json()
    throw new Error(error.message || "Error en la petición")
  }
  return response.json()
}

// Generic CRUD operations
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
  cajas: createCRUDService("cajas"),
  gastosFijos: createCRUDService("gastos-fijos"),
  gastosVariables: createCRUDService("gastos-variables"),
  compras: createCRUDService("compras"),
  deudas: createCRUDService("deudas"),
  abonos: createCRUDService("abonos"),

  // Special method for caja creation/update
  async createOrUpdateCaja(data) {
    const response = await fetch(`${API_BASE_URL}/cajas`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    })
    return handleResponse(response)
  },
}
