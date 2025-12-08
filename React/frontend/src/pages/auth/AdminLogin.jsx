import { useState } from 'react';
import { Container, Form, Button, Card, Alert } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { authService } from '../../services/api';

const AdminLogin = () => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({ username: '', password: '' });
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            // 1. Call the Admin Login Endpoint
            const res = await authService.adminLogin(formData);

            // 2. Save Token AND Permissions to LocalStorage
            localStorage.setItem('token', res.data.token);
            localStorage.setItem('username', res.data.username);
            
            // 👇 CRITICAL FIX: Save the admin status!
            // The Navbar checks this to decide whether to show the Dashboard link.
            localStorage.setItem('is_staff', res.data.is_staff); 

            // 3. Force a reload to update Navbar (AuthContext will read new data)
            window.location.href = '/admin'; 
            
        } catch (err) {
            console.error(err);
            setError("Login Failed. Are you sure you are a Seller?");
        }
    };

    return (
        <Container className="d-flex justify-content-center mt-5">
            <Card style={{ width: '400px' }} className="p-4 shadow border-0">
                <h3 className="text-center mb-4 text-primary">Seller Login</h3>
                {error && <Alert variant="danger">{error}</Alert>}
                
                <Form onSubmit={handleSubmit}>
                    <Form.Group className="mb-3">
                        <Form.Label>Username</Form.Label>
                        <Form.Control 
                            type="text" 
                            required
                            onChange={(e) => setFormData({...formData, username: e.target.value})} 
                        />
                    </Form.Group>

                    <Form.Group className="mb-4">
                        <Form.Label>Password</Form.Label>
                        <Form.Control 
                            type="password" 
                            required
                            onChange={(e) => setFormData({...formData, password: e.target.value})} 
                        />
                    </Form.Group>

                    <Button variant="primary" type="submit" className="w-100 mb-2">
                        Access Dashboard
                    </Button>
                </Form>
            </Card>
        </Container>
    );
};

export default AdminLogin;