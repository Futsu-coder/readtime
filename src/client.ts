import { hc } from 'hono/client'
import type { AppType } from '../../backend/src/index'
export const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8787";
export const client = hc<AppType>(API_URL);