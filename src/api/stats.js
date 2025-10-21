import { API_BASE_URL, handleResponse } from './apiClient';

export const getStats = async () => {
  const response = await fetch(`${API_BASE_URL}/stats`);
  return handleResponse(response);
};