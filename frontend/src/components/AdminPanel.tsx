import React, { useState, useEffect } from 'react';

const BASE_URL = 'http://localhost:8080/api';

interface Article {
  id: number;
  title: string;
}

interface ReadingRecord {
  id: number;
  userName: string;
  paragraph: { id: number };
  completedAt: string;
}

export default function AdminPanel() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [password, setPassword] = useState<string>('');
  
  const [articles, setArticles] = useState<Article[]>([]);
  const [records, setRecords] = useState<ReadingRecord[]>([]);
  
  const [newArticleTitle, setNewArticleTitle] = useState<string>('');
  const [selectedArticleId, setSelectedArticleId] = useState<string>('');
  const [newParagraphContent, setNewParagraphContent] = useState<string>('');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === 'Thanhcoi1507') {
      setIsAuthenticated(true);
      fetchData();
    } else {
      alert("Mật khẩu không chính xác!");
    }
  };

  const fetchData = async () => {
    try {
      const articleRes = await fetch(`${BASE_URL}/articles`);
      setArticles(await articleRes.json());
      const recordRes = await fetch(`${BASE_URL}/records`);
      setRecords(await recordRes.json());
    } catch (error) {
      console.error("Lỗi:", error);
    }
  };

  const handleAddArticle = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newArticleTitle) return;
    await fetch(`${BASE_URL}/articles`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: newArticleTitle })
    });
    setNewArticleTitle('');
    fetchData();
  };

  const handleAddParagraph = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedArticleId || !newParagraphContent) return;
    await fetch(`${BASE_URL}/paragraphs/${selectedArticleId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: newParagraphContent, orderIndex: 1 })
    });
    setNewParagraphContent('');
    alert("Thêm đoạn văn thành công!");
  };

  const handleDeleteArticle = async (id: number) => {
    if (window.confirm("Chắc chắn xóa bài này?")) {
      await fetch(`${BASE_URL}/articles/${id}`, { method: 'DELETE' });
      fetchData();
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="max-w-md mx-auto mt-20 bg-white p-8 rounded shadow-md">
        <h2 className="text-2xl font-bold mb-6 text-center">Đăng Nhập Admin</h2>
        <form onSubmit={handleLogin} className="flex flex-col gap-4">
          <input type="password" placeholder="Nhập mật khẩu..." value={password} onChange={(e) => setPassword(e.target.value)} className="border p-2 rounded outline-none focus:ring-2 focus:ring-blue-500" />
          <button type="submit" className="bg-gray-800 text-white py-2 rounded hover:bg-gray-700">Vào Trang</button>
        </form>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8">
      <div className="bg-white p-6 rounded shadow-md">
        <h2 className="text-xl font-bold mb-4 border-b pb-2">Quản lý Bài đọc</h2>
        <form onSubmit={handleAddArticle} className="flex gap-2 mb-6">
          <input type="text" placeholder="Tên bài (VD: Test 1)..." value={newArticleTitle} onChange={(e) => setNewArticleTitle(e.target.value)} className="border p-2 rounded flex-1 outline-none focus:ring-2 focus:ring-green-500" />
          <button type="submit" className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700">Thêm Bài</button>
        </form>
        <ul className="mb-8 space-y-2">
          {articles.map(a => (
            <li key={a.id} className="flex justify-between bg-gray-50 p-3 rounded border">
              <span className="font-semibold">{a.title}</span>
              <button onClick={() => handleDeleteArticle(a.id)} className="text-red-500 text-sm hover:underline">Xóa</button>
            </li>
          ))}
        </ul>

        <h2 className="text-xl font-bold mb-4 border-b pb-2">Thêm Đoạn văn</h2>
        <form onSubmit={handleAddParagraph} className="flex flex-col gap-3">
          <select className="border p-2 rounded outline-none focus:ring-2 focus:ring-blue-500" onChange={(e) => setSelectedArticleId(e.target.value)} value={selectedArticleId}>
            <option value="" disabled>-- Chọn bài đọc --</option>
            {articles.map(a => <option key={a.id} value={a.id}>{a.title}</option>)}
          </select>
          <textarea rows={5} placeholder="Dán nội dung..." value={newParagraphContent} onChange={(e) => setNewParagraphContent(e.target.value)} className="border p-2 rounded outline-none focus:ring-2 focus:ring-blue-500"></textarea>
          <button type="submit" className="bg-blue-600 text-white py-2 rounded hover:bg-blue-700">Lưu Đoạn Văn</button>
        </form>
      </div>

      <div className="bg-white p-6 rounded shadow-md">
        <h2 className="text-xl font-bold mb-4 border-b pb-2">Lịch sử Luyện đọc</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead><tr className="bg-gray-100"><th className="p-2 border">Họ tên</th><th className="p-2 border text-center">Đoạn</th><th className="p-2 border">Thời gian</th></tr></thead>
            <tbody>
              {records.length === 0 ? <tr><td colSpan={3} className="text-center p-4 text-gray-500">Chưa có dữ liệu</td></tr> : 
              records.map(r => (
                <tr key={r.id} className="hover:bg-gray-50">
                  <td className="p-2 border font-medium">{r.userName}</td>
                  <td className="p-2 border text-center">{r.paragraph.id}</td>
                  <td className="p-2 border text-sm text-gray-600">{new Date(r.completedAt).toLocaleString('vi-VN')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}