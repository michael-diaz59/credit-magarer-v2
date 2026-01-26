import { addMonths, format, parseISO } from 'date-fns';


export interface DateCalculator {
  addMonths(date: string, months: number): string;
  today():string;
}


export class DateFnsCalculator implements DateCalculator {
  addMonths(date: string, months: number): string {
    const parsed = parseISO(date); // yyyy-mm-dd
    const result = addMonths(parsed, months);
    return format(result, 'yyyy-MM-dd');
  }
  today():string{
    return new Date().toISOString().slice(0, 10)
  }
}