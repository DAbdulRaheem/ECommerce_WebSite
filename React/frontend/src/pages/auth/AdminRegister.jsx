import { useState } from 'react';
import { Container, Form, Button, Card, Alert } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { authService } from '../../services/api';

const AdminRegister = () => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({ 
        username: '', 
        password: '', 
        secret_key: '' 
    });
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        // 1. Convert to FormData (Fix for Django)
        const dataToSend = new FormData();
        dataToSend.append('username', formData.username);
        dataToSend.append('password', formData.password);
        dataToSend.append('secret_key', formData.secret_key);

        try {
            await authService.adminRegister(dataToSend);
            
            alert("Seller Account Created Successfully! Please Login.");
            
            // 👇 CHANGE: Redirect to the specific Seller Login page
            navigate('/seller/login'); 
        } catch (err) {
            console.error(err);
            if (err.response && err.response.data && err.response.data.error) {
                setError(err.response.data.error); 
            } else {
                setError("Registration Failed. Check your Secret Key.");
            }
        }
    };

    return (
        <Container className="d-flex justify-content-center mt-5">
            <Card style={{ width: '400px' }} className="p-4 shadow border-0">
                <h3 className="text-center mb-4 text-primary">Become a Seller</h3>
                {error && <Alert variant="danger">{error}</Alert>}
                
                <Form onSubmit={handleSubmit}>
                    <Form.Group className="mb-3">
                        <Form.Label>Username</Form.Label>
                        <Form.Control 
                            type="text" 
                            required
                            placeholder="Choose a username"
                            onChange={(e) => setFormData({...formData, username: e.target.value})} 
                        />
                    </Form.Group>

                    <Form.Group className="mb-3">
                        <Form.Label>Password</Form.Label>
                        <Form.Control 
                            type="password" 
                            required
                            placeholder="Choose a password"
                            onChange={(e) => setFormData({...formData, password: e.target.value})} 
                        />
                    </Form.Group>

                    <Form.Group className="mb-4">
                        <Form.Label>Secret Key</Form.Label>
                        <Form.Control 
                            type="password" 
                            required
                            placeholder="Enter Master Key (e.g., CREATE_ADMIN_123)"
                            onChange={(e) => setFormData({...formData, secret_key: e.target.value})} 
                        />
                        <Form.Text className="text-muted">
                            Required to verify seller privileges.
                        </Form.Text>
                    </Form.Group>

                    <Button variant="primary" type="submit" className="w-100 mb-2">
                        Register as Seller
                    </Button>
                    <Button variant="outline-secondary" className="w-100" onClick={() => navigate('/seller/login')}>
                        Already have a Seller Account? Login
                    </Button>
                </Form>
            </Card>
        </Container>
    );
};

export default AdminRegister;