export interface DiffResult {
  word: string;
  originalWord: string;
  status: 'correct' | 'incorrect';
}

const cleanText = (text: string): string[] => {
  return text.replace(/[^\w\s\']/gi, '').toLowerCase().split(/\s+/).filter(w => w.length > 0);
};

export const diffWords = (originalText: string, spokenText: string): DiffResult[] => {
  const originalWords = cleanText(originalText);
  const spokenWords = cleanText(spokenText);
  
  const result: DiffResult[] = [];
  let i = 0; 
  let j = 0; 

  while (i < originalWords.length) {
    if (j < spokenWords.length && originalWords[i] === spokenWords[j]) {
      result.push({ word: originalWords[i], originalWord: originalText.split(/\s+/)[i], status: 'correct' });
      i++; j++;
    } else {
      result.push({ word: originalWords[i], originalWord: originalText.split(/\s+/)[i], status: 'incorrect' });
      i++;
      if (j < spokenWords.length && originalWords[i] === spokenWords[j + 1]) {
          j++; 
      }
    }
  }
  return result;
};