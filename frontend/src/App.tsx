
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import MainReader from './components/MainReader';
import AdminPanel from './components/AdminPanel';

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gray-50 text-gray-800 font-sans">
        <nav className="bg-white shadow-md p-4 flex justify-between items-center mb-6">
          <Link to="/" className="text-xl font-bold text-blue-600">IELTS Reading Pro</Link>
          <Link to="/admin" className="text-sm font-semibold text-gray-500 hover:text-blue-600 transition">Trang Quản Trị</Link>
        </nav>
        <div className="p-6">
          <Routes>
            <Route path="/" element={<MainReader />} />
            <Route path="/admin" element={<AdminPanel />} />
          </Routes>
        </div>
      </div>
    </Router>
  );
}

export default App;