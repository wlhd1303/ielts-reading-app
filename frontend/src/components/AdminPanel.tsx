import React, { useState } from 'react';

const BASE_URL = 'https://ielts-reading-app.onrender.com/api';

interface Article { id: number; title: string; }
interface ReadingRecord { id: number; userName: string; paragraph: { id: number }; completedAt: string; }

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
      console.error("Lỗi kết nối:", error);
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
    alert("Đã thêm đoạn văn thành công!");
  };

  const handleDeleteArticle = async (id: number) => {
    if (window.confirm("Hệ thống sẽ xóa bài đọc này và TẤT CẢ đoạn văn bên trong. Tiếp tục?")) {
      await fetch(`${BASE_URL}/articles/${id}`, { method: 'DELETE' });
      fetchData();
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-white p-8 rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-2xl mx-auto flex items-center justify-center mb-4">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path></svg>
            </div>
            <h2 className="text-2xl font-bold text-slate-800">Quản Trị Hệ Thống</h2>
            <p className="text-slate-500 mt-2 text-sm">Vui lòng nhập mật khẩu để tiếp tục</p>
          </div>
          <form onSubmit={handleLogin} className="space-y-5">
            <input 
              type="password" 
              placeholder="Nhập mật khẩu..." 
              value={password} 
              onChange={(e) => setPassword(e.target.value)} 
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 focus:bg-white transition-all text-center tracking-widest" 
            />
            <button type="submit" className="w-full bg-slate-800 text-white py-3 rounded-xl font-medium hover:bg-slate-900 transition-colors shadow-md">
              Xác Nhận
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
      {/* Cột trái: Quản lý bài đọc */}
      <div className="lg:col-span-5 space-y-8">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <h2 className="text-lg font-bold text-slate-800 mb-5">Tạo Bài Đọc Mới</h2>
          <form onSubmit={handleAddArticle} className="flex gap-3">
            <input type="text" placeholder="Tên bài (VD: Test 1)..." value={newArticleTitle} onChange={(e) => setNewArticleTitle(e.target.value)} className="flex-1 px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500/50" />
            <button type="submit" className="bg-blue-600 text-white px-5 py-2 rounded-xl font-medium hover:bg-blue-700 transition-colors shadow-sm">Thêm</button>
          </form>

          <div className="mt-6">
            <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3">Danh sách hiện tại</h3>
            <ul className="space-y-2 max-h-[300px] overflow-y-auto custom-scrollbar pr-2">
              {Array.isArray(articles) && articles.map(a => (
                <li key={a.id} className="flex justify-between items-center group bg-white border border-slate-100 hover:border-blue-200 p-3 rounded-xl transition-colors shadow-sm">
                  <span className="font-medium text-slate-700">{a.title}</span>
                  <button onClick={() => handleDeleteArticle(a.id)} className="text-slate-400 hover:text-rose-500 hover:bg-rose-50 p-2 rounded-lg transition-colors">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <h2 className="text-lg font-bold text-slate-800 mb-5">Thêm Đoạn Văn</h2>
          <form onSubmit={handleAddParagraph} className="flex flex-col gap-4">
            <select className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500/50 text-slate-700" onChange={(e) => setSelectedArticleId(e.target.value)} value={selectedArticleId}>
              <option value="" disabled>-- Lựa chọn Bài đọc --</option>
              {Array.isArray(articles) && articles.map(a => <option key={a.id} value={a.id}>{a.title}</option>)}
            </select>
            <textarea rows={6} placeholder="Dán nội dung tiếng Anh vào đây..." value={newParagraphContent} onChange={(e) => setNewParagraphContent(e.target.value)} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500/50 resize-none"></textarea>
            <button type="submit" className="w-full bg-slate-800 text-white py-3 rounded-xl font-medium hover:bg-slate-900 transition-colors shadow-md">
              Lưu Vào CSDL
            </button>
          </form>
        </div>
      </div>

      {/* Cột phải: Bảng thống kê */}
      <div className="lg:col-span-7">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 h-full">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-bold text-slate-800">Lịch Sử Luyện Tập</h2>
            <span className="bg-emerald-100 text-emerald-700 text-xs font-bold px-3 py-1 rounded-full">{Array.isArray(records) ? records.length : 0} lượt hoàn thành</span>
          </div>
          
          <div className="overflow-x-auto rounded-xl border border-slate-100">
            <table className="w-full text-left border-collapse whitespace-nowrap">
              <thead>
                <tr className="bg-slate-50 text-slate-500 text-sm uppercase tracking-wider">
                  <th className="p-4 font-semibold">Học Viên</th>
                  <th className="p-4 font-semibold text-center">Đoạn Văn ID</th>
                  <th className="p-4 font-semibold text-right">Hoàn Thành Lúc</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {!Array.isArray(records) || records.length === 0 ? (
                  <tr><td colSpan={3} className="text-center p-8 text-slate-400">Chưa có ai hoàn thành bài tập nào.</td></tr>
                ) : (
                  records.map(r => (
                    <tr key={r.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="p-4 font-medium text-slate-800 flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-500 to-indigo-500 text-white flex items-center justify-center text-xs font-bold uppercase">
                          {r.userName.charAt(0)}
                        </div>
                        {r.userName}
                      </td>
                      <td className="p-4 text-center">
                        <span className="bg-slate-100 text-slate-600 px-2 py-1 rounded text-sm font-mono">#{r.paragraph?.id}</span>
                      </td>
                      <td className="p-4 text-sm text-slate-500 text-right">
                        {new Date(r.completedAt).toLocaleString('vi-VN', {
                          hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit', year: 'numeric'
                        })}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}