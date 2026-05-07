import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import MainReader from './components/MainReader';
import AdminPanel from './components/AdminPanel';

function Navigation() {
  const location = useLocation();
  const isAdmin = location.pathname === '/admin';

  return (
    <nav className="bg-white/80 backdrop-blur-md border-b border-slate-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link to="/" className="flex items-center gap-2 transition-transform hover:scale-105">
            <div className="w-8 h-8 bg-blue-600 text-white rounded-lg flex items-center justify-center font-bold text-xl shadow-sm">
              I
            </div>
            <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-700 to-blue-500">
              IELTS Reading Pro
            </span>
          </Link>
          <Link 
            to={isAdmin ? "/" : "/admin"} 
            className="text-sm font-medium text-slate-500 hover:text-blue-600 bg-slate-50 hover:bg-blue-50 px-4 py-2 rounded-full transition-all"
          >
            {isAdmin ? "Về Trang Đọc" : "Quản Trị Viên"}
          </Link>
        </div>
      </div>
    </nav>
  );
}

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-slate-50 text-slate-800 font-sans selection:bg-blue-200 selection:text-blue-900">
        <Navigation />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Routes>
            <Route path="/" element={<MainReader />} />
            <Route path="/admin" element={<AdminPanel />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;