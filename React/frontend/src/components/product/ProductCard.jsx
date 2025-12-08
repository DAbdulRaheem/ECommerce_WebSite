import { Card, Badge } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { FaHeart, FaStar, FaShoppingCart } from 'react-icons/fa';
import { toast } from 'react-toastify';
import { wishlistService} from '../../services/api';

const ProductCard = ({ product, onAddToCart }) => {
    // Flipkart Logic: Backend usually sends Selling Price. 
    // We will fake an "MRP" (Original Price) to show the discount effect.
    const sellingPrice = parseFloat(product.price);
    const fakeMRP = (sellingPrice * 1.25).toFixed(2); // 25% higher
    const discount = 25; // 25% off

    // Random rating for visual if backend doesn't provide it
    const rating = product.rating || (Math.random() * (5 - 3.5) + 3.5).toFixed(1);

    const addToWishlist = async () => {
        try {
            await wishlistService.add(product.id);
            toast.success(" Item added to wishlist!")
        } catch {
            toast.error(" Please login or item already in wishlist ")
        }
    };

    return (
        <Card className="h-100 border-10 shadow-lg"  style={{ cursor: 'pointer', transition: 'transform 0.2s' }}>
            {/* Wishlist Heart Icon */}
            <div 
                className="position-absolute top-0 end-0 p-3" 
                style={{ zIndex: 10, cursor: 'pointer' }}
                onClick={addToWishlist} 
            >
                <FaHeart className="text-secondary opacity-50 hover-red" />
            </div>

            {/* Product Image Area */}
            <div className="d-flex justify-content-center align-items-center p-3" style={{ height: '200px' }}>
                <Card.Img 
                    variant="top" 
                    src={product.images?.[0]?.image_url || "https://via.placeholder.com/200"} 
                    alt={product.title} 
                    style={{ maxHeight: '100%', maxWidth: '100%', objectFit: 'contain' }} 
                />
            </div>

            <Card.Body className="pt-1 px-3 pb-3">
                {/* 1. Title (Cleaned up: Single instance, bold, truncated) */}
                <div className="mb-1">
                    <Link to={`/product/${product.id}`} className="text-decoration-none text-reset">
                        <div className="fw-medium text-truncate" title={product.title} style={{ fontSize: '0.95rem' }}>
                            {product.title}
                        </div>
                    </Link>
                </div>

                {/* 2. Rating Badge & Assured Tag */}
                <div className="d-flex align-items-center mb-2" style={{ fontSize: '0.8rem' }}>
                    <Badge bg="success" className="d-flex align-items-center px-2 py-1 rounded-1 me-2" style={{fontSize: '0.75rem'}}>
                        {rating} <FaStar className="ms-1" size={9} />
                    </Badge>
                    <span className="text-muted fw-semibold me-2">
                        ({product.reviews_count || '1,240'})
                    </span>
                    {/* <img 
                        src="https://static-assets-web.flixcart.com/fxn/pwa/img/fa_62673a.png" 
                        alt="assured" 
                        height="16" 
                    /> */}
                </div>

                {/* 3. Pricing Section */}
                <div className="d-flex align-items-baseline gap-2 mb-2">
                    <span className="fw-bold fs-5">₹{Math.floor(sellingPrice).toLocaleString()}</span>
                    <span className="text-muted text-decoration-line-through small" style={{ fontSize: '0.85rem' }}>
                        ₹{Math.floor(fakeMRP).toLocaleString()}
                    </span>
                    <span className="text-success fw-bold small">{discount}% off</span>
                </div>

                {/* 4. Free Delivery Tag */}
                <div className="mb-3">
                    <span className="badge bg-light text-dark border border-secondary rounded-pill px-2 py-0" style={{fontSize: '0.7rem'}}>
                        Free delivery
                    </span>
                </div>

                {/* 5. Add To Cart Button */}
                <button 
                    className="btn btn-warning w-100 fw-bold text-white shadow-none" 
                    style={{ fontSize: '0.9rem' }}
                    onClick={() => onAddToCart(product.id)}
                >
                    <FaShoppingCart className="me-2" /> ADD TO CART
                </button>
            </Card.Body>
        </Card>
    );
};

export default ProductCard;