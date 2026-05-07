import  { useState, useEffect, useRef } from 'react';
import { diffWords, type DiffResult } from '../utils/textCompare';

const BASE_URL = 'https://ielts-reading-app.onrender.com/api';

interface Article { id: number; title: string; }
interface Paragraph { id: number; content: string; }

// Báo cho TypeScript biết sự tồn tại của Speech API
declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

export default function MainReader() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [selectedArticleId, setSelectedArticleId] = useState<number | null>(null);
  const [paragraphs, setParagraphs] = useState<Paragraph[]>([]);
  const [currentParagraph, setCurrentParagraph] = useState<Paragraph | null>(null);

  const [userName, setUserName] = useState<string>('');
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [spokenText, setSpokenText] = useState<string>('');
  const [analyzedText, setAnalyzedText] = useState<DiffResult[]>([]);
  const [isCompleted, setIsCompleted] = useState<boolean>(false);
  const [attempts, setAttempts] = useState<number>(0);

  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    fetch(`${BASE_URL}/articles`).then(res => res.json()).then(data => setArticles(data));

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.lang = 'en-US';
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;

      recognitionRef.current.onresult = (event: any) => {
        let finalTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) finalTranscript += event.results[i][0].transcript + ' ';
        }
        if (finalTranscript) setSpokenText(prev => prev + finalTranscript);
      };
    }
  }, []);

  const handleSelectArticle = (articleId: number) => {
    setSelectedArticleId(articleId);
    setCurrentParagraph(null);
    fetch(`${BASE_URL}/articles/${articleId}/paragraphs`).then(res => res.json()).then(data => setParagraphs(data));
  };

  const toggleRecording = () => {
    if (!userName.trim()) return alert("Vui lòng nhập tên!");
    if (isRecording) {
      recognitionRef.current?.stop();
      setIsRecording(false);
      setAttempts(prev => prev + 1);
      if (currentParagraph) {
        analyzeResult(currentParagraph.content, spokenText);
      }
    } else {
      setSpokenText(''); setAnalyzedText([]); setIsCompleted(false);
      recognitionRef.current?.start(); setIsRecording(true);
    }
  };

  const analyzeResult = async (original: string, spoken: string) => {
    const result = diffWords(original, spoken);
    setAnalyzedText(result);
    if (!result.some(item => item.status === 'incorrect') && spoken.trim().length > 0) {
      setIsCompleted(true);
      if (currentParagraph) {
        await fetch(`${BASE_URL}/records/${currentParagraph.id}`, {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userName, attempts: attempts + 1 })
        });
      }
    }
  };

  return (
    <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
      <div className="md:col-span-1 bg-white p-4 rounded shadow-md h-fit">
        <h2 className="text-lg font-bold mb-4 border-b pb-2">Danh Sách Bài Đọc</h2>
        <ul className="space-y-2">
          {articles.map(a => (
            <li key={a.id}>
              <button onClick={() => handleSelectArticle(a.id)} className={`w-full text-left p-2 rounded transition ${selectedArticleId === a.id ? 'bg-blue-100 text-blue-700 font-semibold' : 'hover:bg-gray-100'}`}>{a.title}</button>
              {selectedArticleId === a.id && (
                <ul className="ml-4 mt-2 space-y-1 border-l-2 border-blue-200 pl-2">
                  {paragraphs.length === 0 && <li className="text-sm text-gray-400">Chưa có đoạn văn nào</li>}
                  {paragraphs.map((p, idx) => (
                    <li key={p.id}>
                      <button onClick={() => {setCurrentParagraph(p); setSpokenText(''); setAnalyzedText([]); setIsCompleted(false); setAttempts(0);}} className={`text-sm w-full text-left p-1 rounded ${currentParagraph?.id === p.id ? 'text-blue-600 font-medium bg-blue-50' : 'text-gray-600 hover:text-black'}`}>Đoạn {idx + 1}</button>
                    </li>
                  ))}
                </ul>
              )}
            </li>
          ))}
        </ul>
      </div>

      <div className="md:col-span-2 bg-white p-6 rounded shadow-md">
        {!currentParagraph ? <div className="text-gray-500 text-center mt-10">Vui lòng chọn một đoạn văn ở menu bên trái để bắt đầu luyện đọc.</div> : (
          <>
            <div className="flex gap-4 mb-6">
              <input type="text" placeholder="Nhập họ tên..." className="border p-2 flex-1 rounded outline-none focus:ring-2 focus:ring-blue-400" value={userName} onChange={(e) => setUserName(e.target.value)} disabled={isRecording || isCompleted} />
              <button onClick={toggleRecording} disabled={isCompleted} className={`min-w-[150px] px-6 py-2 rounded text-white font-semibold transition ${isCompleted ? 'bg-gray-400 cursor-not-allowed' : isRecording ? 'bg-red-500 hover:bg-red-600 animate-pulse' : 'bg-blue-500 hover:bg-blue-600'}`}>
                {isRecording ? 'Ngừng & Chấm Điểm' : 'Bắt Đầu Đọc'}
              </button>
            </div>
            <div className="bg-gray-50 border p-6 rounded-lg text-xl mb-4 leading-relaxed min-h-[150px]">
              {analyzedText.length > 0 ? analyzedText.map((item, i) => (
                <span key={i} className={item.status === 'correct' ? 'text-green-600' : 'text-red-500 font-bold underline bg-red-50'}>{item.originalWord} </span>
              )) : <p className="text-gray-800">{currentParagraph.content}</p>}
            </div>
            {isCompleted && (
              <div className="mt-4 p-4 bg-green-100 text-green-800 rounded border border-green-300 flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-lg">🎉 Hoàn Thành Xuất Sắc!</h3>
                  <p>Chúc mừng {userName}, bạn đã đọc chuẩn 100% đoạn văn này (Sau {attempts} lần thử).</p>
                </div>
                <button onClick={() => {setSpokenText(''); setAnalyzedText([]); setIsCompleted(false); setAttempts(0);}} className="text-sm bg-white px-3 py-1 rounded shadow text-green-700 hover:bg-green-50">
                  Đọc lại
                </button>
              </div>
            )}
            {!isCompleted && analyzedText.length > 0 && (
              <div className="text-red-500 text-sm italic">
                * Các từ in đỏ và gạch chân là từ bạn đọc sai hoặc bỏ sót. Hãy thử lại nhé!
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}