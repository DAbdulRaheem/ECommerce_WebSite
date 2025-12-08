import { createContext, useState} from 'react';
import { authService } from '../services/api';
import { useNavigate } from 'react-router-dom';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    // 1. Initialize State (Read is_staff from localStorage)
    const [user, setUser] = useState(() => {
        const savedUsername = localStorage.getItem('username');
        const savedIsStaff = localStorage.getItem('is_staff') === 'true'; // Convert string "true" to boolean
        return savedUsername ? { username: savedUsername, is_staff: savedIsStaff } : null;
    });
    
    const [token, setToken] = useState(localStorage.getItem('token'));
    const navigate = useNavigate();

    const login = async (username, password) => {
        try {
            let res;
            try {
                res = await authService.login({ username, password });
            } catch (err) {
                console.log(err)
                res = await authService.adminLogin({ username, password });
            }
            
            const newToken = res.data.token;
            const newUser = res.data.username;
            const isStaff = res.data.is_staff; // Get the flag from backend

            // 2. Save to Storage
            localStorage.setItem('token', newToken);
            localStorage.setItem('username', newUser);
            localStorage.setItem('is_staff', isStaff); // Save permission
            
            setToken(newToken);
            setUser({ username: newUser, is_staff: isStaff });
            
            // Redirect based on role
            if (isStaff) {
                window.location.href = '/admin';
            } else {
                navigate('/');
            }
        } catch (error) {
            console.error("Login Error:", error);
            alert("Invalid Credentials");
        }
    };

    const logout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('username');
        localStorage.removeItem('is_staff'); // Clear permission
        setToken(null);
        setUser(null);
        navigate('/login');
    };

    return (
        <AuthContext.Provider value={{ user, token, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
};

export default AuthContext;