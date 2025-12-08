import { useEffect, useState, useContext } from 'react';
import { useParams } from 'react-router-dom';
import { Container, Row, Col, Button, Badge, Form, ListGroup } from 'react-bootstrap';
import { toast } from 'react-toastify';
import { productService, reviewService, cartService } from '../../services/api';
import AuthContext from '../../context/AuthContext';

const ProductDetail = () => {
    const { id } = useParams();
    const { user } = useContext(AuthContext);
    const [product, setProduct] = useState(null);
    const [reviews, setReviews] = useState([]);
    const [newReview, setNewReview] = useState({ rating: 5, body: '', title: '' });

    useEffect(() => {
        productService.getOne(id).then(res => setProduct(res.data));
        reviewService.getByProduct(id).then(res => setReviews(res.data));
    }, [id]);

    const submitReview = async (e) => {
        e.preventDefault();
        await reviewService.add({ ...newReview, product_id: id });
        window.location.reload();
    };

    if (!product) return <div>Loading...</div>;

    return (
        <Container className="mt-4">
            <Row>
                <Col md={6}>
                    <img src={product.images?.[0]?.image_url || "https://via.placeholder.com/400"} className="img-fluid rounded" alt={product.title} />
                </Col>
                <Col md={6}>
                    <h2>{product.title}</h2>
                    <h3 className="text-success">₹{product.price}</h3>
                    <p>"{product.description}"</p>
                    <p>{product.brand}</p>
                    <p><strong>Stock:</strong> {product.stock > 0 ? <Badge bg="success">In Stock</Badge> : <Badge bg="danger">Out of Stock</Badge>}</p>
                    <Button
                        variant="primary"
                        disabled={product.stock <= 0}
                        onClick={async () => {
                            try {
                                await cartService.add(product.id, 1);
                                // alert(`Added "${product.title}" to cart`);
                                toast.success(`Added "${product.title}" to cart`)
                            } catch (err) {
                                console.error(err);
                                toast.error('Failed to add to cart');
                            }
                        }}
                    >
                        Add to Cart
                    </Button>
                    
                </Col>
            </Row>

            <hr className="my-5" />

            <Row>
                <Col md={8}>
                    <h4>⭐ User Reviews</h4>
                    <ListGroup className="mb-4">
                        {reviews.map(r => (
                            <ListGroup.Item key={r.id}>
                                <strong>{r.user}</strong> <Badge bg="warning" text="dark">{r.rating}/5</Badge>
                                <h5>{r.title}</h5>
                                <p>{r.body}</p>
                            </ListGroup.Item>
                        ))}
                        {reviews.length === 0 && <p>No reviews yet.</p>}
                    </ListGroup>

                    {user && (
                        <Form onSubmit={submitReview} className="p-3 border rounded ">
                            <h5>Write a Review</h5>
                            <Form.Group className="mb-2">
                                <Form.Label>Rating</Form.Label>
                                <Form.Select onChange={e => setNewReview({...newReview, rating: e.target.value})}>
                                    <option value="5">5 - Excellent</option>
                                    <option value="4">4 - Good</option>
                                    <option value="3">3 - Average</option>
                                    <option value="2">2 - Poor</option>
                                    <option value="1">1 - Terrible</option>
                                </Form.Select>
                            </Form.Group>
                            <Form.Group className="mb-2">
                                <Form.Control placeholder="Review Title" onChange={e => setNewReview({...newReview, title: e.target.value})} />
                            </Form.Group>
                            <Form.Group className="mb-2">
                                <Form.Control as="textarea" rows={3} placeholder="Your comments..." onChange={e => setNewReview({...newReview, body: e.target.value})} />
                            </Form.Group>
                            <Button type="submit" variant="dark">Submit Review</Button>
                        </Form>
                    )}
                </Col>
            </Row>
        </Container>
    );
};

export default ProductDetail;