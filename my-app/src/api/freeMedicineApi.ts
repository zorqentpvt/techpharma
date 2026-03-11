const BASE_URL = "http://localhost:8080";

export const applyForEligibility = async (data: any) => {
  const token = localStorage.getItem("token");
  const response = await fetch(`${BASE_URL}/api/user/eligibility/apply`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });
  return response.json();
};

export const getMyEligibility = async () => {
  const token = localStorage.getItem("token");
  const response = await fetch(`${BASE_URL}/api/user/eligibility`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.json();
};

export const getActiveEligibility = async () => {
  const token = localStorage.getItem("token");
  const response = await fetch(`${BASE_URL}/api/user/eligibility/active`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.json();
};

export const createFreeMedicineOrder = async (cartId: string, pharmacyId: string) => {
  const token = localStorage.getItem("token");
  const response = await fetch(`${BASE_URL}/api/user/orders/free-medicine`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ cartId, pharmacyId }),
  });
  return response.json();
};

// Admin Endpoints
export const getEligibilityRequests = async () => {
  const token = localStorage.getItem("token");
  const response = await fetch(`${BASE_URL}/api/admin/eligibility`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.json();
};

export const approveEligibility = async (id: string) => {
  const token = localStorage.getItem("token");
  const response = await fetch(`${BASE_URL}/api/admin/eligibility/${id}/approve`, {
    method: "PUT",
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.json();
};

export const rejectEligibility = async (id: string, reason: string) => {
  const token = localStorage.getItem("token");
  const response = await fetch(`${BASE_URL}/api/admin/eligibility/${id}/reject`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ reason }),
  });
  return response.json();
};