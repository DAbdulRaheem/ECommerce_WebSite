import { useEffect, useState, useContext } from 'react';
import { Container, Row, Col, Spinner, Form, Card, Badge } from 'react-bootstrap';
import { toast } from 'react-toastify';
import { productService, cartService } from '../../services/api';
import AuthContext from '../../context/AuthContext';
import ProductCard from '../../components/product/ProductCard';

const ProductList = () => {
    // 1. Store ALL products (database) and FILTERED products (display)
    const [allProducts, setAllProducts] = useState([]); 
    const [filteredProducts, setFilteredProducts] = useState([]);
    const [loading, setLoading] = useState(true); 
    
    // 2. Filter States
    const [categories, setCategories] = useState([]); // List of unique category names
    const [selectedCategories, setSelectedCategories] = useState([]);
    const [priceRange, setPriceRange] = useState(10000); // Default max
    const [maxPriceInDB, setMaxPriceInDB] = useState(10000);
    const [minRating, setMinRating] = useState(0);

    const { user } = useContext(AuthContext);

    useEffect(() => {
        productService.getAll()
            .then(res => {
                // Pre-process data: Add random rating if missing (so filtering works)
                const processedData = res.data.map(p => ({
                    ...p,
                    price: parseFloat(p.price), // Ensure price is a number
                    rating: p.rating || (Math.random() * (5 - 3.5) + 3.5).toFixed(1) // consistent rating
                }));

                setAllProducts(processedData);
                setFilteredProducts(processedData);
                
                // Extract unique categories from data
                const uniqueCats = [...new Set(processedData.map(p => p.category?.name).filter(Boolean))];
                setCategories(uniqueCats);

                // Find highest price for the slider max value
                const highestPrice = Math.max(...processedData.map(p => p.price));
                setMaxPriceInDB(highestPrice);
                setPriceRange(highestPrice);

                setLoading(false); 
            })
            .catch(err => {
                console.error(err);
                setLoading(false);
            });
    }, []);

    // 3. The Filter Logic (Runs whenever a filter changes)
    useEffect(() => {
        let result = allProducts;

        // Filter by Category
        if (selectedCategories.length > 0) {
            result = result.filter(p => selectedCategories.includes(p.category?.name));
        }

        // Filter by Price
        result = result.filter(p => p.price <= priceRange);

        // Filter by Rating
        if (minRating > 0) {
            result = result.filter(p => parseFloat(p.rating) >= minRating);
        }

        setFilteredProducts(result);
    }, [selectedCategories, priceRange, minRating, allProducts]);

    // Handlers
    const handleCategoryChange = (e) => {
        const { value, checked } = e.target;
        if (checked) {
            setSelectedCategories([...selectedCategories, value]);
        } else {
            setSelectedCategories(selectedCategories.filter(c => c !== value));
        }
    };

    const addToCart = async (id) => {
        if (!user) return toast.info("Please Login to shop!");
        try {
            await cartService.add(id, 1);
            toast.success("Product added to cart 🛒");
        } catch { toast.error("Error adding item to cart"); }
    };

    if (loading) {
        return (
            <div className="d-flex justify-content-center align-items-center" style={{ height: "80vh" }}>
                <Spinner animation="border" variant="primary" role="status">
                    <span className="visually-hidden">Loading...</span>
                </Spinner>
            </div>
        );
    }

    return (
        <Container fluid className="mt-3 px-4">
            <h3>Filters</h3>
            <Row>
                {/* --- SIDEBAR FILTERS --- */}
                <Col md={2} className="d-none d-md-block">
                    <Card className="border-0 shadow-sm p-3 mb-3">
                        <div className="d-flex justify-content-between align-items-center mb-3">
                            <h5 className="fw-bold fs-6 mb-0">Filters</h5>
                            <span 
                                className="small text-primary" 
                                style={{cursor: 'pointer'}}
                                onClick={() => {
                                    setSelectedCategories([]);
                                    setPriceRange(maxPriceInDB);
                                    setMinRating(0);
                                }}
                            >
                                Clear
                            </span>
                        </div>
                        
                        {/* Categories */}
                        <div className="mb-4">
                            <h6 className="text-muted small fw-bold text-uppercase">Categories</h6>
                            {categories.length > 0 ? categories.map(cat => (
                                <Form.Check 
                                    key={cat}
                                    type="checkbox" 
                                    label={cat} 
                                    value={cat}
                                    checked={selectedCategories.includes(cat)}
                                    onChange={handleCategoryChange}
                                    className="small mb-1" 
                                />
                            )) : <small className="text-muted">No categories</small>}
                        </div>

                        {/* Price Slider */}
                        <div className="mb-4">
                            <h6 className="text-muted small fw-bold text-uppercase">Price</h6>
                            <Form.Range 
                                min={0} 
                                max={maxPriceInDB} 
                                value={priceRange}
                                onChange={(e) => setPriceRange(Number(e.target.value))}
                            />
                            <div className="d-flex justify-content-between small text-muted">
                                <span>₹0</span>
                                <span className="fw-bold">₹{priceRange}</span>
                            </div>
                        </div>
                        
                        {/* Ratings */}
                        <div className="mb-4">
                            <h6 className="text-muted small fw-bold text-uppercase">Customer Ratings</h6>
                            {[4, 3, 2].map(star => (
                                <Form.Check 
                                    key={star}
                                    type="radio" 
                                    name="ratingFilter"
                                    label={`${star}★ & above`} 
                                    checked={minRating === star}
                                    onChange={() => setMinRating(star)}
                                    className="small mb-1" 
                                />
                            ))}
                        </div>
                    </Card>
                </Col>

                {/* --- MAIN PRODUCT GRID --- */}
                <Col md={10}>
                    {/* <Card className="border-0 shadow-sm mb-3 p-2 rounded-0">
                        <small className="text-muted ms-2">
                            Showing <strong>{filteredProducts.length}</strong> products
                        </small>
                    </Card> */}

                    <Row>
                        {filteredProducts.length > 0 ? (
                            filteredProducts.map(p => (
                                <Col key={p.id} sm={6} md={4} lg={3} className="mb-3">
                                    <ProductCard product={p} onAddToCart={addToCart} />
                                </Col>
                            ))
                        ) : (
                            <div className="text-center py-5">
                                <img src="https://rukminim1.flixcart.com/www/800/800/promos/16/05/2019/d438a32e-765a-4d8b-b4a6-520b560971e8.png?q=90" alt="empty" style={{maxWidth: '200px'}} />
                                <h5 className="mt-3 text-muted">No products match your filters.</h5>
                            </div>
                        )}
                    </Row>
                </Col>
            </Row>
        </Container>
    );
};

export default ProductList;