import { useState, useEffect, useRef } from 'react';
import { diffWords, type DiffResult } from '../utils/textCompare';

const BASE_URL = 'https://ielts-reading-app.onrender.com/api';

interface Article { id: number; title: string; }
interface Paragraph { id: number; content: string; }

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
  
  const [analyzedText, setAnalyzedText] = useState<DiffResult[]>([]);
  const [isCompleted, setIsCompleted] = useState<boolean>(false);
  const [attempts, setAttempts] = useState<number>(0);

  const recognitionRef = useRef<any>(null);
  const finalTranscriptRef = useRef<string>('');

  useEffect(() => {
    fetch(`${BASE_URL}/articles`).then(res => res.json()).then(data => setArticles(data));

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.lang = 'en-US';
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;

      recognitionRef.current.onresult = (event: any) => {
        let currentTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            currentTranscript += event.results[i][0].transcript + ' ';
          }
        }
        if (currentTranscript) {
          finalTranscriptRef.current += currentTranscript;
        }
      };

      recognitionRef.current.onend = () => {
        if (currentParagraph && finalTranscriptRef.current.trim().length > 0) {
          analyzeResult(currentParagraph.content, finalTranscriptRef.current);
        }
      };
    }
  }, [currentParagraph]);

  const handleSelectArticle = (articleId: number) => {
    setSelectedArticleId(articleId);
    setCurrentParagraph(null);
    fetch(`${BASE_URL}/articles/${articleId}/paragraphs`).then(res => res.json()).then(data => setParagraphs(data));
  };

  const toggleRecording = () => {
    if (!userName.trim()) return alert("Vui lòng nhập tên của bạn trước nhé!");
    
    if (isRecording) {
      recognitionRef.current?.stop();
      setIsRecording(false);
      setAttempts(prev => prev + 1);
    } else {
      finalTranscriptRef.current = '';
      setAnalyzedText([]);
      setIsCompleted(false);
      try {
        recognitionRef.current?.start();
        setIsRecording(true);
      } catch (err) {
        console.error("Speech recognition error:", err);
      }
    }
  };

  const analyzeResult = async (original: string, spoken: string) => {
    const result = diffWords(original, spoken);
    setAnalyzedText(result);
    
    const hasError = result.some(item => item.status === 'incorrect');
    if (!hasError && spoken.trim().length > 0) {
      setIsCompleted(true);
      if (currentParagraph) {
        await fetch(`${BASE_URL}/records/${currentParagraph.id}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userName, attempts: attempts + 1 })
        });
      }
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
      {/* Sidebar - Menu chọn bài */}
      <div className="lg:col-span-1">
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 lg:sticky lg:top-24">
          <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
            <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"></path></svg>
            Thư viện bài đọc
          </h2>
          <ul className="space-y-2 max-h-[40vh] lg:max-h-[70vh] overflow-y-auto pr-2 custom-scrollbar">
            {Array.isArray(articles) && articles.map(a => (
              <li key={a.id}>
                <button 
                  onClick={() => handleSelectArticle(a.id)} 
                  className={`w-full text-left px-4 py-3 rounded-xl transition-all duration-200 ${selectedArticleId === a.id ? 'bg-blue-50 text-blue-700 font-semibold shadow-inner border border-blue-100' : 'text-slate-600 hover:bg-slate-50 border border-transparent'}`}
                >
                  {a.title}
                </button>
                {selectedArticleId === a.id && (
                  <ul className="mt-2 ml-4 space-y-1 relative before:absolute before:inset-y-0 before:left-0 before:w-[2px] before:bg-blue-100">
                    {Array.isArray(paragraphs) && paragraphs.map((p, idx) => (
                      <li key={p.id} className="relative">
                        <button 
                          onClick={() => {
                            setCurrentParagraph(p); 
                            setAnalyzedText([]); 
                            setIsCompleted(false); 
                            setAttempts(0);
                          }} 
                          className={`text-sm w-full text-left px-4 py-2 rounded-r-xl transition-colors ${currentParagraph?.id === p.id ? 'text-blue-600 font-medium bg-gradient-to-r from-blue-50 to-transparent border-l-2 border-blue-500 -ml-[2px]' : 'text-slate-500 hover:text-slate-800'}`}
                        >
                          Đoạn {idx + 1}
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Main Content - Khu vực đọc */}
      <div className="lg:col-span-3">
        <div className="bg-white p-6 sm:p-8 rounded-2xl shadow-sm border border-slate-100 min-h-[60vh] flex flex-col">
          {!currentParagraph ? (
            <div className="flex-1 flex flex-col items-center justify-center text-slate-400 space-y-4">
              <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center">
                <svg className="w-10 h-10 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122"></path></svg>
              </div>
              <p className="text-lg">Hãy chọn một đoạn văn bên trái để bắt đầu luyện tập</p>
            </div>
          ) : (
            <div className="animate-fade-in flex-1">
              {/* Toolbar */}
              <div className="flex flex-col sm:flex-row gap-4 mb-8">
                <div className="relative flex-1">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <svg className="h-5 w-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path></svg>
                  </div>
                  <input 
                    type="text" 
                    placeholder="Nhập họ tên của bạn..." 
                    className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 focus:bg-white transition-all" 
                    value={userName} 
                    onChange={(e) => setUserName(e.target.value)} 
                    disabled={isRecording || isCompleted} 
                  />
                </div>
                
                <button 
                  onClick={toggleRecording} 
                  disabled={isCompleted} 
                  className={`flex items-center justify-center gap-2 px-8 py-3 rounded-xl font-semibold text-white transition-all shadow-md active:scale-95 sm:min-w-[200px] ${isCompleted ? 'bg-slate-300 shadow-none cursor-not-allowed' : isRecording ? 'bg-rose-500 hover:bg-rose-600 hover:shadow-rose-500/25 animate-pulse' : 'bg-blue-600 hover:bg-blue-700 hover:shadow-blue-600/25'}`}
                >
                  {isRecording ? (
                    <>
                      <div className="w-2.5 h-2.5 rounded-full bg-white animate-bounce"></div>
                      Ngừng & Chấm Điểm
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"></path></svg>
                      Bắt Đầu Đọc
                    </>
                  )}
                </button>
              </div>

              {/* Reading Area */}
              <div className="bg-slate-50/50 border border-slate-100 p-6 sm:p-8 rounded-2xl text-lg sm:text-xl leading-loose min-h-[250px] shadow-inner text-slate-700">
                {analyzedText.length > 0 ? (
                  <div className="space-x-1">
                    {analyzedText.map((item, i) => (
                      <span 
                        key={i} 
                        className={`transition-colors duration-300 ${item.status === 'correct' ? 'text-slate-800' : 'text-rose-600 font-semibold bg-rose-100/50 border-b-2 border-rose-300 rounded-sm px-1'}`}
                      >
                        {item.originalWord}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p>{currentParagraph.content}</p>
                )}
              </div>

              {/* Success Message */}
              {isCompleted && (
                <div className="mt-6 p-5 bg-emerald-50 border border-emerald-200 rounded-xl flex items-start gap-4 animate-fade-in-up">
                  <div className="bg-emerald-100 p-2 rounded-full mt-1">
                    <svg className="w-6 h-6 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                  </div>
                  <div>
                    <h3 className="font-bold text-lg text-emerald-800">Hoàn Thành Xuất Sắc!</h3>
                    <p className="text-emerald-700 mt-1">Chúc mừng <strong className="font-semibold">{userName}</strong>, bạn đã phát âm chuẩn 100% đoạn văn này sau {attempts} lần thử.</p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}