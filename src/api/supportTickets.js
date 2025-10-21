import { API_BASE_URL, handleResponse } from './apiClient';

export const getTickets = async (page = 1, limit = 10, filters = {}) => {
  const params = new URLSearchParams({ page, limit, ...filters });
  const response = await fetch(`${API_BASE_URL}/support/tickets?${params}`);
  return handleResponse(response);
};

export const getTicket = async (id) => {
  const response = await fetch(`${API_BASE_URL}/support/tickets/${id}`);
  return handleResponse(response);
};

export const createTicket = async (ticketData) => {
  const response = await fetch(`${API_BASE_URL}/support/tickets`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(ticketData),
  });
  return handleResponse(response);
};

export const updateTicket = async (id, ticketData) => {
  const response = await fetch(`${API_BASE_URL}/support/tickets/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(ticketData),
  });
  return handleResponse(response);
};

export const createTicketResponse = async (responseData) => {
    const { ticketId, ...rest } = responseData;
    const response = await fetch(`${API_BASE_URL}/support/tickets/${ticketId}/responses`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(rest),
    });
    return handleResponse(response);
};