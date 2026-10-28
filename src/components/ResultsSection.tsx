import { useState } from 'react';
import { FileDown, FileSpreadsheet, RefreshCw, Check } from 'lucide-react';
import type { Schedule } from '../types';
import { format, parseISO } from 'date-fns';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';

interface ResultsSectionProps {
  schedules: Schedule[];
  onRegenerate: () => void;
}

const DAYS = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

export function ResultsSection({ schedules, onRegenerate }: ResultsSectionProps) {
  const [activeTab, setActiveTab] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);

  if (schedules.length === 0) return null;

  const schedule = schedules[activeTab];

  const getDates = () => {
    const dates = [];
    const start = parseISO(schedule.startDate);
    const end = parseISO(schedule.endDate);
    let current = new Date(start);
    while (current <= end) {
      dates.push(new Date(current));
      current.setDate(current.getDate() + 1);
    }
    return dates;
  };

  const dates = getDates();

  const getShiftForEmployee = (empId: string, date: string) => {
    const slot = schedule.slots.find(s => s.date === date && s.assigned.includes(empId));
    if (!slot) return null;
    return schedule.shiftTypes.find(st => st.id === slot.shiftTypeId);
  };

  const exportPDF = () => {
    const doc = new jsPDF({ orientation: 'landscape' });
    doc.setFontSize(16);
    doc.text('ShiftMaster - Cuadrante de Turnos', 14, 15);
    doc.setFontSize(10);
    doc.text(`Periodo: ${schedule.startDate} - ${schedule.endDate}`, 14, 22);
    
    const headers = ['Empleado', ...dates.map(d => `${DAYS[d.getDay()]} ${d.getDate()}`)];
    const data = schedule.employees.map(emp => {
      const row = [emp.name];
      dates.forEach(d => {
        const dateStr = format(d, 'yyyy-MM-dd');
        const shift = getShiftForEmployee(emp.id, dateStr);
        row.push(shift ? shift.name : 'LIBRE');
      });
      return row;
    });
    
    autoTable(doc, {
      startY: 28,
      head: [headers],
      body: data,
      styles: { fontSize: 7 },
    });
    
    doc.save(`shiftmaster-${Date.now()}.pdf`);
  };

  const exportExcel = () => {
    const headers = ['Empleado', ...dates.map(d => `${DAYS[d.getDay()]} ${d.getDate()}/${d.getMonth()+1}`)];
    const data = [headers];
    schedule.employees.forEach(emp => {
      const row = [emp.name];
      dates.forEach(d => {
        const dateStr = format(d, 'yyyy-MM-dd');
        const shift = getShiftForEmployee(emp.id, dateStr);
        row.push(shift ? `${shift.name} (${shift.startTime}-${shift.endTime})` : 'LIBRE');
      });
      data.push(row);
    });
    
    const ws = XLSX.utils.aoa_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Cuadrante');
    const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    saveAs(blob, `shiftmaster-${Date.now()}.xlsx`);
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Resultados - Cuadrantes Generados</h2>
        <button onClick={onRegenerate} className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white flex items-center gap-2">
          <RefreshCw className="h-4 w-4" />
          Regenerar
        </button>
      </div>

      <div className="flex gap-2 mb-4">
        {schedules.map((s, idx) => (
          <button
            key={s.id}
            onClick={() => setActiveTab(idx)}
            className={`px-4 py-2 rounded-lg ${activeTab === idx ? 'bg-blue-600 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'}`}
          >
            Opción {idx + 1}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-4 gap-4 mb-4">
        <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
          <p className="text-xs text-green-600 dark:text-green-400">Cobertura</p>
          <p className="text-lg font-bold text-green-700 dark:text-green-300">{schedule.metrics.coverage}%</p>
        </div>
        <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
          <p className="text-xs text-blue-600 dark:text-blue-400">Justicia</p>
          <p className="text-lg font-bold text-blue-700 dark:text-blue-300">{schedule.metrics.fairness}%</p>
        </div>
        <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
          <p className="text-xs text-yellow-600 dark:text-yellow-400">Violaciones</p>
          <p className="text-lg font-bold text-yellow-700 dark:text-yellow-300">{schedule.metrics.violations}</p>
        </div>
        <div className="p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
          <p className="text-xs text-red-600 dark:text-red-400">Sin cubrir</p>
          <p className="text-lg font-bold text-red-700 dark:text-red-300">{schedule.metrics.uncoveredSlots}</p>
        </div>
      </div>

      {schedule.metrics.uncoveredSlots > 0 && (
        <div className="mb-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg text-sm text-yellow-800 dark:text-yellow-300">
          ⚠️ No es posible cubrir 100% de la demanda. Se muestran los turnos asignados y los huecos sin cubrir.
        </div>
      )}

      <div className="overflow-x-auto mb-4">
        <table className="w-full text-xs">
          <thead className="bg-gray-50 dark:bg-gray-900/50">
            <tr>
              <th className="text-left p-2 sticky left-0 bg-gray-50 dark:bg-gray-900/50 text-gray-900 dark:text-white">Empleado</th>
              {dates.map((d, i) => (
                <th key={i} className="text-center p-2 text-gray-900 dark:text-white">
                  <div>{DAYS[d.getDay()]}</div>
                  <div className="font-normal">{d.getDate()}/{d.getMonth()+1}</div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {schedule.employees.map(emp => (
              <tr key={emp.id} className="border-t border-gray-200 dark:border-gray-700">
                <td className="p-2 font-medium sticky left-0 bg-white dark:bg-gray-800 text-gray-900 dark:text-white">{emp.name}</td>
                {dates.map((d, i) => {
                  const dateStr = format(d, 'yyyy-MM-dd');
                  const shift = getShiftForEmployee(emp.id, dateStr);
                  return (
                    <td key={i} className="p-1 text-center">
                      {shift ? (
                        <div className="px-2 py-1 rounded text-white text-xs" style={{ backgroundColor: shift.color }}>
                          {shift.name}
                        </div>
                      ) : (
                        <div className="px-2 py-1 rounded bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400 text-xs">
                          LIBRE
                        </div>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setSelected(activeTab)}
          className={`px-4 py-2 rounded-lg flex items-center gap-2 ${selected === activeTab ? 'bg-green-600 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'}`}
        >
          <Check className="h-4 w-4" />
          {selected === activeTab ? 'Aceptada' : 'Aceptar esta opción'}
        </button>
        <button onClick={exportPDF} className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center gap-2">
          <FileDown className="h-4 w-4" />
          Descargar PDF
        </button>
        <button onClick={exportExcel} className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2">
          <FileSpreadsheet className="h-4 w-4" />
          Descargar Excel
        </button>
      </div>
    </div>
  );
}
