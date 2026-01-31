import { apiGet, apiFetch } from "../../api.js";

export async function listPackages() {
  return apiGet("/api/packages");
}

export async function createPackage(payload) {
  return apiFetch("/api/packages", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

export async function updatePackage(id, payload) {
  return apiFetch(`/api/packages/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

export async function deletePackage(id) {
  return apiFetch(`/api/packages/${id}`, {
    method: "DELETE",
  });
}
