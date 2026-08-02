import * as XLSX from "xlsx";

export interface CalendarEvent {
  uid: string;
  dtstart: Date;
  dtend: Date;
  summary: string;
  description?: string;
  location?: string;
  rrule?: string;
  allDay: boolean;
}

export interface Calendar {
  events: CalendarEvent[];
  prodId: string;
  version: string;
}

export interface ParseOptions {
  dateFormat?: string;
  timeFormat?: string;
  timezone?: string;
}

export function parseCsv(text: string, _options: ParseOptions = {}): CalendarEvent[] {
  const lines = text.trim().split(/\r?\n/);
  if (lines.length < 2) return [];

  const headers = lines[0].split(",").map(h => h.trim().toLowerCase());
  const colMap = {
    start: headers.findIndex(h => ["start", "dtstart", "date", "begin", "from"].includes(h)),
    end: headers.findIndex(h => ["end", "dtend", "finish", "to"].includes(h)),
    summary: headers.findIndex(h => ["summary", "title", "subject", "name", "event"].includes(h)),
    description: headers.findIndex(h => ["description", "desc", "details", "notes"].includes(h)),
    location: headers.findIndex(h => ["location", "place", "where"].includes(h)),
    rrule: headers.findIndex(h => ["rrule", "recurrence", "repeat"].includes(h)),
    allday: headers.findIndex(h => ["allday", "all_day", "fullday"].includes(h)),
    uid: headers.findIndex(h => ["uid", "id"].includes(h)),
  };

  const events: CalendarEvent[] = [];

  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(",").map(c => c.trim().replace(/^"|"$/g, ""));
    if (cols.every(c => !c)) continue;

    const start = parseDate(cols[colMap.start] || "");
    const end = parseDate(cols[colMap.end] || "");
    if (!start) continue;

    const event: CalendarEvent = {
      uid: cols[colMap.uid] || `${Date.now()}-${i}`,
      dtstart: start,
      dtend: end || new Date(start.getTime() + 3600000),
      summary: cols[colMap.summary] || "Untitled Event",
      description: cols[colMap.description] || undefined,
      location: cols[colMap.location] || undefined,
      rrule: cols[colMap.rrule] || undefined,
      allDay: cols[colMap.allday]?.toLowerCase() === "true" || cols[colMap.allday] === "1",
    };

    events.push(event);
  }

  return events;
}

export function parseXlsx(data: Uint8Array, _options: ParseOptions = {}): CalendarEvent[] {
  const workbook = XLSX.read(data, { type: "array" });
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  if (!sheet) return [];

  const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: "" }) as string[][];
  if (rows.length < 2) return [];

  const headers = rows[0].map(h => String(h).trim().toLowerCase());
  const colMap = {
    start: headers.findIndex(h => ["start", "dtstart", "date", "begin", "from"].includes(h)),
    end: headers.findIndex(h => ["end", "dtend", "finish", "to"].includes(h)),
    summary: headers.findIndex(h => ["summary", "title", "subject", "name", "event"].includes(h)),
    description: headers.findIndex(h => ["description", "desc", "details", "notes"].includes(h)),
    location: headers.findIndex(h => ["location", "place", "where"].includes(h)),
    rrule: headers.findIndex(h => ["rrule", "recurrence", "repeat"].includes(h)),
    allday: headers.findIndex(h => ["allday", "all_day", "fullday"].includes(h)),
    uid: headers.findIndex(h => ["uid", "id"].includes(h)),
  };

  const events: CalendarEvent[] = [];

  for (let i = 1; i < rows.length; i++) {
    const cols = rows[i].map(c => String(c).trim());
    if (cols.every(c => !c)) continue;

    const start = parseDate(cols[colMap.start] || "");
    const end = parseDate(cols[colMap.end] || "");
    if (!start) continue;

    const event: CalendarEvent = {
      uid: cols[colMap.uid] || `${Date.now()}-${i}`,
      dtstart: start,
      dtend: end || new Date(start.getTime() + 3600000),
      summary: cols[colMap.summary] || "Untitled Event",
      description: cols[colMap.description] || undefined,
      location: cols[colMap.location] || undefined,
      rrule: cols[colMap.rrule] || undefined,
      allDay: cols[colMap.allday]?.toLowerCase() === "true" || cols[colMap.allday] === "1",
    };

    events.push(event);
  }

  return events;
}

