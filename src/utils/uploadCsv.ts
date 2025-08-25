import axios from 'axios';

export async function uploadCSV(file: File, onProgress?: (pct: number) => void) {
  const formData = new FormData();
  formData.append('file', file);

  const res = await axios.post('/api/transactions/', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    onUploadProgress: (e) => {
      if (e.total && onProgress) onProgress(Math.round((e.loaded * 100) / e.total));
    },
  });

  return res.data; 
}
