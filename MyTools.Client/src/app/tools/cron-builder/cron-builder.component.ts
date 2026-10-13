import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';

interface FieldInfo {
  label: string;
  range: string;
  description: string;
}

@Component({
  selector: 'app-cron-builder',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './cron-builder.component.html',
  styleUrl: './cron-builder.component.scss',
})
export class CronBuilderComponent {
  expression = '0 * * * *';
  useSixField = false;
  errorMessage = '';
  nextRuns: string[] = [];

  get fieldInfo(): FieldInfo[] {
    const fields: FieldInfo[] = [];
    if (this.useSixField) {
      fields.push({ label: 'Second', range: '0-59', description: 'Second of the minute' });
    }
    fields.push(
      { label: 'Minute', range: '0-59', description: 'Minute of the hour' },
      { label: 'Hour', range: '0-23', description: 'Hour of the day' },
      { label: 'Day of Month', range: '1-31', description: 'Day of the month' },
      { label: 'Month', range: '1-12', description: 'Month of the year' },
      { label: 'Day of Week', range: '0-6', description: 'Day of the week (0=Sun)' },
    );
    return fields;
  }

  get expressionParts(): string[] {
    return this.expression.trim().split(/\s+/);
  }

  generate(): void {
    this.errorMessage = '';
    this.nextRuns = [];

    const parts = this.expression.trim().split(/\s+/);
    const expectedFields = this.useSixField ? 6 : 5;

    if (parts.length !== expectedFields) {
      this.errorMessage = `Expected ${expectedFields} fields, got ${parts.length}. ${this.useSixField ? 'Format: second minute hour day month weekday' : 'Format: minute hour day month weekday'}`;
      return;
    }

    try {
      const runs = this.calculateNextRuns(parts, 5);
      this.nextRuns = runs.map(d => d.toLocaleString());
    } catch (e: any) {
      this.errorMessage = e.message || 'Invalid cron expression.';
    }
  }

  onModeChange(): void {
    if (this.useSixField) {
      this.expression = '0 0 * * * *';
    } else {
      this.expression = '0 * * * *';
    }
    this.nextRuns = [];
    this.errorMessage = '';
  }

  clear(): void {
    this.expression = this.useSixField ? '0 0 * * * *' : '0 * * * *';
    this.nextRuns = [];
    this.errorMessage = '';
  }

  private calculateNextRuns(parts: string[], count: number): Date[] {
    let second: string, minute: string, hour: string, dayOfMonth: string, month: string, dayOfWeek: string;

    if (this.useSixField) {
      [second, minute, hour, dayOfMonth, month, dayOfWeek] = parts;
    } else {
      second = '0';
      [minute, hour, dayOfMonth, month, dayOfWeek] = parts;
    }

    const results: Date[] = [];
    const now = new Date();
    const candidate = new Date(now);
    candidate.setMilliseconds(0);

    // Advance by one second to avoid returning current time
    candidate.setSeconds(candidate.getSeconds() + 1);

    // Iterate forward to find matching times (limit iterations to avoid infinite loop)
    const maxIterations = 525600; // one year of minutes
    let iterations = 0;

    while (results.length < count && iterations < maxIterations) {
      iterations++;

      if (this.matchesCron(candidate, second, minute, hour, dayOfMonth, month, dayOfWeek)) {
        results.push(new Date(candidate));
        candidate.setSeconds(candidate.getSeconds() + 1);
        continue;
      }

      // Advance: try to skip intelligently
      if (!this.matchesField(candidate.getMonth() + 1, month)) {
        candidate.setMonth(candidate.getMonth() + 1, 1);
        candidate.setHours(0, 0, 0, 0);
        continue;
      }
      if (!this.matchesField(candidate.getDate(), dayOfMonth) || !this.matchesDayOfWeek(candidate.getDay(), dayOfWeek)) {
        candidate.setDate(candidate.getDate() + 1);
        candidate.setHours(0, 0, 0, 0);
        continue;
      }
      if (!this.matchesField(candidate.getHours(), hour)) {
        candidate.setHours(candidate.getHours() + 1, 0, 0, 0);
        continue;
      }
      if (!this.matchesField(candidate.getMinutes(), minute)) {
        candidate.setMinutes(candidate.getMinutes() + 1, 0, 0);
        continue;
      }
      if (!this.matchesField(candidate.getSeconds(), second)) {
        candidate.setSeconds(candidate.getSeconds() + 1, 0);
        continue;
      }

      // If we still don't match, move forward by a second
      candidate.setSeconds(candidate.getSeconds() + 1);
    }

    if (results.length === 0) {
      throw new Error('Could not compute next runs. Verify expression is valid.');
    }

    return results;
  }

  private matchesCron(
    d: Date, second: string, minute: string, hour: string,
    dayOfMonth: string, month: string, dayOfWeek: string
  ): boolean {
    return (
      this.matchesField(d.getSeconds(), second) &&
      this.matchesField(d.getMinutes(), minute) &&
      this.matchesField(d.getHours(), hour) &&
      this.matchesField(d.getDate(), dayOfMonth) &&
      this.matchesField(d.getMonth() + 1, month) &&
      this.matchesDayOfWeek(d.getDay(), dayOfWeek)
    );
  }

  private matchesDayOfWeek(current: number, field: string): boolean {
    // Sunday is 0 in JS and cron
    return this.matchesField(current, field);
  }

  private matchesField(current: number, field: string): boolean {
    if (field === '*') return true;

    const parts = field.split(',');
    for (const part of parts) {
      if (this.matchesPart(current, part)) return true;
    }
    return false;
  }

  private matchesPart(current: number, part: string): boolean {
    // Handle step values: */n or range/n
    if (part.includes('/')) {
      const [rangePart, stepStr] = part.split('/');
      const step = parseInt(stepStr, 10);
      if (isNaN(step) || step <= 0) throw new Error(`Invalid step value: ${part}`);

      if (rangePart === '*') {
        return current % step === 0;
      }

      if (rangePart.includes('-')) {
        const [startStr, endStr] = rangePart.split('-');
        const start = parseInt(startStr, 10);
        const end = parseInt(endStr, 10);
        if (isNaN(start) || isNaN(end)) throw new Error(`Invalid range: ${part}`);
        if (current < start || current > end) return false;
        return (current - start) % step === 0;
      }

      const base = parseInt(rangePart, 10);
      if (isNaN(base)) throw new Error(`Invalid field: ${part}`);
      return current >= base && (current - base) % step === 0;
    }

    // Handle range: n-m
    if (part.includes('-')) {
      const [startStr, endStr] = part.split('-');
      const start = parseInt(startStr, 10);
      const end = parseInt(endStr, 10);
      if (isNaN(start) || isNaN(end)) throw new Error(`Invalid range: ${part}`);
      return current >= start && current <= end;
    }

    // Single value
    const val = parseInt(part, 10);
    if (isNaN(val)) throw new Error(`Invalid value: ${part}`);
    return current === val;
  }
}
