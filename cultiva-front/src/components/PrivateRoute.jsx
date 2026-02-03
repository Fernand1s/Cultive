import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { authService } from '../services/api';

export const PrivateRoute = () => {
    const isAuthenticated = authService.usuarioEstaLogado();

    return isAuthenticated ? <Outlet /> : <Navigate to="/login" replace />;
};