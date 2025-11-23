import React from 'react';
import { 
  format, 
  startOfMonth, 
  endOfMonth, 
  startOfWeek, 
  endOfWeek, 
  eachDayOfInterval, 
  isSameMonth, 
  isSameDay, 
  isToday,
  addMonths,
  subMonths
} from 'date-fns';
import { ChevronLeft, ChevronRight, CheckCircle2 } from 'lucide-react';
import { TaskMap } from '../types';

interface CalendarProps {
  currentDate: Date;
  selectedDate: Date;
  onDateSelect: (date: Date) => void;
  onMonthChange: (date: Date) => void;
  tasks: TaskMap;
}

export const Calendar: React.FC<CalendarProps> = ({ 
  currentDate, 
  selectedDate, 
  onDateSelect, 
  onMonthChange,
  tasks
}) => {
  
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart);
  const endDate = endOfWeek(monthEnd);

  const calendarDays = eachDayOfInterval({
    start: startDate,
    end: endDate,
  });

  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const getTaskStatusForDay = (day: Date) => {
    const dateKey = format(day, 'yyyy-MM-dd');
    const dayTasks = tasks[dateKey] || [];
    if (dayTasks.length === 0) return null;
    
    const allCompleted = dayTasks.every(t => t.isCompleted);
    return {
      hasTasks: true,
      allCompleted
    };
  };

  return (
    <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6 h-full">
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-xl font-bold text-slate-800">
          {format(currentDate, 'MMMM yyyy')}
        </h2>
        <div className="flex gap-2">
          <button 
            onClick={() => onMonthChange(subMonths(currentDate, 1))}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors text-slate-600"
          >
            <ChevronLeft size={20} />
          </button>
          <button 
            onClick={() => onMonthChange(addMonths(currentDate, 1))}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors text-slate-600"
          >
            <ChevronRight size={20} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 mb-4">
        {weekDays.map((day) => (
          <div key={day} className="text-center text-xs font-medium text-gray-400 uppercase tracking-wider py-2">
            {day}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-2">
        {calendarDays.map((day, dayIdx) => {
          const isSelected = isSameDay(day, selectedDate);
          const isCurrentMonth = isSameMonth(day, currentDate);
          const isDayToday = isToday(day);
          const status = getTaskStatusForDay(day);

          return (
            <div key={day.toString()} className="aspect-square">
              <button
                onClick={() => onDateSelect(day)}
                className={`
                  w-full h-full flex flex-col items-center justify-center relative rounded-2xl transition-all duration-200
                  ${!isCurrentMonth ? 'text-gray-300' : 'text-slate-700'}
                  ${isSelected ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200 scale-105' : 'hover:bg-gray-50'}
                  ${isDayToday && !isSelected ? 'bg-indigo-50 text-indigo-600 font-semibold' : ''}
                `}
              >
                <span className={`text-sm ${isSelected ? 'font-semibold' : ''}`}>
                  {format(day, 'd')}
                </span>
                
                {status?.hasTasks && (
                  <div className="mt-1">
                     <div className={`
                       w-1.5 h-1.5 rounded-full 
                       ${isSelected ? 'bg-white/80' : (status.allCompleted ? 'bg-green-500' : 'bg-orange-400')}
                     `}/>
                  </div>
                )}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};
