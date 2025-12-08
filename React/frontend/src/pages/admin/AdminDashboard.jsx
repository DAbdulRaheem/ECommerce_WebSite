// import { useState,useContext } from 'react';
// import { Container, Form, Button, Alert, Row, Col } from 'react-bootstrap';
// import { toast } from 'react-toastify';
// import AuthContext from '../../context/AuthContext';
// import { productService } from '../../services/api';

// const AdminDashboard = () => {
//     const { user } = useContext(AuthContext);
//     const [product, setProduct] = useState({ 
//         title: '', 
//         brand: '', 
//         description: '', 
//         price: 0, 
//         stock: 0, 
//         category_name: '',
//         image_urls: '' 
//     });
    
//     const [imageFile, setImageFile] = useState(null); 
//     const [message, setMessage] = useState('');

//     const handleSubmit = async (e) => {
//         e.preventDefault();
        
//         const formData = new FormData();
        
//         // 2. Append all text fields (Title, Price, AND image_urls)
//         Object.keys(product).forEach(key => formData.append(key, product[key]));
        
//         // 3. Append the File ONLY if the user selected one
//         if (imageFile) {
//             formData.append('images', imageFile); 
//         }

//         try {
//             await productService.create(formData);
//             setMessage('Product Created Successfully!');
//             toast.success("Product Created Successfully! 🎉");
//             // Optional: Reset form here
//         } catch (err) {
//             console.error(err);
//             setMessage('Failed to create product. Check console.');
//             toast.error("Failed to create product. Check console.");
//         }
//     };

//     return (
//         <Container className="mt-4">
//             <h2>Admin Dashboard</h2>
//             <hr />
//             <div className="p-4 border rounded">
//                 <h4>➕ Add New Product</h4>
//                 {message && <Alert variant={message.includes('Success') ? 'success' : 'danger'}>{message}</Alert>}
                
//                 <Form onSubmit={handleSubmit}>
//                     <Row>
//                         <Col md={6}>
//                             <Form.Group className="mb-3">
//                                 <Form.Label>Title</Form.Label>
//                                 <Form.Control 
//                                     required 
//                                     placeholder="Product Name"
//                                     onChange={e => setProduct({...product, title: e.target.value})} 
//                                 />
//                             </Form.Group>
//                         </Col>
//                         <Col md={6}>
//                             <Form.Group className="mb-3">
//                                 <Form.Label>Brand</Form.Label>
//                                 <Form.Control 
//                                     placeholder="Brand Name"
//                                     onChange={e => setProduct({...product, brand: e.target.value})} 
//                                 />
//                             </Form.Group>
//                         </Col>
//                     </Row>

//                     <Form.Group className="mb-3">
//                         <Form.Label>Description</Form.Label>
//                         <Form.Control 
//                             as="textarea" 
//                             rows={3}
//                             placeholder="Product details..."
//                             onChange={e => setProduct({...product, description: e.target.value})} 
//                         />
//                     </Form.Group>

//                     <Row>
//                         <Col md={4}>
//                             <Form.Group className="mb-3">
//                                 <Form.Label>Price</Form.Label>
//                                 <Form.Control 
//                                     type="number" 
//                                     required
//                                     placeholder="0.00"
//                                     onChange={e => setProduct({...product, price: e.target.value})} 
//                                 />
//                             </Form.Group>
//                         </Col>
//                         <Col md={4}>
//                             <Form.Group className="mb-3">
//                                 <Form.Label>Stock</Form.Label>
//                                 <Form.Control 
//                                     type="number" 
//                                     required
//                                     placeholder="Qty"
//                                     onChange={e => setProduct({...product, stock: e.target.value})} 
//                                 />
//                             </Form.Group>
//                         </Col>
//                         <Col md={4}>
//                             <Form.Group className="mb-3">
//                                 <Form.Label>Category Name</Form.Label>
//                                 <Form.Control 
//                                     type="text" 
//                                     required
//                                     placeholder="e.g. Electronics"
//                                     onChange={e => setProduct({...product, category_name: e.target.value})} 
//                                 />
//                             </Form.Group>
//                         </Col>
//                     </Row>

//                     <hr />
//                     <h5>Images</h5>
//                     <p className="text-muted small">You can upload a file OR paste a direct URL (or both).</p>

