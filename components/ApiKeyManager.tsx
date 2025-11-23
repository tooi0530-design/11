import React, { useState } from 'react';
import { X, Save, Upload, Key, CheckCircle, AlertCircle, ShieldCheck } from 'lucide-react';
import { testConnection } from '../services/geminiService';

interface ApiKeyManagerProps {
  isOpen: boolean;
  onClose: () => void;
  onSetApiKey: (key: string) => void;
  currentApiKey: string;
}

export const ApiKeyManager: React.FC<ApiKeyManagerProps> = ({ isOpen, onClose, onSetApiKey, currentApiKey }) => {
  const [inputValue, setInputValue] = useState(currentApiKey);
  const [testStatus, setTestStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  if (!isOpen) return null;

  // Simple obfuscation/encryption for the file
  const encrypt = (text: string) => {
    // Shift char codes and base64 encode
    return btoa(text.split('').map(c => String.fromCharCode(c.charCodeAt(0) + 5)).join(''));
  };

  const decrypt = (text: string) => {
    try {
      return atob(text).split('').map(c => String.fromCharCode(c.charCodeAt(0) - 5)).join('');
    } catch (e) {
      return '';
    }
  };

  const handleSaveToFile = async () => {
    if (!inputValue) {
      setMessage('API Key를 입력해주세요.');
      return;
    }
    
    try {
      // @ts-ignore - File System Access API
      const handle = await window.showSaveFilePicker({
        suggestedName: 'gemini_key_encrypted.txt',
        types: [{
          description: 'Encrypted API Key',
          accept: { 'text/plain': ['.txt'] },
        }],
      });
      
      const writable = await handle.createWritable();
      await writable.write(encrypt(inputValue));
      await writable.close();
      setMessage('파일이 성공적으로 저장되었습니다 (암호화됨).');
    } catch (err) {
      console.error(err);
      setMessage('파일 저장 취소 또는 오류 발생.');
    }
  };

  const handleLoadFromFile = async () => {
    try {
      // @ts-ignore - File System Access API
      const [handle] = await window.showOpenFilePicker({
        types: [{
          description: 'Encrypted API Key',
          accept: { 'text/plain': ['.txt'] },
        }],
      });
      
      const file = await handle.getFile();
      const text = await file.text();
      const decrypted = decrypt(text);
      
      if (decrypted) {
        setInputValue(decrypted);
        setMessage('키를 불러왔습니다. 연결 테스트를 진행해주세요.');
      } else {
        setMessage('파일 형식이 올바르지 않거나 손상되었습니다.');
      }
    } catch (err) {
      console.error(err);
      setMessage('파일 열기 취소 또는 오류 발생.');
    }
  };

  const handleTestConnection = async () => {
    if (!inputValue) return;
    setTestStatus('testing');
    const success = await testConnection(inputValue);
    
    if (success) {
      setTestStatus('success');
      onSetApiKey(inputValue);
      setMessage('연결 성공! 키가 적용되었습니다.');
      setTimeout(() => {
        onClose();
        setTestStatus('idle');
        setMessage('');
      }, 1500);
    } else {
      setTestStatus('error');
      setMessage('연결 실패. API Key를 확인해주세요.');
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-6 animate-in fade-in zoom-in duration-200">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <Key className="text-indigo-600" size={24} />
            API Key 관리
          </h3>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full text-gray-500">
            <X size={20} />
          </button>
        </div>

        <div className="space-y-4">
          <div className="bg-blue-50 p-4 rounded-xl text-sm text-blue-700 mb-4">
            보안을 위해 API Key는 로컬 파일에 암호화되어 저장됩니다. 
            <br />
            (저장 경로 예시: OneDrive\바탕 화면\11 등 원하는 위치 선택)
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Gemini API Key</label>
            <input 
              type="password" 
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="AI Studio API Key 입력"
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <button 
              onClick={handleSaveToFile}
              className="flex items-center justify-center gap-2 py-2.5 px-4 bg-white border border-gray-200 hover:bg-gray-50 text-slate-700 rounded-xl font-medium transition-colors"
            >
              <Save size={18} />
              파일로 저장
            </button>
            <button 
              onClick={handleLoadFromFile}
              className="flex items-center justify-center gap-2 py-2.5 px-4 bg-white border border-gray-200 hover:bg-gray-50 text-slate-700 rounded-xl font-medium transition-colors"
            >
              <Upload size={18} />
              파일 불러오기
            </button>
          </div>

          <div className="pt-4 border-t border-gray-100">
            <button 
              onClick={handleTestConnection}
              disabled={testStatus === 'testing' || !inputValue}
              className={`
                w-full py-3 px-4 rounded-xl font-bold text-white flex items-center justify-center gap-2 transition-all
                ${testStatus === 'success' ? 'bg-green-500 hover:bg-green-600' : 
                  testStatus === 'error' ? 'bg-red-500 hover:bg-red-600' : 
                  'bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50'}
              `}
            >
              {testStatus === 'testing' ? (
                '연결 확인 중...'
              ) : testStatus === 'success' ? (
                <>
                  <CheckCircle size={20} />
                  연결 성공
                </>
              ) : testStatus === 'error' ? (
                <>
                  <AlertCircle size={20} />
                  연결 실패 (다시 시도)
                </>
              ) : (
                <>
                  <ShieldCheck size={20} />
                  연결 테스트 및 적용
                </>
              )}
            </button>
          </div>

          {message && (
            <p className={`text-center text-sm font-medium mt-2 ${testStatus === 'error' ? 'text-red-500' : testStatus === 'success' ? 'text-green-600' : 'text-slate-500'}`}>
              {message}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};