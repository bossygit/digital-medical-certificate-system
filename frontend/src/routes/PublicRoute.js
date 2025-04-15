import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const PublicRoute = () => {
    const { user, isAuthenticated, isLoading } = useAuth();

    // Si l'état d'authentification est encore en cours de chargement, ne rien faire pour l'instant
    // Cela évite une redirection prématurée avant que l'état initial ne soit déterminé
    if (isLoading) {
        return <div>Chargement...</div>; // Ou un spinner, ou null
    }

    if (isAuthenticated) {
        // L'utilisateur est connecté, le rediriger loin des pages publiques
        // Déterminez la redirection en fonction du rôle
        if (user?.role === 'doctor') {
            console.log("PublicRoute: User is doctor, redirecting to /doctor/dashboard");
            return <Navigate to="/doctor/dashboard" replace />;
        } else if (user?.role === 'dgtt_admin' || user?.role === 'dgtt_staff') {
            console.log("PublicRoute: User is admin/staff, redirecting to /admin/dashboard");
            return <Navigate to="/admin/dashboard" replace />;
        } else {
            // Si l'utilisateur est authentifié mais sans rôle attendu (ce qui ne devrait pas arriver)
            // Rediriger vers une page d'accueil générique ou le tableau de bord admin par défaut?
            console.log("PublicRoute: User authenticated but unknown role, redirecting to /admin/dashboard as fallback");
            return <Navigate to="/admin/dashboard" replace />; // Fallback sûr
        }
    }

    // L'utilisateur n'est pas authentifié (ou le chargement est terminé et il n'est pas auth)
    // Afficher la page publique demandée (ex: LoginPage)
    // console.log("PublicRoute: User not authenticated, rendering Outlet.");
    return <Outlet />;
};

export default PublicRoute;
