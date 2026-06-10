
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './Navbar';
import Home from './Home';
import Variety from './Variety';
import Login from './Login';
import Feedback from './Feedback';
import TrackOrder from './TrackOrder';
import ProductDetail from './ProductDetail';
import OrderForm from './OrderForm';
import Cart from './Cart';
import UserProfile from './UserProfile';
import AdminDashboard from './AdminDashboard';
import GiftBackground from './GiftBackground';
import Footer from './Footer';
import ConnectionStatus from './ConnectionStatus';
import BackToTop from './BackToTop';
import ProtectedRoute from './ProtectedRoute';
import './index.css';

function App() {
  return (
    <Router>
      <Navbar />
      <ConnectionStatus />
      <BackToTop />
      <GiftBackground />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/variety" element={<Variety />} />
        <Route path="/variety/:category" element={<Variety />} />
        <Route path="/product/:id" element={<ProductDetail />} />
        <Route path="/profile" element={
          <ProtectedRoute>
            <UserProfile />
          </ProtectedRoute>
        } />
        <Route path="/track-order" element={<TrackOrder />} />
        <Route path="/checkout" element={
          <ProtectedRoute>
            <OrderForm />
          </ProtectedRoute>
        } />
        <Route path="/cart" element={<Cart />} />
        <Route path="/admin" element={
          <ProtectedRoute adminOnly={true}>
            <AdminDashboard />
          </ProtectedRoute>
        } />
        <Route path="/login" element={<Login />} />
        <Route path="/feedback" element={<Feedback />} />
      </Routes>
      <Footer />
    </Router>
  );
}

export default App;
