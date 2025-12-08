import { Button } from 'react-bootstrap';
import { FaSun, FaMoon } from 'react-icons/fa';
import { useTheme } from '../../context/ThemeContext';

const ThemeToggle = () => {
    const { theme, toggleTheme } = useTheme();

    return (
        <Button 
            variant={theme === 'light' ? 'outline-dark' : 'outline-light'} 
            onClick={toggleTheme}
            className="d-flex align-items-center justify-content-center"
            style={{ width: '40px', height: '40px', borderRadius: '50%' }}
            title="Toggle Theme"
        >
            {theme === 'light' ? <FaMoon /> : <FaSun />}
        </Button>
    );
};

export default ThemeToggle;