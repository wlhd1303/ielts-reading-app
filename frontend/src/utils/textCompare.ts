export interface DiffResult {
    originalWord: string; // Từ nguyên bản (giữ nguyên dấu câu để hiển thị UI)
    cleanWord: string;    // Từ đã làm sạch để debug
    status: 'correct' | 'incorrect';
}

// Làm sạch: tách dấu gạch ngang, bỏ ký tự đặc biệt, chuyển chữ thường
export const cleanText = (text: string): string[] => {
    return text
        .replace(/-/g, ' ') 
        .replace(/[^\w\s\']/gi, '') 
        .toLowerCase()
        .split(/\s+/)
        .filter(w => w.length > 0);
};

export const diffWords = (originalText: string, spokenText: string): DiffResult[] => {
    const originalWordsList = cleanText(originalText);
    const spokenWordsList = cleanText(spokenText);

    // Tách văn bản gốc để hiển thị UI (vẫn giữ dấu câu)
    const displayWords = originalText.trim().split(/\s+/);

    const result: DiffResult[] = displayWords.map((word, index) => ({
        originalWord: word,
        cleanWord: originalWordsList[index] || '',
        status: 'incorrect' // Mặc định là sai, tìm thấy mới chuyển thành đúng
    }));

    let spokenIndex = 0;
    const WINDOW_SIZE = 5; // Phạm vi quét tìm từ đúng (rộng hơn)

    for (let i = 0; i < originalWordsList.length; i++) {
        const expectedWord = originalWordsList[i];
        
        // Quét trong mảng từ đã đọc
        for (let j = spokenIndex; j < Math.min(spokenIndex + WINDOW_SIZE, spokenWordsList.length); j++) {
            const spokenWord = spokenWordsList[j];
            
            // So sánh, thêm một chút "khoan dung" cho các lỗi phổ biến của API
            const isMatch = spokenWord === expectedWord ||
                (spokenWord === "its" && expectedWord === "it's") ||
                (spokenWord === "dont" && expectedWord === "don't");

            if (isMatch) {
                result[i].status = 'correct';
                // Đẩy mốc tìm kiếm lên vị trí tiếp theo
                spokenIndex = j + 1;
                break;
            }
        }
    }

    return result;
};