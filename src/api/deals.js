import { API_BASE_URL, handleResponse } from './apiClient';

export const getDealStages = async () => {
  const response = await fetch(`${API_BASE_URL}/deals/stages`);
  return handleResponse(response);
};

export const getDeals = async () => {
  const response = await fetch(`${API_BASE_URL}/deals`);
  return handleResponse(response);
};

export const createDeal = async (dealData) => {
  const response = await fetch(`${API_BASE_URL}/deals`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(dealData),
  });
  return handleResponse(response);
};

export const updateDealStage = async (id, stageId) => {
  const response = await fetch(`${API_BASE_URL}/deals/${id}/stage`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ stage_id: stageId }),
  });
  return handleResponse(response);
};