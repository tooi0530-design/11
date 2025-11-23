import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { v4 as uuidv4 } from 'uuid';
import { Calendar } from './components/Calendar';
import { TaskList } from './components/TaskList';
import { Task, TaskMap } from './types';

const STORAGE_KEY = 'smart_calendar_todo_v1';

const App: React.FC = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [tasks, setTasks] = useState<TaskMap>({});

  // Load from LocalStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        setTasks(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to parse tasks", e);
      }
    }
  }, []);

  // Save to LocalStorage whenever tasks change
  useEffect(() => {
    if (Object.keys(tasks).length > 0) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
    }
  }, [tasks]);

  const getSelectedDateKey = () => format(selectedDate, 'yyyy-MM-dd');

  const handleAddTask = (text: string) => {
    const key = getSelectedDateKey();
    const newTask: Task = {
      id: uuidv4(),
      text,
      isCompleted: false,
      createdAt: Date.now(),
    };

    setTasks(prev => ({
      ...prev,
      [key]: [...(prev[key] || []), newTask]
    }));
  };

  const handleAddMultipleTasks = (newTasks: Task[]) => {
    const key = getSelectedDateKey();
    setTasks(prev => ({
      ...prev,
      [key]: [...(prev[key] || []), ...newTasks]
    }));
  };

  const handleToggleTask = (taskId: string) => {
    const key = getSelectedDateKey();
    setTasks(prev => ({
      ...prev,
      [key]: prev[key].map(t => 
        t.id === taskId ? { ...t, isCompleted: !t.isCompleted } : t
      )
    }));
  };

  const handleDeleteTask = (taskId: string) => {
    const key = getSelectedDateKey();
    setTasks(prev => ({
      ...prev,
      [key]: prev[key].filter(t => t.id !== taskId)
    }));
  };

  return (
    <div className="min-h-screen bg-slate-100 p-4 md:p-8 lg:p-12 flex items-center justify-center">
      <div className="max-w-6xl w-full grid grid-cols-1 lg:grid-cols-12 gap-6 h-[850px] lg:h-[700px]">
        
        {/* Left Column: Calendar */}
        <div className="lg:col-span-7 h-full">
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
          />
        </div>

      </div>
    </div>
  );
};

export default App;
