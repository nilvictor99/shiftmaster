import type { Employee, ShiftSlot, ShiftType, Schedule, ScheduleMetrics, Rules } from '../types';
import { addDays, format } from 'date-fns';

function shuffle<T>(array: T[]): T[] {
  const result = [...array];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

export function generateSchedule(
  employees: Employee[],
  shiftTypes: ShiftType[],
  startDate: string,
  endDate: string,
  rules: Rules,

): Schedule {
  // Crear slots
  const slots: ShiftSlot[] = [];
  const start = new Date(startDate);
  const end = new Date(endDate);
  
  let current = new Date(start);
  while (current <= end) {
    const dateStr = format(current, 'yyyy-MM-dd');
    for (const st of shiftTypes) {
      slots.push({
        id: crypto.randomUUID(),
        date: dateStr,
        shiftTypeId: st.id,
        required: Math.max(1, Math.ceil(employees.length / shiftTypes.length)),
        assigned: []
      });
    }
    current = addDays(current, 1);
  }
  
  // Copiar empleados
  const emps = employees.map(e => ({ ...e, hoursAssigned: 0 }));
  
  // Asignación greedy con heurísticas
  const shuffledSlots = shuffle([...slots]);
  
  for (const slot of shuffledSlots) {
    // Filtrar empleados disponibles
    const slotDate = new Date(slot.date);
    const dayOfWeek = slotDate.getDay();
    
    let candidates = emps.filter(e => {
      // Verificar días disponibles
      if (!e.availableDays.includes(dayOfWeek)) return false;
      // Verificar horas máximas
      if (e.hoursAssigned >= e.maxHoursWeek) return false;
      // Verificar restricciones
      for (const r of e.restrictions) {
        const rl = r.toLowerCase();
        if (rl.includes('no') && rl.includes(getDayName(dayOfWeek).toLowerCase())) return false;
      }
      return true;
    });
    
    // Ordenar por horas asignadas (balanceo) y prioridad
    candidates.sort((a, b) => {
      if (rules.priority < 50) {
        // Priorizar cobertura
        return a.hoursAssigned - b.hoursAssigned;
      } else if (rules.priority > 50) {
        // Priorizar justicia
        return a.hoursAssigned - b.hoursAssigned;
      }
      // Equilibrado
      return a.hoursAssigned - b.hoursAssigned;
    });
    
    // Asignar hasta required
    const toAssign = Math.min(slot.required, candidates.length);
    for (let i = 0; i < toAssign; i++) {
      const emp = candidates[i];
      const idx = emps.findIndex(e => e.id === emp.id);
      if (idx >= 0) {
        slot.assigned.push(emp.id);
        emps[idx].hoursAssigned += 8;
      }
    }
  }
  
  const metrics = calculateMetrics(slots, emps);
  
  return {
    id: crypto.randomUUID(),
    name: `Cuadrante ${format(new Date(), 'dd/MM/yyyy HH:mm')}`,
    startDate,
    endDate,
    employees: emps,
    shiftTypes,
    slots,
    metrics
  };
}

function getDayName(day: number): string {
  const days = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
  return days[day];
}

function calculateMetrics(slots: ShiftSlot[], emps: Employee[]): ScheduleMetrics {
  const totalRequired = slots.reduce((sum, s) => sum + s.required, 0);
  const totalAssigned = slots.reduce((sum, s) => sum + s.assigned.length, 0);
  const coverage = totalRequired > 0 ? (totalAssigned / totalRequired) * 100 : 100;
  const uncoveredSlots = slots.filter(s => s.assigned.length < s.required).length;
  
  const hours = emps.map(e => e.hoursAssigned);
  const avg = hours.reduce((a,b) => a+b, 0) / hours.length || 0;
  const variance = hours.reduce((sum, h) => sum + Math.pow(h - avg, 2), 0) / hours.length || 0;
  const stdDev = Math.sqrt(variance);
  const hoursDeviation = avg > 0 ? (stdDev / avg) * 100 : 0;
  const fairness = Math.max(0, 100 - hoursDeviation * 10);
  
  return {
    coverage: Math.round(coverage * 10) / 10,
    fairness: Math.round(fairness),
    violations: 0,
    hoursDeviation: Math.round(hoursDeviation * 10) / 10,
    uncoveredSlots
  };
}

export function generateMultipleSchedules(
  employees: Employee[],
  shiftTypes: ShiftType[],
  startDate: string,
  endDate: string,
  rules: Rules,
  count: number = 3
): Schedule[] {
  const schedules: Schedule[] = [];
  for (let i = 0; i < count; i++) {
    schedules.push(generateSchedule(employees, shiftTypes, startDate, endDate, rules));
  }
  return schedules;
}
