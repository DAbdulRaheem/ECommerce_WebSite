import { useEffect, useState } from 'react';
import { Container, Row, Col, Card, Button, Spinner, Alert } from 'react-bootstrap';
import { FaTrash, FaShoppingCart } from 'react-icons/fa';
import { toast } from 'react-toastify';
import { wishlistService, cartService } from '../../services/api';
import { Link } from 'react-router-dom';

const Wishlist = () => {
    const [wishlistItems, setWishlistItems] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchWishlist();
        // Set Flipkart-style background

    }, []);

    const fetchWishlist = async () => {
        try {
            const res = await wishlistService.get();
            setWishlistItems(res.data);
            setLoading(false);
        } catch (err) {
            console.error(err);
            setLoading(false);
        }
    };

    const removeFromWishlist = async (productId) => {
        try {
            await wishlistService.remove(productId);
            // Optimistic update: Remove from UI immediately
            setWishlistItems(wishlistItems.filter(item => item.product.id !== productId));
        } catch (err) {
            console.log(err)
            toast.error("Failed to remove item") 
        }
    };

    const moveToCart = async (productId) => {
        try {
            // 1. Add to Cart
            await cartService.add(productId, 1);
            // 2. Remove from Wishlist
            await removeFromWishlist(productId);
            toast.success("Item moved to Cart")
        } catch (err) {
            console.log(err)
            toast.error(" Error moving item to cart ")
        }
    };

    if (loading) {
        return (
            <div className="d-flex justify-content-center align-items-center" style={{ height: "80vh" }}>
                <Spinner animation="border" variant="primary" />
            </div>
        );
    }

    return (
        <Container className="mt-4">
            <h4 className="fw-bold mb-4">My Wishlist ({wishlistItems.length})</h4>
            
            {wishlistItems.length === 0 ? (
                <div className="text-center py-5  shadow-ls rounded">
                    <img 
                        src="https://static-assets-web.flixcart.com/fk-p-linchpin-web/fk-cp-zion/img/mywishlist-empty_39f7a5.png" 
                        alt="Empty Wishlist" 
                        style={{ height: '150px' }} 
                    />
                    <h5 className="mt-3">Empty Wishlist</h5>
                    <p className="text-muted">You have no items in your wishlist. Start adding!</p>
                    <Link to="/" className="btn btn-primary px-4">Shop Now</Link>
                </div>
            ) : (
                <Row>
                    {wishlistItems.map((item) => {
                        // Handle backend structure (item.product might be the object)
                        const p = item.product; 
                        return (
                            <Col key={item.id} md={12} className="mb-3">
                                <Card className="border-0 shadow-sm p-3">
                                    <Row className="align-items-center">
                                        {/* Image Section */}
                                        <Col xs={3} md={2} className="text-center">
                                            <img 
                                                src={p.images?.[0]?.image_url || "https://via.placeholder.com/150"} 
                                                alt={p.title}
                                                className="img-fluid"
                                                style={{ maxHeight: '100px', objectFit: 'contain' }}
                                            />
                                        </Col>

                                        {/* Details Section */}
                                        <Col xs={9} md={6}>
                                            <Link to={`/product/${p.id}`} className="text-decoration-none text-dark">
                                                <h6 className="fw-bold mb-1 text-truncate">{p.title}</h6>
                                            </Link>
                                            
                                            <div className="d-flex align-items-center gap-2 mb-2">
                                                <span className="badge bg-success small">{p.rating || 4.2} ★</span>
                                                <span className="text-muted small">(240 ratings)</span>
                                            </div>

                                            <div className="d-flex align-items-center gap-2">
                                                <h5 className="mb-0">₹{p.price}</h5>
                                                <small className="text-decoration-line-through text-muted">
                                                    ₹{(p.price * 1.25).toFixed(0)}
                                                </small>
                                                <small className="text-success fw-bold">25% off</small>
                                            </div>
                                        </Col>

                                        {/* Actions Section */}
                                        <Col xs={12} md={4} className="d-flex justify-content-end align-items-center mt-3 mt-md-0 gap-3">
                                            <Button 
                                                variant="outline-secondary" 
                                                size="sm" 
                                                onClick={() => removeFromWishlist(p.id)}
                                                title="Remove from Wishlist"
                                            >
                                                <FaTrash />
                                            </Button>
                                            <Button 
                                                variant="primary" 
                                                size="sm" 
                                                className="px-4"
                                                onClick={() => moveToCart(p.id)}
                                            >
                                                <FaShoppingCart className="me-2" /> Move to Cart
                                            </Button>
                                        </Col>
                                    </Row>
                                </Card>
                            </Col>
                        );
                    })}
                </Row>
            )}
        </Container>
    );
};

export default Wishlist;