//                     {/* Option A: File Upload */}
//                     <Form.Group className="mb-3">
//                         <Form.Label>Upload File</Form.Label>
//                         <Form.Control 
//                             type="file" 
//                             accept="image/*"
//                             onChange={e => setImageFile(e.target.files[0])} 
//                         />
//                     </Form.Group>

//                     {/* Option B: Text URL */}
//                     <Form.Group className="mb-3">
//                         <Form.Label>OR Paste Image URL</Form.Label>
//                         <Form.Control 
//                             type="text" 
//                             placeholder="https://example.com/image.jpg"
//                             onChange={e => setProduct({...product, image_urls: e.target.value})} 
//                         />
//                         <Form.Text className="text-muted">
//                             For multiple URLs, separate them with a comma.
//                         </Form.Text>
//                     </Form.Group>

//                     <Button type="submit" variant="primary" className="mt-2 w-100" onClick={() => alert(`Product Added By Admin: ${user?.username || 'Unknown'}`)}>
//                         Create Product
//                     </Button>
//                 </Form>
//             </div>
//         </Container>
//     );
// };

// export default AdminDashboard;








import { useState, useContext, useEffect } from 'react';
import { Container, Form, Button, Alert, Row, Col, Table, Card } from 'react-bootstrap';
import { toast } from 'react-toastify';
import AuthContext from '../../context/AuthContext';
import { productService } from '../../services/api';
import { FaEdit, FaTrash } from 'react-icons/fa';

