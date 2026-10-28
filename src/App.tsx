import { useState } from 'react';
import { Calendar, Users, Settings, BarChart3 } from 'lucide-react';
import { ConfigSection } from './components/ConfigSection';
import { EmployeesSection } from './components/EmployeesSection';
import { ResultsSection } from './components/ResultsSection';
import { generateMultipleSchedules } from './algorithms/scheduler';
import type { Employee, BusinessHours, Rules, Schedule } from './types';

function App() {
  const [activeTab, setActiveTab] = useState(0);
  const [startDate, setStartDate] = useState('2026-11-03');
  const [endDate, setEndDate] = useState('2026-11-09');
  const [businessHours, setBusinessHours] = useState<BusinessHours>({
    mode: 'shifts',
    shiftTypes: [
      { id: '1', name: 'Mañana', startTime: '08:00', endTime: '16:00', color: '#3b82f6' },
      { id: '2', name: 'Tarde', startTime: '16:00', endTime: '24:00', color: '#f59e0b' },
    ]
  });
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [rules, setRules] = useState<Rules>({
    maxConsecutiveDays: 5,
    minHoursBetweenShifts: 12,
    maxWeekendDays: 2,
    balanceWeekends: true,
    priority: 50
  });
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [generating, setGenerating] = useState(false);

  const tabs = [
    { id: 0, name: 'Configuración', icon: Calendar },
    { id: 1, name: 'Empleados', icon: Users },
    { id: 2, name: 'Reglas', icon: Settings },
    { id: 3, name: 'Resultados', icon: BarChart3 },
  ];

  const handleGenerate = async () => {
    if (employees.length === 0) {
      alert('Añade al menos un empleado');
      return;
    }
    if (!startDate || !endDate) {
      alert('Selecciona rango de fechas');
      return;
    }
    setGenerating(true);
    setActiveTab(3);
    setTimeout(() => {
      const results = generateMultipleSchedules(employees, businessHours.shiftTypes, startDate, endDate, rules, 3);
      setSchedules(results);
      setGenerating(false);
    }, 500);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">ShiftMaster</h1>
          <p className="text-sm text-gray-600 dark:text-gray-400">Generador Automático de Turnos</p>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex gap-2 mb-6 overflow-x-auto">
          {tabs.map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-2 rounded-lg flex items-center gap-2 whitespace-nowrap ${activeTab === tab.id ? 'bg-blue-600 text-white' : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700'}`}
              >
                <Icon className="h-4 w-4" />
                {tab.name}
              </button>
            );
          })}
        </div>

        {activeTab === 0 && (
          <ConfigSection
            startDate={startDate}
            endDate={endDate}
            onStartDateChange={setStartDate}
            onEndDateChange={setEndDate}
            businessHours={businessHours}
            onBusinessHoursChange={setBusinessHours}
          />
        )}

        {activeTab === 1 && (
          <EmployeesSection employees={employees} onEmployeesChange={setEmployees} />
        )}

        {activeTab === 2 && (
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Reglas y Restricciones
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Máximo días consecutivos</label>
                <input type="number" value={rules.maxConsecutiveDays} onChange={(e) => setRules({...rules, maxConsecutiveDays: parseInt(e.target.value)})} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Horas mínimas entre turnos</label>
                <input type="number" value={rules.minHoursBetweenShifts} onChange={(e) => setRules({...rules, minHoursBetweenShifts: parseInt(e.target.value)})} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white" />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Prioridad: Cobertura vs Justicia</label>
                <input type="range" min="0" max="100" value={rules.priority} onChange={(e) => setRules({...rules, priority: parseInt(e.target.value)})} className="w-full" />
                <div className="flex justify-between text-xs text-gray-600 dark:text-gray-400">
                  <span>Priorizar cobertura</span>
                  <span>Equilibrado (50%)</span>
                  <span>Priorizar justicia</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 3 && (
          <>
            {schedules.length === 0 && (
              <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-8 text-center">
                <BarChart3 className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                <p className="text-gray-600 dark:text-gray-400 mb-4">Genera los cuadrantes para ver los resultados</p>
                <button onClick={handleGenerate} disabled={generating} className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400">
                  {generating ? 'Generando...' : '🚀 Generar Cuadrantes'}
                </button>
              </div>
            )}
            <ResultsSection schedules={schedules} onRegenerate={handleGenerate} />
          </>
        )}

        {activeTab !== 3 && (
          <div className="mt-6 flex justify-end">
            <button onClick={handleGenerate} disabled={generating} className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 flex items-center gap-2">
              {generating ? 'Generando...' : '🚀 Generar Cuadrantes'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
