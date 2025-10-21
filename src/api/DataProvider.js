// const API_BASE_URL = 'http://localhost:3001/api';

// // Helper function to handle API responses
// const handleResponse = async (response) => {
//   if (!response.ok) {
//     const errorText = await response.text();
//     try {
//         const errorJson = JSON.parse(errorText);
//         throw new Error(errorJson.message || 'Something went wrong');
//     } catch (e) {
//         throw new Error(errorText || 'Something went wrong');
//     }
//   }
//   return response.json();
// };

// export const postgresDataProvider = {
//   // Customers
//   getCustomers: async (page = 1, limit = 10, search = '', filters = {}) => {
//     const params = new URLSearchParams({ page, limit, search, ...filters });
//     const response = await fetch(`${API_BASE_URL}/customers?${params}`);
//     return handleResponse(response);
//   },
//   getCustomer: async (id) => {
//     const response = await fetch(`${API_BASE_URL}/customers/${id}`);
//     return handleResponse(response);
//   },
//   createCustomer: async (customerData) => {
//     const response = await fetch(`${API_BASE_URL}/customers`, {
//       method: 'POST',
//       headers: { 'Content-Type': 'application/json' },
//       body: JSON.stringify(customerData),
//     });
//     return handleResponse(response);
//   },
//   updateCustomer: async (id, customerData) => {
//     const response = await fetch(`${API_BASE_URL}/customers/${id}`, {
//       method: 'PUT',
//       headers: { 'Content-Type': 'application/json' },
//       body: JSON.stringify(customerData),
//     });
//     return handleResponse(response);
//   },
//   deleteCustomer: async (id) => {
//     const response = await fetch(`${API_BASE_URL}/customers/${id}`, {
//       method: 'DELETE',
//     });
//     return handleResponse(response);
//   },

//   //Activities
//   //Activities
//   getActivities: async () => {
//     const response = await fetch(`${API_BASE_URL}/activities`); // Corrected line
//     return handleResponse(response);
  
//   },

//   /**
//    * Creates a new activity.
//    * @param {object} activityData - The data for the new activity.
//    * @param {string} activityData.user_name - The name of the user performing the action.
//    * @param {string} activityData.action - The action being performed (e.g., 'created').
//    * @param {string} activityData.target - The target of the action (e.g., 'New Contact').
//    * @param {string} [activityData.details] - Optional details about the activity.
//    */
//   createActivity: async (activityData) => {
//     const response = await fetch(API_URL, {
//       method: 'POST',
//       headers: {
//         'Content-Type': 'application/json',
//       },
//       body: JSON.stringify(activityData),
//     });
//     return handleResponse(response);
//   },
  
//   // Deals
//   getDealStages: async () => {
//     const response = await fetch(`${API_BASE_URL}/deals/stages`);
//     return handleResponse(response);
//   },
//   getDeals: async () => {
//     const response = await fetch(`${API_BASE_URL}/deals`);
//     return handleResponse(response);
//   },
//   createDeal: async (dealData) => {
//     const response = await fetch(`${API_BASE_URL}/deals`, {
//       method: 'POST',
//       headers: { 'Content-Type': 'application/json' },
//       body: JSON.stringify(dealData),
//     });
//     return handleResponse(response);
//   },
//   updateDealStage: async (id, stageId) => {
//     const response = await fetch(`${API_BASE_URL}/deals/${id}/stage`, {
//       method: 'PUT',
//       headers: { 'Content-Type': 'application/json' },
//       body: JSON.stringify({ stage_id: stageId }),
//     });
//     return handleResponse(response);
//   },


//   // Interactions
//   getInteractions: async (customerId = null, page = 1, limit = 10) => {
//     const params = new URLSearchParams({ page, limit });
//     if (customerId) params.append('customerId', customerId);
//     const response = await fetch(`${API_BASE_URL}/interactions?${params}`);
//     return handleResponse(response);
//   },
//   createInteraction: async (interactionData) => {
//     const response = await fetch(`${API_BASE_URL}/interactions`, {
//       method: 'POST',
//       headers: { 'Content-Type': 'application/json' },
//       body: JSON.stringify(interactionData),
//     });
//     return handleResponse(response);
//   },
//   updateInteraction: async (id, interactionData) => {
//     const response = await fetch(`${API_BASE_URL}/interactions/${id}`, {
//         method: 'PUT',
//         headers: { 'Content-Type': 'application/json' },
//         body: JSON.stringify(interactionData),
//     });
//     return handleResponse(response);
//   },
//   deleteInteraction: async (id) => {
//       const response = await fetch(`${API_BASE_URL}/interactions/${id}`, {
//           method: 'DELETE',
//       });
//       return handleResponse(response);
//   },

//   // Support Tickets
//   getTickets: async (page = 1, limit = 10, filters = {}) => {
//     const params = new URLSearchParams({ page, limit, ...filters });
//     const response = await fetch(`${API_BASE_URL}/support/tickets?${params}`);
//     return handleResponse(response);
//   },
//   getTicket: async (id) => {
//     const response = await fetch(`${API_BASE_URL}/support/tickets/${id}`);
//     return handleResponse(response);
//   },
//   createTicket: async (ticketData) => {
//     const response = await fetch(`${API_BASE_URL}/support/tickets`, {
//         method: 'POST',
//         headers: { 'Content-Type': 'application/json' },
//         body: JSON.stringify(ticketData),
//     });
//     return handleResponse(response);
//   },
//   updateTicket: async (id, ticketData) => {
//     const response = await fetch(`${API_BASE_URL}/support/tickets/${id}`, {
//       method: 'PUT',
//       headers: { 'Content-Type': 'application/json' },
//       body: JSON.stringify(ticketData),
//     });
//     return handleResponse(response);
//   },
//   createTicketResponse: async (responseData) => {
//       const { ticketId, ...rest } = responseData;
//       const response = await fetch(`${API_BASE_URL}/support/tickets/${ticketId}/responses`, {
//           method: 'POST',
//           headers: { 'Content-Type': 'application/json' },
//           body: JSON.stringify(rest),
//       });
//       return handleResponse(response);
//   },

//   // Segments
//   getSegments: async () => {
//       const response = await fetch(`${API_BASE_URL}/segments`);
//       return handleResponse(response);
//   },
//   createSegment: async (segmentData) => {
//       const response = await fetch(`${API_BASE_URL}/segments`, {
//           method: 'POST',
//           headers: { 'Content-Type': 'application/json' },
//           body: JSON.stringify(segmentData),
//       });
//       return handleResponse(response);
//   },
//   deleteSegment: async (id) => {
//       const response = await fetch(`${API_BASE_URL}/segments/${id}`, {
//           method: 'DELETE',
//       });
//       return handleResponse(response);
//   },

//   // Statistics
//   getStats: async () => {
//     const response = await fetch(`${API_BASE_URL}/stats`);
//     return handleResponse(response);
//   },
  
//   // Recent Activities
//   getRecentActivities: async () => {
//     const response = await fetch(`${API_BASE_URL}/recent-activities`);
//     return handleResponse(response);
//   },
// };




import * as customerApi from './customers';
import * as activityApi from './activities';
import * as dealApi from './deals';
import * as interactionApi from './interactions';
import * as ticketApi from './supportTickets';
import * as segmentApi from './segments';
import * as statsApi from './stats';

export const DataProvider = {
  ...customerApi,
  ...activityApi,
  ...dealApi,
  ...interactionApi,
  ...ticketApi,
  ...segmentApi,
  ...statsApi,
};