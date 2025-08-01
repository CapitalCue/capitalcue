'use client'

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import { apiClient } from '@/lib/api-client'

interface User {
  id: string
  email: string
  firstName: string
  lastName: string
  name?: string
  userType: 'VC' | 'INVESTOR'
  companyName?: string
  createdAt: string
  updatedAt: string
}

interface AuthContextType {
  user: User | null
  login: (email: string, password: string) => Promise<void>
  register: (data: RegisterData) => Promise<void>
  logout: () => void
  isLoading: boolean
  isAuthenticated: boolean
}

interface RegisterData {
  email: string
  firstName: string
  lastName: string
  password: string
  userType: 'VC' | 'INVESTOR'
  companyName?: string
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  const isAuthenticated = !!user

  useEffect(() => {
    checkAuth()
  }, [])

  const checkAuth = async () => {
    try {
      const token = localStorage.getItem('token')
      if (!token) {
        setIsLoading(false)
        return
      }

      apiClient.setToken(token)
      const response = await apiClient.get<{ user: User }>('/auth/me')
      
      if (response.success && response.data) {
        setUser(response.data.user)
      } else {
        localStorage.removeItem('token')
        apiClient.removeToken()
      }
    } catch (error) {
      console.error('Auth check failed:', error)
      localStorage.removeItem('token')
      apiClient.removeToken()
    } finally {
      setIsLoading(false)
    }
  }

  const login = async (email: string, password: string) => {
    try {
      const response = await apiClient.post<{ user: User; token: string }>('/auth/login', { email, password })
      
      if (response.success && response.data) {
        const { user, token } = response.data
        localStorage.setItem('token', token)
        apiClient.setToken(token)
        setUser(user)
        router.push('/dashboard')
      } else {
        throw new Error(response.error || 'Login failed')
      }
    } catch (error) {
      console.error('Login failed:', error)
      throw error
    }
  }

  const register = async (data: RegisterData) => {
    try {
      const response = await apiClient.post<{ user: User; token: string }>('/auth/register', data)
      
      if (response.success && response.data) {
        const { user, token } = response.data
        localStorage.setItem('token', token)
        apiClient.setToken(token)
        setUser(user)
        router.push('/dashboard')
      } else {
        throw new Error(response.error || 'Registration failed')
      }
    } catch (error) {
      console.error('Registration failed:', error)
      throw error
    }
  }

  const logout = () => {
    localStorage.removeItem('token')
    apiClient.removeToken()
    setUser(null)
    router.push('/login')
  }

  const value = {
    user,
    login,
    register,
    logout,
    isLoading,
    isAuthenticated,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}