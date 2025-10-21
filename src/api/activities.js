import { API_BASE_URL, handleResponse } from './apiClient';

export const getActivities = async () => {
  const response = await fetch(`${API_BASE_URL}/activities`);
  return handleResponse(response);
};

/**
 * Creates a new activity.
 * @param {object} activityData - The data for the new activity.
 * @param {string} activityData.user_name - The name of the user performing the action.
 * @param {string} activityData.action - The action being performed (e.g., 'created').
 * @param {string} activityData.target - The target of the action (e.g., 'New Contact').
 * @param {string} [activityData.details] - Optional details about the activity.
 */
export const createActivity = async (activityData) => {
  // NOTE: Fixed a bug from your original code.
  // Changed 'API_URL' to 'API_BASE_URL' and added the '/activities' endpoint.
  const response = await fetch(`${API_BASE_URL}/activities`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(activityData),
  });
  return handleResponse(response);
};

export const getRecentActivities = async () => {
  const response = await fetch(`${API_BASE_URL}/recent-activities`);
  return handleResponse(response);
};