import { useState, useEffect, useRef } from 'react';
import { diffWords, type DiffResult } from '../utils/textCompare';

const BASE_URL = 'https://ielts-reading-app.onrender.com/api';

interface Article { id: number; title: string; }
interface Paragraph { id: number; content: string; }
interface WrongWord { word: string; phonetic: string; }

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
  const [paragraphCache, setParagraphCache] = useState<Record<number, Paragraph[]>>({});
  const [isLoadingParagraphs, setIsLoadingParagraphs] = useState<boolean>(false);
  const [currentParagraph, setCurrentParagraph] = useState<Paragraph | null>(null);

  const [userName, setUserName] = useState<string>('');
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [isGrading, setIsGrading] = useState<boolean>(false);
  
  const [analyzedText, setAnalyzedText] = useState<DiffResult[]>([]);
  const [score, setScore] = useState<number | null>(null);
  const [wrongWords, setWrongWords] = useState<WrongWord[]>([]);
  
  const [attempts, setAttempts] = useState<number>(0);

  const recognitionRef = useRef<any>(null);
  const finalTranscriptRef = useRef<string>('');

  useEffect(() => {
    fetch(`${BASE_URL}/articles`)
      .then(res => res.json())
      .then(data => setArticles(data))
      .catch(err => console.error("Lỗi tải danh sách bài:", err));
  }, []);

  // Hàm dọn dẹp Micro triệt để
  const forceStopAndCleanMic = () => {
    if (recognitionRef.current) {
      recognitionRef.current.onend = null;
      recognitionRef.current.onstart = null;
      recognitionRef.current.onerror = null;
      try {
        recognitionRef.current.abort();
      } catch (e) {}
      recognitionRef.current = null;
    }
    setIsRecording(false);
    setIsGrading(false);
  };

  const handleSelectArticle = async (articleId: number) => {
    forceStopAndCleanMic();
    
    setSelectedArticleId(articleId);
    setCurrentParagraph(null); 
    setScore(null);
    setAnalyzedText([]);
    setWrongWords([]);

    if (paragraphCache[articleId]) {
      setParagraphs(paragraphCache[articleId]);
      return;
    }

    setIsLoadingParagraphs(true);
    try {
      const res = await fetch(`${BASE_URL}/articles/${articleId}/paragraphs`);
      const data = await res.json();
      setParagraphs(data);
      setParagraphCache(prev => ({ ...prev, [articleId]: data }));
    } catch (error) {
      console.error("Lỗi tải đoạn văn", error);
    } finally {
      setIsLoadingParagraphs(false);
    }
  };

  const toggleRecording = () => {
    if (!userName.trim()) return alert("Vui lòng nhập tên của bạn trước nhé!");
    
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Trình duyệt không hỗ trợ. Vui lòng dùng Google Chrome!");
      return;
    }

    if (isRecording) {
      // Hiện Loading ngay lập tức khi bấm dừng
      setIsGrading(true); 
      if (recognitionRef.current) recognitionRef.current.stop();
      setAttempts(prev => prev + 1);
    } else {
      // Dọn dẹp sạch sẽ Micro cũ nếu có trước khi "Đọc lại lần nữa"
      forceStopAndCleanMic();

      finalTranscriptRef.current = '';
      setAnalyzedText([]);
      setScore(null);
      setWrongWords([]);
      
      const recognition = new SpeechRecognition();
      recognition.lang = 'en-US';
      recognition.continuous = true;
      recognition.interimResults = true;

      recognition.onstart = () => setIsRecording(true);
      
      recognition.onerror = (event: any) => {
        console.error("Lỗi Micro:", event.error);
        setIsRecording(false);
        setIsGrading(false);
        if (event.error === 'not-allowed') {
          alert("Vui lòng cấp quyền sử dụng Micro cho trình duyệt nhé!");
        }
      };

      recognition.onresult = (event: any) => {
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

      recognition.onend = () => {
        setIsRecording(false);
        if (currentParagraph && finalTranscriptRef.current.trim().length > 0) {
          analyzeResult(currentParagraph.content, finalTranscriptRef.current);
        } else {
          setIsGrading(false); 
          if (finalTranscriptRef.current.trim().length === 0) {
             alert("Hệ thống chưa nghe được bạn nói gì. Hãy bấm đọc lại và nói to hơn nhé!");
          }
        }
      };

      recognitionRef.current = recognition;

      try {
        recognition.start();
      } catch (err) {
        console.error("Lỗi khởi động Micro:", err);
        setIsGrading(false);
        setIsRecording(false);
      }
    }
  };

  const fetchPhonetics = async (words: string[]) => {
    const uniqueWords = Array.from(new Set(words));
    const promises = uniqueWords.map(async (word) => {
      try {
        const res = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${word}`);
        if (res.ok) {
          const data = await res.json();
          const p = data[0]?.phonetics?.find((p: any) => p.text);
          return { word, phonetic: p ? p.text : '' };
        }
      } catch (e) {}
      return { word, phonetic: '' };
    });
    return Promise.all(promises);
  };

  const analyzeResult = async (original: string, spoken: string) => {
    setIsGrading(true);
    try {
      // Fake delay nhẹ để người dùng cảm thấy hệ thống đang làm việc
      await new Promise(resolve => setTimeout(resolve, 800));

      const result = diffWords(original, spoken);
      setAnalyzedText(result);
      
      const totalWords = result.length;
      const correctWords = result.filter(r => r.status === 'correct').length;
      const currentScore = totalWords > 0 ? Math.round((correctWords / totalWords) * 100) : 0;
      setScore(currentScore);

      const incorrectCleanWords = result.filter(r => r.status === 'incorrect' && r.cleanWord).map(r => r.cleanWord);
      if (incorrectCleanWords.length > 0) {
        const phoneticsData = await fetchPhonetics(incorrectCleanWords);
        setWrongWords(phoneticsData);
      } else {
        setWrongWords([]);
      }

      if (currentScore >= 80 && spoken.trim().length > 0) {
        if (currentParagraph) {
          await fetch(`${BASE_URL}/records/${currentParagraph.id}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userName, attempts: attempts + 1 })
          });
        }
      }
    } catch (error) {
      console.error("Lỗi khi chấm điểm:", error);
    } finally {
      setIsGrading(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
      {/* Sidebar chọn bài */}
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
                    {isLoadingParagraphs ? (
                       <li className="text-sm text-blue-500 p-2 italic animate-pulse font-medium">Đang tải đoạn văn...</li>
                    ) : (
                      Array.isArray(paragraphs) && paragraphs.map((p, idx) => (
                        <li key={p.id} className="relative">
                          <button 
                            onClick={() => {
                              forceStopAndCleanMic();
                              setCurrentParagraph(p); 
                              setAnalyzedText([]); 
                              setScore(null);
                              setWrongWords([]);
                              setAttempts(0);
                            }} 
                            className={`text-sm w-full text-left px-4 py-2 rounded-r-xl transition-colors ${currentParagraph?.id === p.id ? 'text-blue-600 font-medium bg-gradient-to-r from-blue-50 to-transparent border-l-2 border-blue-500 -ml-[2px]' : 'text-slate-500 hover:text-slate-800'}`}
                          >
                            Đoạn {idx + 1}
                          </button>
                        </li>
                      ))
                    )}
                  </ul>
                )}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Khu vực đọc chính */}
      <div className="lg:col-span-3">
        <div className="bg-white p-6 sm:p-8 rounded-2xl shadow-sm border border-slate-100 min-h-[60vh] flex flex-col">
          {!currentParagraph ? (
            <div className="flex-1 flex flex-col items-center justify-center text-slate-400 space-y-4">
              <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center">
                <svg className="w-10 h-10 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122"></path></svg>
              </div>
              <p className="text-lg text-center px-4">Hãy chọn một đoạn văn bên trái để bắt đầu luyện tập</p>
            </div>
          ) : (
            <div className="animate-fade-in flex-1">
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
                    disabled={isRecording || isGrading} 
                  />
                </div>
                
                <button 
                  onClick={toggleRecording} 
                  disabled={isGrading}
                  className={`flex items-center justify-center gap-2 px-8 py-3 rounded-xl font-semibold text-white transition-all shadow-md sm:min-w-[200px] ${isGrading ? 'bg-slate-400 cursor-not-allowed shadow-none' : isRecording ? 'bg-rose-500 hover:bg-rose-600 active:scale-95 hover:shadow-rose-500/25 animate-pulse' : 'bg-blue-600 hover:bg-blue-700 active:scale-95 hover:shadow-blue-600/25'}`}
                >
                  {isRecording && !isGrading ? (
                    <><div className="w-2.5 h-2.5 rounded-full bg-white animate-bounce"></div>Ngừng & Chấm Điểm</>
                  ) : isGrading ? (
                    <><div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>Đang xử lý...</>
                  ) : (
                    <><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"></path></svg>{score !== null ? 'Đọc Lại Lần Nữa' : 'Bắt Đầu Đọc'}</>
                  )}
                </button>
              </div>

              {/* THANH LOADING HIỆN TỨC THÌ */}
              {isGrading && (
                <div className="mb-6 p-5 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center gap-3 animate-pulse shadow-inner">
                  <div className="w-6 h-6 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
                  <span className="text-blue-800 font-medium">Hệ thống đang phân tích giọng đọc và tra cứu phiên âm...</span>
                </div>
              )}

              {!isGrading && score !== null && (
                <div className={`mb-6 p-4 rounded-xl flex items-center justify-between border animate-fade-in-up ${score >= 80 ? 'bg-emerald-50 border-emerald-200' : 'bg-amber-50 border-amber-200'}`}>
                  <div>
                    <h3 className={`font-bold text-lg ${score >= 80 ? 'text-emerald-800' : 'text-amber-800'}`}>{score >= 80 ? '🎉 Đạt Yêu Cầu!' : '💪 Cần Cố Gắng Thêm!'}</h3>
                    <p className={score >= 80 ? 'text-emerald-700' : 'text-amber-700'}>{score >= 80 ? 'Đã ghi nhận kết quả vào hệ thống.' : 'Hãy đọc lại để đạt trên 80% nhé.'}</p>
                  </div>
                  <div className={`text-4xl font-black ${score >= 80 ? 'text-emerald-600' : 'text-amber-500'}`}>{score}%</div>
                </div>
              )}

              <div className="bg-slate-50/50 border border-slate-100 p-6 sm:p-8 rounded-2xl text-lg sm:text-xl leading-loose min-h-[250px] shadow-inner text-slate-700 mb-8">
                {analyzedText.length > 0 && !isGrading ? (
                  <div className="space-x-1">
                    {analyzedText.map((item, i) => (
                      <span key={i} className={`transition-colors duration-300 ${item.status === 'correct' ? 'text-slate-800' : 'text-rose-600 font-semibold bg-rose-100/50 border-b-2 border-rose-300 rounded-sm px-1'}`}>{item.originalWord}</span>
                    ))}
                  </div>
                ) : (
                  <p className={isGrading ? "opacity-50" : ""}>{currentParagraph.content}</p>
                )}
              </div>

              {!isGrading && analyzedText.length > 0 && wrongWords.length > 0 && (
                 <div className="bg-white border border-rose-100 rounded-2xl p-6 shadow-sm animate-fade-in">
                  <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                    <svg className="w-5 h-5 text-rose-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
                    Các từ cần cải thiện phát âm
                  </h3>
                  <div className="flex flex-wrap gap-3">
                    {wrongWords.map((item, i) => (
                      <div key={i} className="bg-rose-50 border border-rose-200 px-4 py-2 rounded-lg flex flex-col">
                        <span className="font-bold text-rose-700">{item.word}</span>
                        {item.phonetic && <span className="text-sm text-slate-500 font-mono">{item.phonetic}</span>}
                      </div>
                    ))}
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