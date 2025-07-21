export interface CalendarEvent {
  title: string;
  description: string;
  startDate: Date;
  endDate: Date;
  location?: string;
}

export function generateICSContent(events: CalendarEvent[]): string {
  const formatDate = (date: Date): string => {
    return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
  };

  const escapeText = (text: string): string => {
    return text
      .replace(/\\/g, '\\\\')
      .replace(/;/g, '\\;')
      .replace(/,/g, '\\,')
      .replace(/\n/g, '\\n');
  };

  let icsContent = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Ultramarathon Training Plan//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH'
  ].join('\r\n');

  events.forEach((event, index) => {
    const uid = `training-${Date.now()}-${index}@ultraplans.app`;
    
    icsContent += '\r\n' + [
      'BEGIN:VEVENT',
      `UID:${uid}`,
      `DTSTART:${formatDate(event.startDate)}`,
      `DTEND:${formatDate(event.endDate)}`,
      `SUMMARY:${escapeText(event.title)}`,
      `DESCRIPTION:${escapeText(event.description)}`,
      `DTSTAMP:${formatDate(new Date())}`,
      'STATUS:CONFIRMED',
      'TRANSP:OPAQUE',
      'END:VEVENT'
    ].join('\r\n');
  });

  icsContent += '\r\nEND:VCALENDAR';
  return icsContent;
}

export function downloadICSFile(content: string, filename: string): void {
  const blob = new Blob([content], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  URL.revokeObjectURL(url);
}

export function generateGoogleCalendarUrl(event: CalendarEvent): string {
  const formatGoogleDate = (date: Date): string => {
    return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
  };

  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: event.title,
    dates: `${formatGoogleDate(event.startDate)}/${formatGoogleDate(event.endDate)}`,
    details: event.description,
    location: event.location || '',
    trp: 'false'
  });

  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

export function openGoogleCalendarBulk(events: CalendarEvent[]): void {
  // For bulk import to Google Calendar, we'll download an ICS file
  // which users can then import into Google Calendar
  const icsContent = generateICSContent(events);
  downloadICSFile(icsContent, 'training-plan.ics');
  
  // Show instructions to user
  alert(
    'ICS file downloaded! Import instructions:\n\n' +
    'Google Calendar:\n' +
    '1. Open Google Calendar\n' +
    '2. Click "+" next to "Other calendars"\n' +
    '3. Select "Import"\n' +
    '4. Choose the downloaded file\n\n' +
    'Apple Calendar:\n' +
    '1. Double-click the .ics file\n' +
    '2. Choose which calendar to add events to\n\n' +
    'Outlook:\n' +
    '1. File > Open & Export > Import/Export\n' +
    '2. Choose "Import an iCalendar (.ics) file"'
  );
}