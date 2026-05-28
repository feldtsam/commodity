export function today() {
  return new Date().toISOString().split('T')[0];
}

export function displayDate(dateString = today()) {
  const d = new Date(dateString + 'T12:00:00Z');
  return d.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    timeZone: 'UTC'
  });
}

export function timestamp() {
  return new Date().toISOString();
}

export function outputDir(baseDir, dateString = today()) {
  return `${baseDir}/${dateString}`;
}
