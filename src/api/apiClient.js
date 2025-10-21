export const API_BASE_URL = 'http://localhost:3001/api';

// Helper function to handle API responses
export const handleResponse = async (response) => {
  if (!response.ok) {
    const errorText = await response.text();
    try {
        const errorJson = JSON.parse(errorText);
        throw new Error(errorJson.message || 'Something went wrong');
    } catch (e) {
        throw new Error(errorText || 'Something went wrong');
    }
  }
  return response.json();
};