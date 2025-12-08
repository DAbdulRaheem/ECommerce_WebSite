import { useState, useContext } from 'react';
import { Container, Form, Button, Card, Alert } from 'react-bootstrap';
import { Link } from 'react-router-dom'; // Add Link for navigation
import AuthContext from '../../context/AuthContext';

const UserLogin = () => {
    const { login } = useContext(AuthContext);
    const [formData, setFormData] = useState({ username: '', password: '' });
    const [error, setError] = useState(null);

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await login(formData.username, formData.password);
            // AuthContext handles redirect
        } catch (err) {
            console.log(err)
            setError("Invalid Username or Password");
        }
    };

    return (
        <Container className="d-flex justify-content-center mt-5">
            <Card style={{ width: '400px' }} className="p-4 shadow border-0">
                <h3 className="text-center mb-4 text-primary">User Login</h3>
                {error && <Alert variant="danger">{error}</Alert>}

                <Form onSubmit={handleSubmit}>
                    <Form.Group className="mb-3">
                        <Form.Label>Username</Form.Label>
                        <Form.Control 
                            type="text" 
                            onChange={(e) => setFormData({...formData, username: e.target.value})} 
                        />
                    </Form.Group>
                    <Form.Group className="mb-3">
                        <Form.Label>Password</Form.Label>
                        <Form.Control 
                            type="password" 
                            onChange={(e) => setFormData({...formData, password: e.target.value})} 
                        />
                    </Form.Group>
                    <Button variant="primary" type="submit" className="w-100">Login</Button>
                    
                    <div className="text-center mt-3">
                        <small>New to MyShop? <Link to="/register">Create an account</Link></small>
                    </div>
                </Form>
            </Card>
        </Container>
    );
};

export default UserLogin;