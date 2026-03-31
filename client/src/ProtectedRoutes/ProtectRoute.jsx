import { useAuthStore } from '../store/authStore'
import { Navigate } from 'react-router-dom';

const ProtectRoute = ({ children }) => {


    const { user, loading } = useAuthStore();

    if (loading) return (
        <div className="flex items-center justify-center min-h-screen">
            <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
        </div>
    );

    if (user) return children;

    return <Navigate to="/login" />;

}

export default ProtectRoute