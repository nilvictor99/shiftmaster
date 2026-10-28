import { useState } from 'react';
import { Calendar } from 'lucide-react';
import type { BusinessHours, ShiftType } from '../types';

interface ConfigSectionProps {
  startDate: string;
  endDate: string;
  onStartDateChange: (date: string) => void;
  onEndDateChange: (date: string) => void;
  businessHours: BusinessHours;
  onBusinessHoursChange: (bh: BusinessHours) => void;
}

export function ConfigSection({ startDate, endDate, onStartDateChange, onEndDateChange, businessHours, onBusinessHoursChange }: ConfigSectionProps) {
  const [mode, setMode] = useState<'shifts' | 'hours'>(businessHours.mode);

  const defaultShifts: ShiftType[] = [
    { id: '1', name: 'Mañana', startTime: '08:00', endTime: '16:00', color: '#3b82f6' },
    { id: '2', name: 'Tarde', startTime: '16:00', endTime: '24:00', color: '#f59e0b' },
  ];

  const handleModeChange = (m: 'shifts' | 'hours') => {
    setMode(m);
    if (m === 'shifts') {
      onBusinessHoursChange({ mode: 'shifts', shiftTypes: defaultShifts });
    } else {
      onBusinessHoursChange({ mode: 'hours', shiftTypes: [], openTime: '08:00', closeTime: '22:00', shiftDuration: 8 });
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          Configuración General
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Fecha inicio</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => onStartDateChange(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Fecha fin</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => onEndDateChange(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
            />
          </div>
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Definición de turnos</label>
          <div className="flex gap-2 mb-4">
            <button
              onClick={() => handleModeChange('shifts')}
              className={`flex-1 px-4 py-2 rounded-lg border ${mode === 'shifts' ? 'bg-blue-50 border-blue-500 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300' : 'border-gray-300 dark:border-gray-600'}`}
            >
              Turnos predefinidos
            </button>
            <button
              onClick={() => handleModeChange('hours')}
              className={`flex-1 px-4 py-2 rounded-lg border ${mode === 'hours' ? 'bg-blue-50 border-blue-500 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300' : 'border-gray-300 dark:border-gray-600'}`}
            >
              Horas abiertas
            </button>
          </div>

          {mode === 'shifts' && (
            <div className="space-y-2">
              {(businessHours.shiftTypes.length > 0 ? businessHours.shiftTypes : defaultShifts).map((st) => (
                <div key={st.id} className="flex items-center gap-2 p-3 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
                  <div className="w-4 h-4 rounded" style={{ backgroundColor: st.color }}></div>
                  <span className="flex-1 text-sm text-gray-900 dark:text-white">{st.name}</span>
                  <span className="text-sm text-gray-600 dark:text-gray-400">{st.startTime} - {st.endTime}</span>
                </div>
              ))}
            </div>
          )}

          {mode === 'hours' && (
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">Apertura</label>
                <input type="time" defaultValue="08:00" className="w-full px-2 py-1.5 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-900 text-gray-900 dark:text-white" />
              </div>
              <div>
                <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">Cierre</label>
                <input type="time" defaultValue="22:00" className="w-full px-2 py-1.5 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-900 text-gray-900 dark:text-white" />
              </div>
              <div>
                <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">Duración turno (h)</label>
                <input type="number" defaultValue="8" className="w-full px-2 py-1.5 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-900 text-gray-900 dark:text-white" />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
