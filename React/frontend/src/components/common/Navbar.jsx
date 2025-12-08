import { useContext, useState } from "react";
import { Navbar, Nav, Container, Button, Form, FormControl, NavDropdown } from "react-bootstrap";
import { Link, useNavigate } from "react-router-dom";
import { FaShoppingCart, FaUser, FaSearch, FaTools, FaSignOutAlt, FaHeart } from "react-icons/fa"; 
import AuthContext from "../../context/AuthContext";
import ThemeToggle from "./ThemeToggle";

const AppNavbar = () => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");

  const handleSearch = (e) => {
    e.preventDefault();
    navigate(`/?q=${searchTerm}`);
  };

  return (
    <Navbar expand="lg" className="bg-body-tertiary shadow-sm mb-4 sticky-top" style={{ padding: '10px 0' }}>
      <Container fluid="md">
        
        <Navbar.Brand as={Link} to="/" className="fw-bold text-primary fs-4 me-4">
          🛍️ MyShop
        </Navbar.Brand>

        <Navbar.Toggle aria-controls="navbar-search" />

        <Navbar.Collapse id="navbar-search">
          
          <Form className="d-flex flex-grow-1 my-2 my-lg-0 mx-lg-4" onSubmit={handleSearch}>
            <div className="input-group">
              <FormControl
                type="search"
                placeholder="Search..."
                className="border-end-0" 
                aria-label="Search"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <Button variant="outline-secondary" type="submit" className="border border-start-0">
                <FaSearch />
              </Button>
            </div>
          </Form>

          <Nav className="ms-auto align-items-center gap-3">
            
            <ThemeToggle />

            {user ? (
              <NavDropdown 
                title={
                  <span className="fw-semibold">
                    <FaUser className="me-1 mb-1 text-primary" /> {user.username}
                  </span>
                } 
                id="user-dropdown"
                align="end"
              >
                {/* 👇 CONDITIONAL RENDERING: Only show if user is admin (is_staff) */}
                {user.is_staff === true && (
                  <>
                    <NavDropdown.Item as={Link} to="/admin">
                      <FaTools className="me-2 text-muted" /> Admin Dashboard
                    </NavDropdown.Item>
                    <NavDropdown.Divider />
                  </>
                )}

                <NavDropdown.Item onClick={logout} className="text-danger">
                  <FaSignOutAlt className="me-2" /> Logout
                </NavDropdown.Item>
              </NavDropdown>
            ) : (
              <div className="d-flex gap-2 align-items-center">
                 <Button as={Link} to="/login" variant="primary" className="px-4 fw-bold">
                  Login
                </Button>
                <Nav.Link as={Link} to="/register" className="fw-semibold">
                  Sign Up
                </Nav.Link>
              </div>
            )}

            <Nav.Link as={Link} to="/cart" className="d-flex align-items-center fw-semibold">
              <FaShoppingCart className="fs-5 me-1" />
              <span>Cart</span>
            </Nav.Link>
        
            {/* Wishlist Link */}
            <Nav.Link as={Link} to="/wishlist" className="d-flex align-items-center fw-semibold me-3">
              <FaHeart className="fs-5 me-1 text-danger" />
              <span>Wishlist</span>
            </Nav.Link>

            <Nav.Link as={Link} to="/cart" className="d-flex align-items-center fw-semibold">
              <FaShoppingCart className="fs-5 me-1" />
              <span>Cart</span>
            </Nav.Link>

            {/* Hide Seller Link if user is already logged in */}
            {!user && (
               <Nav.Link as={Link} to="/seller/register" className="text-muted small ms-2">
                  Seller
               </Nav.Link>
            )}

          </Nav>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
};

export default AppNavbar;