import React, { createContext, useContext, useReducer, useEffect } from 'react';
import API from '../utils/api';

const AuthContext = createContext();

const readStoredValue = (key) => {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
};

const removeStoredValue = (key) => {
  try {
    localStorage.removeItem(key);
  } catch {
    // Storage can be unavailable in restricted browser contexts.
  }
};

const readStoredUser = () => {
  try {
    const user = JSON.parse(readStoredValue('user') || 'null');
    return user && typeof user === 'object' ? user : null;
  } catch {
    removeStoredValue('user');
    return null;
  }
};

const storedToken = readStoredValue('token');

const initialState = {
  user: readStoredUser(),
  token: storedToken || null,
  loading: Boolean(storedToken),
};

const authReducer = (state, action) => {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    case 'LOGIN_SUCCESS':
      localStorage.setItem('token', action.payload.token);
      localStorage.setItem('user', JSON.stringify(action.payload.user));
      return { ...state, user: action.payload.user, token: action.payload.token, loading: false };
    case 'UPDATE_USER':
      const updated = { ...state.user, ...action.payload };
      localStorage.setItem('user', JSON.stringify(updated));
      return { ...state, user: updated };
    case 'AUTH_REFRESH_SUCCESS':
      localStorage.setItem('user', JSON.stringify(action.payload));
      return { ...state, user: action.payload, loading: false };
    case 'AUTH_REFRESH_FAILURE':
      return { ...state, loading: false };
    case 'LOGOUT':
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      return { user: null, token: null, loading: false };
    default:
      return state;
  }
};

export const AuthProvider = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // Refresh user data on mount
  useEffect(() => {
    if (state.token) {
      API.get('/auth/me')
        .then(({ data }) => dispatch({ type: 'AUTH_REFRESH_SUCCESS', payload: data.user }))
        .catch((error) => {
          if (error.response?.status === 401) dispatch({ type: 'LOGOUT' });
          else dispatch({ type: 'AUTH_REFRESH_FAILURE' });
        });
    }
  }, []);

  const login = async (credentials) => {
    dispatch({ type: 'SET_LOADING', payload: true });
    try {
      const { data } = await API.post('/auth/login', credentials);
      dispatch({ type: 'LOGIN_SUCCESS', payload: data });
      return data;
    } catch (error) {
      dispatch({ type: 'SET_LOADING', payload: false });
      throw error;
    }
  };

  const register = async (userData) => {
    dispatch({ type: 'SET_LOADING', payload: true });
    try {
      const { data } = await API.post('/auth/register', userData);
      dispatch({ type: 'LOGIN_SUCCESS', payload: data });
      return data;
    } catch (error) {
      dispatch({ type: 'SET_LOADING', payload: false });
      throw error;
    }
  };

  const logout = () => dispatch({ type: 'LOGOUT' });

  const updateUser = (data) => dispatch({ type: 'UPDATE_USER', payload: data });

  return (
    <AuthContext.Provider value={{ ...state, login, register, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
