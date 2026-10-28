export interface Employee {
  id: string;
  name: string;
  maxHoursWeek: number;
  availableDays: number[]; // 0=Domingo, 1=Lunes, ..., 6=Sábado
  restrictions: string[];
  hoursAssigned: number;
}

export interface ShiftType {
  id: string;
  name: string;
  startTime: string; // HH:MM
  endTime: string;
  color: string;
}

export interface ShiftSlot {
  id: string;
  date: string; // YYYY-MM-DD
  shiftTypeId: string;
  required: number; // número de empleados necesarios
  assigned: string[]; // IDs de empleados asignados
}

export interface Schedule {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  employees: Employee[];
  shiftTypes: ShiftType[];
  slots: ShiftSlot[];
  metrics: ScheduleMetrics;
}

export interface ScheduleMetrics {
  coverage: number; // porcentaje
  fairness: number; // 0-100
  violations: number;
  hoursDeviation: number;
  uncoveredSlots: number;
}

export interface BusinessHours {
  mode: 'shifts' | 'hours';
  shiftTypes: ShiftType[];
  openTime?: string;
  closeTime?: string;
  shiftDuration?: number;
}

export interface Rules {
  maxConsecutiveDays: number;
  minHoursBetweenShifts: number;
  maxWeekendDays: number;
  balanceWeekends: boolean;
  priority: number; // 0=cobertura, 100=justicia
}