const AdminDashboard = () => {
    const { user } = useContext(AuthContext);
    // console.log(user)

    
    // Form State
    const [product, setProduct] = useState({ 
        title: '', 
        brand: '', 
        description: '', 
        price: 0, 
        stock: 0, 
        category_name: '', 
        image_urls: '' 
    });
    const [imageFile, setImageFile] = useState(null); 
    
    // List & Edit State
    const [myProducts, setMyProducts] = useState([]);
    const [isEditing, setIsEditing] = useState(false);
    const [editId, setEditId] = useState(null);

    // Fetch products on load
    useEffect(() => {
        fetchMyProducts();
    }, []);

    const fetchMyProducts = async () => {
        try {
            const res = await productService.getMyProducts();
            setMyProducts(res.data);
        } catch (err) {
            console.error("Failed to fetch my products");
            console.log(err)
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        const formData = new FormData();
        Object.keys(product).forEach(key => formData.append(key, product[key]));
        if (imageFile) formData.append('images', imageFile); 

        try {
            if (isEditing) {
                // UPDATE Existing
                await productService.update(editId, formData);
                toast.success("Product Updated Successfully!");
                setIsEditing(false);
                setEditId(null);
            } else {
                // CREATE New
                await productService.create(formData);
                toast.success("Product Created Successfully! 🎉");
            }
            
            // Refresh list and clear form
            fetchMyProducts();
            setProduct({ title: '', brand: '', description: '', price: 0, stock: 0, category_name: '', image_urls: '' });
            setImageFile(null);
            
        } catch (err) {
            console.error(err);
            toast.error(isEditing ? "Failed to Update" : "Failed to Create");
        }
    };

    const handleEdit = (p) => {
        setIsEditing(true);
        setEditId(p.id);
        setProduct({
            title: p.title,
            brand: p.brand,
            description: p.description,
            price: p.price,
            stock: p.stock,
            category_name: p.category ? p.category.name : '',
            image_urls: '' 
        });
        window.scrollTo(0, 0); 
    };

    const handleDelete = async (id) => {
        if(!window.confirm("Are you sure you want to delete this product?")) return;
        try {
            await productService.delete(id);
            toast.success("Product Deleted");
            fetchMyProducts();
        } catch (err) {
            console.log(err)
            toast.error("Delete Failed");
        }
    };

    const handleCancelEdit = () => {
        setIsEditing(false);
        setEditId(null);
        setProduct({ title: '', brand: '', description: '', price: 0, stock: 0, category_name: '', image_urls: '' });
    };

    return (
        <Container className="mt-4">
            <h2 className="mb-4">Admin Dashboard</h2>
            
            {/* --- ADD / EDIT FORM --- */}
            <Card className={`p-4 mb-5 shadow-sm border-${isEditing ? 'warning' : 'light'}`}>
                <div className="d-flex justify-content-between align-items-center mb-3">
                    <h4 className={isEditing ? "text-warning" : "text-primary"}>
                        {isEditing ? `✏️ Edit Product (ID: ${editId})` : "➕ Add New Product"}
                    </h4>
                    {isEditing && <Button variant="outline-secondary" size="sm" onClick={handleCancelEdit}>Cancel Edit</Button>}
                </div>

                <Form onSubmit={handleSubmit}>
                    <Row>
                        <Col md={6}>
                            <Form.Group className="mb-3">
                                <Form.Label>Title</Form.Label>
                                <Form.Control required value={product.title} onChange={e => setProduct({...product, title: e.target.value})} />
                            </Form.Group>
                        </Col>
                        <Col md={6}>
                            <Form.Group className="mb-3">
                                <Form.Label>Brand</Form.Label>
                                <Form.Control value={product.brand} onChange={e => setProduct({...product, brand: e.target.value})} />
                            </Form.Group>
                        </Col>
                    </Row>
                    
                    <Form.Group className="mb-3">
                        <Form.Label>Description</Form.Label>
                        <Form.Control as="textarea" rows={3} value={product.description} onChange={e => setProduct({...product, description: e.target.value})} />
                    </Form.Group>

                    <Row>
                        <Col md={4}><Form.Group className="mb-3"><Form.Label>Price</Form.Label><Form.Control type="number" required value={product.price} onChange={e => setProduct({...product, price: e.target.value})} /></Form.Group></Col>
                        <Col md={4}><Form.Group className="mb-3"><Form.Label>Stock</Form.Label><Form.Control type="number" required value={product.stock} onChange={e => setProduct({...product, stock: e.target.value})} /></Form.Group></Col>
                        <Col md={4}><Form.Group className="mb-3"><Form.Label>Category Name</Form.Label><Form.Control type="text" required value={product.category_name} onChange={e => setProduct({...product, category_name: e.target.value})} /></Form.Group></Col>
                    </Row>

                    <hr />
                    <h5>Images</h5>
                    <p className="text-muted small">Upload a file OR paste a URL.</p>

                    <Form.Group className="mb-3">
                        <Form.Label>Upload File</Form.Label>
                        <Form.Control type="file" onChange={e => setImageFile(e.target.files[0])} />
                    </Form.Group>

                    <Form.Group className="mb-3">
                        <Form.Label>OR Paste Image URL</Form.Label>
                        <Form.Control type="text" placeholder="https://..." value={product.image_urls} onChange={e => setProduct({...product, image_urls: e.target.value})} />
                    </Form.Group>

                    <Button type="submit" variant={isEditing ? "warning" : "primary"} className="w-100 mt-2">
                        {isEditing ? "Update Product" : "Create Product"}
                    </Button>
                </Form>
            </Card>

            {/* --- MY PRODUCTS LIST --- */}
            <h4 className="mb-3">📦 Your Products ({myProducts.length})</h4>
            {myProducts.length === 0 ? <Alert variant="info">You haven't added any products yet.</Alert> : (
                <Table striped bordered hover responsive className="align-middle bg-white shadow-sm">
                    <thead className="bg-light">
                        <tr>
                            <th>Image</th>
                            <th>Title</th>
                            <th>Price</th>
                            <th>Stock</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {myProducts.map(p => (
                            <tr key={p.id}>
                                <td style={{width: '80px'}}>
                                    <img src={p.images?.[0]?.image_url || "https://via.placeholder.com/50"} alt="prod" style={{width: '50px', height: '50px', objectFit:'contain'}} />
                                </td>
                                <td>{p.title}</td>
                                <td>₹{p.price}</td>
                                <td>{p.stock}</td>
                                <td style={{width: '150px'}}>
                                    <Button variant="outline-primary" size="sm" className="me-2" onClick={() => handleEdit(p)}>
                                        <FaEdit />
                                    </Button>
                                    <Button variant="outline-danger" size="sm" onClick={() => handleDelete(p.id)}>
                                        <FaTrash />
                                    </Button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </Table>
            )}
        </Container>
    );
};

export default AdminDashboard;