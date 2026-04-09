export function getChosung(word: string): string {
  if (!word) return "";
  
  const chosungs = 'ㄱㄲㄴㄷㄸㄹㅁㅂㅃㅅㅆㅇㅈㅉㅊㅋㅌㅍㅎ';
  let result = '';

  for (let i = 0; i < word.length; i++) {
    const charCode = word.charCodeAt(i);
    // 한글 유니코드 영역 (가 ~ 힣)
    if (charCode >= 44032 && charCode <= 55203) {
      const choIdx = Math.floor((charCode - 44032) / 588);
      result += chosungs[choIdx];
    } else {
      result += word[i];
    }
  }

  return result;
}
