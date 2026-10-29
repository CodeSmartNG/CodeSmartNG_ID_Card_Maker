import api from './api';

export const memberService = {
  list: (params) => api.get('/members', { params }),
  get: (id) => api.get(`/members/${id}`),
  create: (data) => api.post('/members', data),
  update: (id, data) => api.put(`/members/${id}`, data),
  delete: (id) => api.delete(`/members/${id}`),

  uploadPhoto: (id, file) => {
    const formData = new FormData();
    formData.append('photo', file);
    return api.post(`/members/${id}/photo`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
};
