import api from './api';

export const cardService = {
  // Create a new card draft
  create: (data) => api.post('/cards', data),
  
  // Get card details
  get: (id) => api.get(`/cards/${id}`),
  
  // Update card design (template change)
  update: (id, data) => api.put(`/cards/${id}`, data),
  
  // Get PDF preview (returns base64)
  preview: (id) => api.get(`/cards/${id}/preview`),
};
