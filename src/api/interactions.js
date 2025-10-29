import { API_BASE_URL, handleResponse } from './apiClient';

export const getInteractions = async (customerId = null, page = 1, limit = 10) => {
  const params = new URLSearchParams({ page, limit });
  if (customerId) params.append('customerId', customerId);
  const response = await fetch(`${API_BASE_URL}/interactions?${params}`);
  return handleResponse(response);
};

export const createInteraction = async (interactionData) => {
  const response = await fetch(`${API_BASE_URL}/interactions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(interactionData),
  });
  return handleResponse(response);
};

export const updateInteraction = async (id, interactionData) => {
  const response = await fetch(`${API_BASE_URL}/interactions/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(interactionData),
  });
  return handleResponse(response);
};

export const deleteInteraction = async (id) => {
    const response = await fetch(`${API_BASE_URL}/interactions/${id}`, {
        method: 'DELETE',
    });
    return handleResponse(response);
};