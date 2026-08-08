import React, { useState } from 'react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell, 
  Legend 
} from 'recharts';
import { BarChart3, TrendingUp, CheckCircle2, Clock, AlertCircle } from 'lucide-react';
import { ScheduleItem } from '../types';

interface StatsViewProps {
  schedules: ScheduleItem[];
  currentWeek: number;
}

export const StatsView: React.FC<StatsViewProps> = ({ schedules, currentWeek }) => {
  const [filterScope, setFilterScope] = useState<'week' | 'month' | 'semester' | 'year'>('week');

  // Filter schedules based on scope
  const filtered = schedules.filter(item => {
    if (filterScope === 'week') {
      return item.weekNumber === currentWeek;
    }
    // For semester or year, include all
    return true;
  });

  const totalPeriods = filtered.length;
  const completed = filtered.filter(s => s.status === 'completed').length;
  const preparing = filtered.filter(s => s.status === 'preparing').length;
  const unprepared = filtered.filter(s => s.status === 'unprepared').length;

  const percent = totalPeriods > 0 ? Math.round((completed / totalPeriods) * 100) : 0;

  // Status Pie Chart Data
  const pieData = [
    { name: 'Đã hoàn thành', value: completed, color: '#10b981' },
    { name: 'Đang chuẩn bị', value: preparing, color: '#f59e0b' },
    { name: 'Chưa chuẩn bị', value: unprepared, color: '#64748b' },
  ];

  // Group by Class
  const classMap: Record<string, { className: string; completed: number; total: number }> = {};
  filtered.forEach(s => {
    const cName = s.className || 'Khác';
    if (!classMap[cName]) {
      classMap[cName] = { className: cName, completed: 0, total: 0 };
    }
    classMap[cName].total += 1;
    if (s.status === 'completed') classMap[cName].completed += 1;
  });

  const classData = Object.values(classMap).map(c => ({
    name: c.className,
    'Đã hoàn thành': c.completed,
    'Tổng số tiết': c.total,
    'Tỷ lệ %': c.total > 0 ? Math.round((c.completed / c.total) * 100) : 0,
  }));

  // Group by Subject
  const subjectMap: Record<string, { subject: string; completed: number; total: number }> = {};
  filtered.forEach(s => {
    const sub = s.subject || 'Khác';
    if (!subjectMap[sub]) {
      subjectMap[sub] = { subject: sub, completed: 0, total: 0 };
    }
    subjectMap[sub].total += 1;
    if (s.status === 'completed') subjectMap[sub].completed += 1;
  });

  const subjectData = Object.values(subjectMap).map(s => ({
    name: s.subject,
    'Đã hoàn thành': s.completed,
    'Tổng số tiết': s.total,
  }));

  return (
    <div className="space-y-6 pb-12">
      {/* Scope Filter Header */}
      <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center space-x-2">
            <BarChart3 className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            <span>Thống Kê & Báo Cáo Tiến Độ Giảng Dạy</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Phân tích chi tiết tỷ lệ hoàn thành báo giảng và tiến độ thực hiện chương trình.
          </p>
        </div>

        {/* Filter scope buttons */}
        <div className="flex items-center space-x-1 bg-slate-100 dark:bg-slate-900 p-1.5 rounded-xl border border-slate-200 dark:border-slate-700">
          {[
            { id: 'week', label: `Tuần ${currentWeek}` },
            { id: 'month', label: 'Theo Tháng' },
            { id: 'semester', label: 'Học kỳ I' },
            { id: 'year', label: 'Cả năm học' },
          ].map((scope) => (
            <button
              key={scope.id}
              onClick={() => setFilterScope(scope.id as any)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                filterScope === scope.id
                  ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              {scope.label}
            </button>
          ))}
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-800 p-5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
          <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Tổng số tiết giảng dạy</span>
          <div className="text-3xl font-extrabold text-slate-900 dark:text-white mt-1">
            {totalPeriods} <span className="text-xs font-normal text-slate-400">tiết</span>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 p-5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
          <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Đã báo giảng / hoàn thành</span>
          <div className="text-3xl font-extrabold text-emerald-600 dark:text-emerald-400 mt-1">
            {completed} <span className="text-xs font-normal text-slate-400">tiết</span>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 p-5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
          <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Chưa hoàn thành</span>
          <div className="text-3xl font-extrabold text-amber-600 dark:text-amber-400 mt-1">
            {unprepared + preparing} <span className="text-xs font-normal text-slate-400">tiết</span>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 p-5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
          <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Tỷ lệ tiến độ %</span>
          <div className="text-3xl font-extrabold text-blue-600 dark:text-blue-400 mt-1">
            {percent}%
          </div>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Chart 1: Progress by Class */}
        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm space-y-4">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center space-x-2">
            <TrendingUp className="w-4 h-4 text-blue-500" />
            <span>Tiến độ báo giảng theo Lớp học</span>
          </h3>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={classData}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} />
                <YAxis stroke="#94a3b8" fontSize={12} />
                <Tooltip />
                <Legend />
                <Bar dataKey="Đã hoàn thành" fill="#10b981" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Tổng số tiết" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: Status Breakdown Pie */}
        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm space-y-4">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            <span>Cơ cấu trạng thái bài dạy</span>
          </h3>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={85}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>
    </div>
  );
};
