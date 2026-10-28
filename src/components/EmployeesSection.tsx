import { useState } from 'react';
import { Users, Plus, Upload } from 'lucide-react';
import type { Employee } from '../types';
import * as XLSX from 'xlsx';

interface EmployeesSectionProps {
  employees: Employee[];
  onEmployeesChange: (employees: Employee[]) => void;
}

const DAYS = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

export function EmployeesSection({ employees, onEmployeesChange }: EmployeesSectionProps) {
  const [name, setName] = useState('');
  const [maxHours, setMaxHours] = useState(40);
  const [availableDays, setAvailableDays] = useState([1,2,3,4,5]);

  const addEmployee = () => {
    if (!name.trim()) return;
    const emp: Employee = {
      id: crypto.randomUUID(),
      name: name.trim(),
      maxHoursWeek: maxHours,
      availableDays,
      restrictions: [],
      hoursAssigned: 0
    };
    onEmployeesChange([...employees, emp]);
    setName('');
  };

  const toggleDay = (day: number) => {
    setAvailableDays(prev => 
      prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]
    );
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const data = await file.arrayBuffer();
    const workbook = XLSX.read(data);
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const json: any[] = XLSX.utils.sheet_to_json(sheet);
    
    const imported: Employee[] = json.map(row => ({
      id: crypto.randomUUID(),
      name: row.Nombre || row.nombre || row.Name || '',
      maxHoursWeek: row['Horas Max'] || row.horasMax || 40,
      availableDays: [1,2,3,4,5],
      restrictions: [],
      hoursAssigned: 0
    })).filter(e => e.name);
    
    onEmployeesChange([...employees, ...imported]);
  };

  const totalHours = employees.reduce((sum, e) => sum + e.maxHoursWeek, 0);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
      <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
        <Users className="h-5 w-5" />
        Lista de Empleados
      </h2>

      <div className="mb-4 p-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <input
            type="text"
            placeholder="Nombre del empleado"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
          />
          <input
            type="number"
            placeholder="Horas máximas/semana"
            value={maxHours}
            onChange={(e) => setMaxHours(parseInt(e.target.value) || 40)}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
          />
          <button onClick={addEmployee} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center justify-center gap-2">
            <Plus className="h-4 w-4" />
            Agregar
          </button>
        </div>
        <div>
          <label className="text-sm text-gray-700 dark:text-gray-300 mb-1 block">Días disponibles</label>
          <div className="flex gap-1 flex-wrap">
            {DAYS.map((d, i) => (
              <button
                key={i}
                onClick={() => toggleDay(i)}
                className={`px-2 py-1 text-xs rounded ${availableDays.includes(i) ? 'bg-blue-600 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'}`}
              >
                {d}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="mb-3 flex items-center justify-between">
        <p className="text-sm text-gray-600 dark:text-gray-400">
          {employees.length} empleados cargados • {totalHours} horas totales disponibles
        </p>
        <label className="px-3 py-1.5 text-sm bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-600 flex items-center gap-2">
          <Upload className="h-4 w-4" />
          Importar desde Excel
          <input type="file" className="hidden" accept=".xlsx,.xls,.csv" onChange={handleImport} />
        </label>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 dark:bg-gray-900/50">
            <tr>
              <th className="text-left p-2 text-gray-900 dark:text-white">Nombre</th>
              <th className="text-left p-2 text-gray-900 dark:text-white">Horas/semana</th>
              <th className="text-left p-2 text-gray-900 dark:text-white">Días disponibles</th>
            </tr>
          </thead>
          <tbody>
            {employees.map(emp => (
              <tr key={emp.id} className="border-t border-gray-200 dark:border-gray-700">
                <td className="p-2 text-gray-900 dark:text-white">{emp.name}</td>
                <td className="p-2 text-gray-600 dark:text-gray-400">{emp.maxHoursWeek}h</td>
                <td className="p-2 text-gray-600 dark:text-gray-400">
                  {emp.availableDays.map(d => DAYS[d]).join(', ')}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
