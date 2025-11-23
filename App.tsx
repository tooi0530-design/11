import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { v4 as uuidv4 } from 'uuid';
import { Settings, FolderOpen, AlertTriangle } from 'lucide-react';
import { Calendar } from './components/Calendar';
import { TaskList } from './components/TaskList';
import { ApiKeyManager } from './components/ApiKeyManager';
import { Task, TaskMap } from './types';
import { loadAllTasksFromDirectory, saveTasksToDirectory, deleteFileFromDirectory } from './services/fileStorage';

const App: React.FC = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [tasks, setTasks] = useState<TaskMap>({});
  
  // Data Storage State
  const [dirHandle, setDirHandle] = useState<any>(null);
  const [isStorageConnected, setIsStorageConnected] = useState(false);
  
  // API Key State
  const [apiKey, setApiKey] = useState('');
  const [isKeyManagerOpen, setIsKeyManagerOpen] = useState(false);

  const getSelectedDateKey = () => format(selectedDate, 'yyyy-MM-dd');

  const handleConnectFolder = async () => {
    // Feature detection for File System Access API
    if (!('showDirectoryPicker' in window)) {
      alert("현재 브라우저는 '폴더 열기' 기능을 지원하지 않습니다.\nPC 버전의 Chrome, Edge, 또는 Opera 브라우저를 사용해주세요.");
      return;
    }

    try {
      // @ts-ignore - File System Access API
      // Removed 'id' and 'startIn' to ensure maximum compatibility. 
      // The browser will typically open the last used location.
      const handle = await window.showDirectoryPicker({
        mode: 'readwrite'
      });
      
      if (!handle) return;

      setDirHandle(handle);
      
      // Load all data from the folder immediately
      try {
        const loadedTasks = await loadAllTasksFromDirectory(handle);
        setTasks(loadedTasks);
        setIsStorageConnected(true);
      } catch (loadError) {
        console.error("Failed to load tasks:", loadError);
        alert("선택한 폴더에서 데이터를 불러오는 중 오류가 발생했습니다.");
      }
      
    } catch (error: any) {
      // Ignore if user cancelled the picker
      if (error.name === 'AbortError') return;
      
      console.error("Folder connection failed", error);
      alert(`폴더 연결 실패: ${error.message}\n\n권한이 거부되었거나 지원되지 않는 환경일 수 있습니다.`);
    }
  };

  const updateTasks = async (key: string, newTasksForDate: Task[]) => {
    // 1. Update UI state immediately
    const updatedTasksMap = {
        ...tasks,
        [key]: newTasksForDate
    };
    
    setTasks(updatedTasksMap);

    // 2. Persist to File System
    if (dirHandle) {
        if (newTasksForDate.length > 0) {
            await saveTasksToDirectory(dirHandle, key, newTasksForDate);
        } else {
             await deleteFileFromDirectory(dirHandle, key);
        }
    }
  };

  const handleAddTask = (text: string) => {
    const key = getSelectedDateKey();
    const currentTasks = tasks[key] || [];
    const newTask: Task = {
      id: uuidv4(),
      text,
      isCompleted: false,
      createdAt: Date.now(),
    };
    
    updateTasks(key, [...currentTasks, newTask]);
  };

  const handleAddMultipleTasks = (newTasks: Task[]) => {
    const key = getSelectedDateKey();
    const currentTasks = tasks[key] || [];
    updateTasks(key, [...currentTasks, ...newTasks]);
  };

  const handleToggleTask = (taskId: string) => {
    const key = getSelectedDateKey();
    const currentTasks = tasks[key] || [];
    const updated = currentTasks.map(t => 
      t.id === taskId ? { ...t, isCompleted: !t.isCompleted } : t
    );
    updateTasks(key, updated);
  };

  const handleDeleteTask = (taskId: string) => {
    const key = getSelectedDateKey();
    const currentTasks = tasks[key] || [];
    const updated = currentTasks.filter(t => t.id !== taskId);
    updateTasks(key, updated);
  };

  return (
    <div className="min-h-screen bg-slate-100 p-4 md:p-8 lg:p-12 flex items-center justify-center relative">
      
      {/* Header Controls */}
      <div className="absolute top-4 right-4 md:top-8 md:right-8 flex gap-3 z-10">
        <button 
          onClick={handleConnectFolder}
          className={`
            flex items-center gap-2 px-4 py-3 rounded-full shadow-md transition-all
            ${isStorageConnected 
              ? 'bg-green-50 text-green-700 border border-green-200' 
              : 'bg-white text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 animate-pulse'}
          `}
          title="Connect Data Folder"
        >
          <FolderOpen size={20} />
          <span className="text-sm font-semibold hidden md:inline">
            {isStorageConnected ? 'Data Connected' : '데이터 폴더 연결'}
          </span>
        </button>

        <button 
          onClick={() => setIsKeyManagerOpen(true)}
          className="bg-white p-3 rounded-full shadow-md text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 transition-all"
          title="API Key Settings"
        >
          <Settings size={24} />
        </button>
      </div>

      <ApiKeyManager 
        isOpen={isKeyManagerOpen} 
        onClose={() => setIsKeyManagerOpen(false)}
        onSetApiKey={setApiKey}
        currentApiKey={apiKey}
      />

      <div className="max-w-6xl w-full grid grid-cols-1 lg:grid-cols-12 gap-6 h-[850px] lg:h-[700px]">
        
        {/* Left Column: Calendar */}
        <div className="lg:col-span-7 h-full flex flex-col gap-4">
          {!isStorageConnected && (
             <div className="bg-orange-50 border border-orange-200 text-orange-800 px-4 py-3 rounded-2xl flex items-start gap-3 shadow-sm">
                <AlertTriangle className="shrink-0 mt-0.5" size={20} />
                <div className="text-sm">
                  <strong>데이터 저장소 연결 필요:</strong><br/>
                  모든 데이터(백데이터)를 저장하고 불러오려면 우측 상단 폴더 아이콘을 눌러 아래 폴더를 찾아 선택해주세요:<br/>
                  <code className="bg-orange-100 px-1 py-0.5 rounded text-orange-900 mt-1 block w-fit font-bold select-all">
                    C:\Users\tooi0\OneDrive\바탕 화면\11
                  </code>
                </div>
             </div>
          )}
          
          <Calendar 
            currentDate={currentDate}
            selectedDate={selectedDate}
            onDateSelect={setSelectedDate}
            onMonthChange={setCurrentDate}
            tasks={tasks}
          />
        </div>

        {/* Right Column: Tasks */}
        <div className="lg:col-span-5 h-full">
          <TaskList 
            selectedDate={selectedDate}
            tasks={tasks[getSelectedDateKey()] || []}
            onAddTask={handleAddTask}
            onToggleTask={handleToggleTask}
            onDeleteTask={handleDeleteTask}
            onAddMultipleTasks={handleAddMultipleTasks}
            apiKey={apiKey}
            onOpenSettings={() => setIsKeyManagerOpen(true)}
          />
        </div>

      </div>
    </div>
  );
};

export default App;