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

export const exportSegment = async (segmentId, segmentName) => {
  try {
    // This route doesn't exist yet, we will create it in the next step
    const response = await fetch(`${API_BASE_URL}/segments/${segmentId}/export`);

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to download export file.');
    }

    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    // Use the segment name for a dynamic filename
    a.download = `${segmentName.replace(/ /g, '_')}-export.csv`;
    document.body.appendChild(a);
    a.click();
    
    a.remove();
    window.URL.revokeObjectURL(url);
    
    return { success: true };
  } catch (error) {
    console.error(`Error exporting segment ${segmentId}:`, error);
    return { success: false, error: error.message };
  }
};