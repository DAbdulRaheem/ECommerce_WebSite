import { useState } from 'react';
import { Container, Form, Button, Card, Alert } from 'react-bootstrap';
import { useNavigate, Link } from 'react-router-dom';
import api from '../../services/api';

const UserRegister = () => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({ 
        username: '', 
        email: '', 
        password: '' 
    });
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            // Call the standard register endpoint
            await api.post('/auth/register/', formData); 
            alert("Account Created! Please Login.");
            navigate('/login');
        } catch (err) {
            // console.error(err);
            console.log(err);
            if (err.response && err.response.data && err.response.data.error) {
                setError(err.response.data.error); 
            } else {
                setError("Registration Failed. Try a different username.");
            }
        }
    };

    return (
        <Container className="d-flex justify-content-center mt-5">
            <Card style={{ width: '400px' }} className="p-4 shadow border-0">
                <h3 className="text-center mb-4 text-primary">User Registration</h3>
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
                        <Form.Label>Email Address</Form.Label>
                        <Form.Control 
                            type="email" 
                            required
                            placeholder="name@example.com"
                            onChange={(e) => setFormData({...formData, email: e.target.value})} 
                        />
                    </Form.Group>

                    <Form.Group className="mb-4">
                        <Form.Label>Password</Form.Label>
                        <Form.Control 
                            type="password" 
                            required
                            placeholder="Create a password"
                            onChange={(e) => setFormData({...formData, password: e.target.value})} 
                        />
                    </Form.Group>

                    <Button variant="primary" type="submit" className="w-100 mb-2">
                        Sign Up
                    </Button>
                    <div className="text-center mt-3">
                        <small>Already have an account? <Link to="/login">User Login</Link></small>
                    </div>
                </Form>
            </Card>
        </Container>
    );
};

export default UserRegister;