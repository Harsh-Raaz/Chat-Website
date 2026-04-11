import { useAuthStore } from '../store/authStore'
import { Navigate } from 'react-router-dom';

const ProtectRoute = ({ children }) => {


    const { user, checkingAuth } = useAuthStore();

    if (checkingAuth) {
        return <div>Loading...</div>;
    }

    if (user) return children;

    return <Navigate to="/login" />;
}

export default ProtectRoute