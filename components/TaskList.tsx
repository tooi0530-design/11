import React, { useState } from 'react';
import { format } from 'date-fns';
import { Task } from '../types';
import { Plus, Trash2, Sparkles, Loader2, Lock } from 'lucide-react';
import { generateTaskSuggestions } from '../services/geminiService';

interface TaskListProps {
  selectedDate: Date;
  tasks: Task[];
  onAddTask: (text: string) => void;
  onToggleTask: (taskId: string) => void;
  onDeleteTask: (taskId: string) => void;
  onAddMultipleTasks: (newTasks: Task[]) => void;
  apiKey: string;
  onOpenSettings: () => void;
}

export const TaskList: React.FC<TaskListProps> = ({ 
  selectedDate, 
  tasks, 
  onAddTask, 
  onToggleTask, 
  onDeleteTask,
  onAddMultipleTasks,
  apiKey,
  onOpenSettings
}) => {
  const [newTaskText, setNewTaskText] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskText.trim()) return;
    onAddTask(newTaskText);
    setNewTaskText('');
  };

  const handleGenerate = async () => {
    if (!apiKey) {
      onOpenSettings();
      return;
    }
    setIsGenerating(true);
    const dateContext = format(selectedDate, 'EEEE, MMMM do');
    try {
        const suggestions = await generateTaskSuggestions(dateContext, apiKey);
        if (suggestions.length > 0) {
            onAddMultipleTasks(suggestions);
        }
    } catch (e) {
        alert("Failed to generate tasks. Please check your API Key.");
    }
    setIsGenerating(false);
  };

  // Sort tasks: Incomplete first, then completed
  const sortedTasks = [...tasks].sort((a, b) => {
    if (a.isCompleted === b.isCompleted) return b.createdAt - a.createdAt;
    return a.isCompleted ? 1 : -1;
  });

  const progress = tasks.length > 0 
    ? Math.round((tasks.filter(t => t.isCompleted).length / tasks.length) * 100) 
    : 0;

  return (
    <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6 h-full flex flex-col">
      {/* Header */}
      <div className="mb-6">
        <p className="text-sm text-indigo-600 font-semibold uppercase tracking-wide mb-1">
          {format(selectedDate, 'EEEE')}
        </p>
        <h2 className="text-3xl font-bold text-slate-900">
          {format(selectedDate, 'MMMM do')}
        </h2>
        
        {/* Progress Bar */}
        {tasks.length > 0 && (
          <div className="mt-4">
            <div className="flex justify-between text-xs font-medium text-slate-500 mb-1">
              <span>Daily Progress</span>
              <span>{progress}%</span>
            </div>
            <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
              <div 
                className="h-full bg-indigo-500 transition-all duration-500 ease-out"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Input Area */}
      <form onSubmit={handleSubmit} className="relative mb-6 group">
        <input
          type="text"
          value={newTaskText}
          onChange={(e) => setNewTaskText(e.target.value)}
          placeholder="Add a new task..."
          className="w-full pl-4 pr-12 py-4 bg-gray-50 border-transparent focus:bg-white focus:border-indigo-500 focus:ring-0 rounded-2xl transition-all outline-none text-slate-700 placeholder:text-gray-400"
        />
        <button 
          type="submit"
          disabled={!newTaskText.trim()}
          className="absolute right-2 top-2 bottom-2 aspect-square bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:hover:bg-indigo-600 text-white rounded-xl flex items-center justify-center transition-colors"
        >
          <Plus size={20} />
        </button>
      </form>

      {/* AI Suggestion */}
      <div className="mb-6">
        <button
          onClick={handleGenerate}
          disabled={isGenerating}
          className={`
            w-full py-2 px-4 rounded-xl flex items-center justify-center gap-2 text-sm font-medium transition-all border
            ${!apiKey 
                ? 'bg-gray-50 text-gray-500 border-gray-200 hover:bg-gray-100' 
                : 'bg-gradient-to-r from-indigo-50 to-blue-50 hover:from-indigo-100 hover:to-blue-100 text-indigo-700 border-indigo-100/50'
            }
          `}
        >
          {isGenerating ? (
            <Loader2 size={16} className="animate-spin" />
          ) : !apiKey ? (
            <Lock size={16} />
          ) : (
            <Sparkles size={16} />
          )}
          
          {isGenerating 
            ? '생각 중...' 
            : !apiKey 
                ? 'API Key 설정 필요' 
                : '오늘 할 일 추천받기 (AI)'}
        </button>
      </div>

      {/* Task List */}
      <div className="flex-1 overflow-y-auto -mx-2 px-2 space-y-3 custom-scrollbar">
        {sortedTasks.length === 0 ? (
          <div className="h-48 flex flex-col items-center justify-center text-gray-400 border-2 border-dashed border-gray-100 rounded-2xl">
            <span className="text-sm">No tasks for this day</span>
            <span className="text-xs mt-1">Enjoy your free time!</span>
          </div>
        ) : (
          sortedTasks.map((task) => (
            <div 
              key={task.id}
              className={`
                group flex items-center justify-between p-4 rounded-2xl border transition-all duration-200
                ${task.isCompleted ? 'bg-gray-50 border-gray-100' : 'bg-white border-gray-100 shadow-sm hover:border-indigo-100'}
              `}
            >
              <div className="flex items-center gap-3 flex-1 overflow-hidden">
                <button
                  onClick={() => onToggleTask(task.id)}
                  className={`
                    w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold border-2 transition-all shrink-0
                    ${task.isCompleted 
                      ? 'border-indigo-200 bg-indigo-50 text-indigo-600' 
                      : 'border-red-200 bg-red-50 text-red-500 hover:bg-red-100'}
                  `}
                >
                  {task.isCompleted ? 'O' : 'X'}
                </button>
                <span className={`truncate ${task.isCompleted ? 'text-gray-400 line-through decoration-gray-300' : 'text-slate-700'}`}>
                  {task.text}
                </span>
              </div>
              
              <button 
                onClick={() => onDeleteTask(task.id)}
                className="opacity-0 group-hover:opacity-100 p-2 text-gray-400 hover:text-red-500 transition-all"
                aria-label="Delete task"
              >
                <Trash2 size={18} />
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
};