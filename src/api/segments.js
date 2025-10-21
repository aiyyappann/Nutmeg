import { API_BASE_URL, handleResponse } from './apiClient';

export const getSegments = async () => {
    const response = await fetch(`${API_BASE_URL}/segments`);
    return handleResponse(response);
};

export const createSegment = async (segmentData) => {
    const response = await fetch(`${API_BASE_URL}/segments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(segmentData),
    });
    return handleResponse(response);
};

export const deleteSegment = async (id) => {
    const response = await fetch(`${API_BASE_URL}/segments/${id}`, {
        method: 'DELETE',
    });
    return handleResponse(response);
};