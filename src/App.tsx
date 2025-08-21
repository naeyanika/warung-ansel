import { FileText, LogIn } from 'lucide-react';
import { Navigate, Route, BrowserRouter as Router, Routes } from 'react-router-dom';
import Layout from './components/Layout';
import LoginForm from './components/LoginForm';
import OrdersManagement from './components/OrdersManagement';
import EriCateringSection from './components/sections/EriCateringSection';
import JastipSection from './components/sections/JastipSection';
import { AuthProvider, useAuth } from './contexts/AuthContext';

function HomePage() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-cyan-600 to-blue-600 rounded-2xl shadow-lg p-6 text-white">
        <h2 className="text-2xl font-bold mb-2">Selamat Datang!</h2>
        <p className="text-cyan-100 mb-4">
          Pilih layanan yang Anda butuhkan di bawah ini
        </p>
        <div className="flex gap-3">
          {!user && (
            <button
              onClick={() => {
                const loginSection = document.getElementById('login-section');
                loginSection?.scrollIntoView({ behavior: 'smooth' });
              }}
              className="inline-flex items-center gap-2 bg-white text-cyan-600 px-4 py-2 rounded-lg font-medium hover:bg-cyan-50 transition-colors"
            >
              <LogIn className="h-4 w-4" />
              Login sebagai Admin
            </button>
          )}
          {user && (
            <a
              href="/orders"
              className="inline-flex items-center gap-2 bg-white text-cyan-600 px-4 py-2 rounded-lg font-medium hover:bg-cyan-50 transition-colors"
            >
              <FileText className="h-4 w-4" />
              Kelola Pesanan
            </a>
          )}
        </div>
      </div>

      {/* Main Sections */}
      <JastipSection />
      <EriCateringSection />
  {/* <WarungAuditSection /> */}

      {/* Login Section for Non-authenticated Users */}
      {!user && (
        <div id="login-section" className="pt-6">
          <LoginForm />
        </div>
      )}
    </div>
  );
}

function LoginPage() {
  return (
    <div className="flex items-center justify-center min-h-[70vh]">
      <LoginForm />
    </div>
  );
}

function AppContent() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/orders" element={<OrdersManagement />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Layout>
  );
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <AppContent />
      </Router>
    </AuthProvider>
  );
}

export default App;