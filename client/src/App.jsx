import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { useContext } from 'react';
import { AuthProvider, AuthContext } from './context/AuthContext';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import Login from './pages/Login';
import Register from './pages/Register';
import ProtectedRoute from './components/ProtectedRoute';
import Dashboard from './pages/Dashboard';
import Upload from './pages/Upload';
import Transactions from './pages/Transactions';
import FilterRules from './pages/FilterRules';
import Home from './pages/Home';
import About from './pages/About';
import Help from './pages/Help';
import VerifyEmail from './pages/VerifyEmail';
import AdminDashboard from './pages/AdminDashboard';

// Global Layout Component
function AppLayout() {
    const { user, loading } = useContext(AuthContext);

    if (loading) return <div>Loading...</div>;

    return (
        <div className="app-root">
            <Navbar />
            <div className="app-body">
                {/* Sidebar only renders if the user is logged in */}
                {user && <Sidebar />}
                <main className="main-content">
                    <Routes>
                        <Route path="/" element={<Home />} />
                        <Route path="/login" element={<Login />} />
                        <Route path="/register" element={<Register />} />
                        <Route path="/about" element={<About />} />
                        <Route path="/help" element={<Help />} />
                        <Route path="/verify-email" element={<VerifyEmail />} />
                        
                        {/* Protected Routes */}
                        <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
                        <Route path="/upload" element={<ProtectedRoute><Upload /></ProtectedRoute>} />
                        <Route path="/transactions" element={<ProtectedRoute><Transactions /></ProtectedRoute>} />
                        <Route path="/filter-rules" element={<ProtectedRoute><FilterRules /></ProtectedRoute>} />
                        <Route path="/admin" element={<ProtectedRoute><AdminDashboard /></ProtectedRoute>} />
                    </Routes>
                </main>
            </div>
        </div>
    );
}

function App() {
    return (
        <AuthProvider>
            <Router>
                <AppLayout />
            </Router>
        </AuthProvider>
    );
}

export default App;
