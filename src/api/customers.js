import { API_BASE_URL, handleResponse } from './apiClient';

export const importCustomers = async (customers) => {
  const response = await fetch(`${API_BASE_URL}/customers/import`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ customers }),
  });
  return handleResponse(response);
};

export const getCustomers = async (page = 1, limit = 10, search = '', filters = {}) => {
  const params = new URLSearchParams({ page, limit, search, ...filters });
  const response = await fetch(`${API_BASE_URL}/customers?${params}`);
  return handleResponse(response);
};

export const getCustomer = async (id) => {
  const response = await fetch(`${API_BASE_URL}/customers/${id}`);
  return handleResponse(response);
};

export const createCustomer = async (customerData) => {
  const response = await fetch(`${API_BASE_URL}/customers`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(customerData),
  });
  return handleResponse(response);
};

export const updateCustomer = async (id, customerData) => {
  const response = await fetch(`${API_BASE_URL}/customers/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(customerData),
  });
  return handleResponse(response);
};

export const deleteCustomer = async (id) => {
  const response = await fetch(`${API_BASE_URL}/customers/${id}`, {
    method: 'DELETE',
  });
  return handleResponse(response);
};

