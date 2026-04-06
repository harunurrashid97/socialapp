import axios from 'axios'
import Cookies from 'js-cookie'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000'

const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
})

// Attach token to every request
api.interceptors.request.use((config) => {
  const token = Cookies.get('access_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Auto-refresh on 401
api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config
    if (error.response?.status === 401 && !original._retry) {
      original._retry = true
      const refresh = Cookies.get('refresh_token')
      if (refresh) {
        try {
          const { data } = await axios.post(`${API_URL}/api/auth/token/refresh/`, { refresh })
          Cookies.set('access_token', data.access, { expires: 1 })
          original.headers.Authorization = `Bearer ${data.access}`
          return api(original)
        } catch {
          Cookies.remove('access_token')
          Cookies.remove('refresh_token')
          window.location.href = '/login'
        }
      }
    }
    return Promise.reject(error)
  }
)

export default api

// ─── Auth ───────────────────────────────
export const authApi = {
  register: (data: { first_name: string; last_name: string; email: string; password: string; password_confirm: string }) =>
    api.post('/api/auth/register/', data),
  login: (data: { email: string; password: string }) =>
    api.post('/api/auth/login/', data),
  logout: () => api.post('/api/auth/logout/'),
  me: () => api.get('/api/auth/me/'),
}

// ─── Posts ──────────────────────────────
export const postsApi = {
  list: (cursor?: string) => api.get('/api/posts/', { params: cursor ? { cursor } : {} }),
  create: (data: FormData) => api.post('/api/posts/', data, { headers: { 'Content-Type': 'multipart/form-data' } }),
  detail: (id: string) => api.get(`/api/posts/${id}/`),
  update: (id: string, data: FormData | object) =>
    api.put(`/api/posts/${id}/`, data, {
      headers: data instanceof FormData ? { 'Content-Type': 'multipart/form-data' } : {},
    }),
  delete: (id: string) => api.delete(`/api/posts/${id}/`),
}

// ─── Comments ───────────────────────────
export const commentsApi = {
  list: (postId: string) => api.get(`/api/comments/posts/${postId}/`),
  create: (postId: string, content: string) => api.post(`/api/comments/posts/${postId}/`, { content }),
  delete: (id: string) => api.delete(`/api/comments/${id}/`),
  replies: (commentId: string) => api.get(`/api/comments/${commentId}/replies/`),
  createReply: (commentId: string, content: string) =>
    api.post(`/api/comments/${commentId}/replies/`, { content }),
}

// ─── Interactions ───────────────────────
export const interactionsApi = {
  likePost: (postId: string, reactionType?: string) => api.post(`/api/interactions/posts/${postId}/like/`, { reaction_type: reactionType }),
  postLikers: (postId: string) => api.get(`/api/interactions/posts/${postId}/likers/`),
  likeComment: (commentId: string) => api.post(`/api/interactions/comments/${commentId}/like/`),
  commentLikers: (commentId: string) => api.get(`/api/interactions/comments/${commentId}/likers/`),
  likeReply: (replyId: string) => api.post(`/api/interactions/replies/${replyId}/like/`),
  replyLikers: (replyId: string) => api.get(`/api/interactions/replies/${replyId}/likers/`),
}
