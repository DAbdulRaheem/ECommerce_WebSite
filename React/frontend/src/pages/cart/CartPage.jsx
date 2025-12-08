import { useEffect, useState } from 'react';
import { Container, Table, Button, Alert, Image } from 'react-bootstrap';
import { cartService, orderService } from '../../services/api';

const CartPage = () => {
    const [cartItems, setCartItems] = useState([]);

    useEffect(() => {
        cartService.get().then(res => setCartItems(res.data.items)).catch(console.error);
    }, []);

    const removeItem = async (id) => {
        await cartService.remove(id);
        setCartItems(cartItems.filter(item => item.id !== id));
    };

    const checkout = async () => {
        const addressId = prompt("Please enter your Address ID for delivery (e.g., 1):");
        if (!addressId) return;
        
        try {
            await orderService.create(addressId);
            alert("Order placed successfully! 🚀");
            setCartItems([]);
        } catch (err) {
            console.log(err)
            alert("Order failed. Check console.");
        }
    };

    const calculateTotal = () => {
        return cartItems.reduce((total, item) => {
            // SAFE MATH: Ensure values are numbers
            const price = parseFloat(item.price) || 0;
            const qty = parseInt(item.quantity) || 0;
            return total + (price * qty);
        }, 0).toFixed(2);
    };

    return (
        <Container className="mt-4">
            <h2>🛒 Shopping Cart</h2>
            {cartItems.length === 0 ? <Alert variant="info">Your cart is empty.</Alert> : (
                <>
                    <Table striped bordered hover responsive className="align-middle">
                        <thead>
                            <tr>
                                <th>Product</th>
                                <th>Price</th>
                                <th>Quantity</th>
                                <th>Total</th>
                                <th>Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {cartItems.map(item => {
                                // Safe variable extraction
                                const price = parseFloat(item.price) || 0;
                                const qty = parseInt(item.quantity) || 0;
                                const rowTotal = (price * qty).toFixed(2);

                                return (
                                    <tr key={item.id}>
                                        <td>
                                            <div className="d-flex align-items-center">
                                                <Image 
                                                    src={item.image || "https://via.placeholder.com/60"} 
                                                    rounded 
                                                    style={{ width: '60px', height: '60px', objectFit: 'cover', marginRight: '15px' }}
                                                    alt={item.title || "Product"}
                                                />
                                                <span className="fw-bold">{item.title || "Unknown Product"}</span>
                                            </div>
                                        </td>
                                        <td>₹{price.toFixed(2)}</td>
                                        <td>{qty}</td>
                                        <td>₹{rowTotal}</td>
                                        <td>
                                            <Button variant="danger" size="sm" onClick={() => removeItem(item.id)}>
                                                Remove
                                            </Button>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </Table>
                    
                    <div className="d-flex justify-content-end align-items-center mt-3">
                        <h4 className="me-4">Total: ₹{calculateTotal()}</h4>
                        <Button variant="success" size="lg" onClick={checkout}>
                            Proceed to Checkout
                        </Button>
                    </div>
                </>
            )}
        </Container>
    );
};

export default CartPage;