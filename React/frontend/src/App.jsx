import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { AuthProvider } from './context/AuthContext';
import AppNavbar from './components/common/Navbar';
import { ThemeProvider } from './context/ThemeContext';

import ProductList from './pages/shop/ProductList';
import ProductDetail from './pages/shop/ProductDetail';
import UserLogin from './pages/auth/UserLogin'; 
import UserRegister from './pages/auth/UserRegister';
import CartPage from './pages/cart/CartPage';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminRegister from './pages/auth/AdminRegister';
import AdminLogin from './pages/auth/AdminLogin';
import Wishlist from './pages/shop/Wishlist';
import Checkout from './pages/shop/Checkout';
import Success from './Success';
import Unknown from './unknown';

function App() {
  return (
    <Router>
      <ThemeProvider>
      <AuthProvider>
        <AppNavbar />
        <ToastContainer 
            position="top-right"
            autoClose={3000}
            hideProgressBar={false}
            newestOnTop={false}
            closeOnClick
            rtl={false}
            pauseOnFocusLoss
            draggable
            pauseOnHover
            theme="colored"
          />
        <Routes>
          <Route path="/" element={<ProductList />} />
          <Route path="/product/:id" element={<ProductDetail />} />
          <Route path="/login" element={<UserLogin />} />
          <Route path="/register" element={<UserRegister />} />
          <Route path="/cart" element={<CartPage />} />
          <Route path="/wishlist" element={<Wishlist />} />
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/seller/register" element={<AdminRegister />} />
          <Route path="/seller/login" element={<AdminLogin />} />
          <Route path="/checkout" element={<Checkout />} />
          <Route path="*" element={<Unknown />} />
          <Route path="/success" element={<Success />} />
        </Routes>
      </AuthProvider>
      </ThemeProvider>
    </Router>
  );
}

export default App;