function parseDate(str: string): Date | null {
  if (!str) return null;

  const d = new Date(str);
  if (!isNaN(d.getTime())) return d;

  const formats = [
    /^(\d{4})-(\d{2})-(\d{2})[T ](\d{2}):(\d{2}):(\d{2})/,
    /^(\d{4})-(\d{2})-(\d{2})[T ](\d{2}):(\d{2})/,
    /^(\d{4})-(\d{2})-(\d{2})/,
    /^(\d{2})\/(\d{2})\/(\d{4})/,
    /^(\d{2})\.(\d{2})\.(\d{4})/,
  ];

  for (const fmt of formats) {
    const match = str.match(fmt);
    if (match) {
      if (match.length >= 4) {
        const year = parseInt(match[1]);
        const month = parseInt(match[2]) - 1;
        const day = parseInt(match[3]);
        const hour = match[4] ? parseInt(match[4]) : 0;
        const minute = match[5] ? parseInt(match[5]) : 0;
        const second = match[6] ? parseInt(match[6]) : 0;
        return new Date(year, month, day, hour, minute, second);
      }
    }
  }

  return null;
}

export function mergeCalendars(...calendars: CalendarEvent[][]): CalendarEvent[] {
  const allEvents = calendars.flat();
  const deduped = deduplicateEvents(allEvents);
  return deduped;
}

function deduplicateEvents(events: CalendarEvent[]): CalendarEvent[] {
  const seen = new Map<string, CalendarEvent>();

  for (const event of events) {
    const key = event.uid || `${event.dtstart.toISOString()}-${event.summary}`;
    if (seen.has(key)) {
      const existing = seen.get(key)!;
      if (event.dtstart < existing.dtstart) {
        seen.set(key, event);
      }
    } else {
      seen.set(key, event);
    }
  }

  return Array.from(seen.values());
}

export function generateIcs(events: CalendarEvent[], prodId = "-//mr.cal//EN"): string {
  let ics = "BEGIN:VCALENDAR\r\n";
  ics += `PRODID:${prodId}\r\n`;
  ics += "VERSION:2.0\r\n";
  ics += "CALSCALE:GREGORIAN\r\n";
  ics += "METHOD:PUBLISH\r\n";

  for (const event of events) {
    ics += "BEGIN:VEVENT\r\n";
    ics += `UID:${event.uid}\r\n`;
    ics += `DTSTAMP:${formatDate(new Date())}\r\n`;
    ics += `DTSTART${event.allDay ? ";VALUE=DATE" : ""}:${formatDate(event.dtstart, event.allDay)}\r\n`;
    ics += `DTEND${event.allDay ? ";VALUE=DATE" : ""}:${formatDate(event.dtend, event.allDay)}\r\n`;
    ics += `SUMMARY:${escapeIcs(event.summary)}\r\n`;
    if (event.description) ics += `DESCRIPTION:${escapeIcs(event.description)}\r\n`;
    if (event.location) ics += `LOCATION:${escapeIcs(event.location)}\r\n`;
    if (event.rrule) ics += `RRULE:${event.rrule}\r\n`;
    ics += "END:VEVENT\r\n";
  }

  ics += "END:VCALENDAR\r\n";
  return ics;
}

function formatDate(date: Date, allDay = false): string {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const day = String(date.getUTCDate()).padStart(2, "0");
  if (allDay) return `${year}${month}${day}`;
  const hour = String(date.getUTCHours()).padStart(2, "0");
  const minute = String(date.getUTCMinutes()).padStart(2, "0");
  const second = String(date.getUTCSeconds()).padStart(2, "0");
  return `${year}${month}${day}T${hour}${minute}${second}Z`;
}

function escapeIcs(text: string): string {
  return text.replace(/[\\;,\n]/g, "\\$&");
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}