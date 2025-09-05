/**
 * WhatsApp-style date formatter, always showing the time:
 *   • < 5 s              → “just now”
 *   • today              → “Today, hh:mm am/pm”
 *   • yesterday          → “Yesterday, hh:mm am/pm”
 *   • otherwise          → “1 Jan, yyyy, hh:mm am/pm”
 *
 * @param {string|number|Date} dateString – any value accepted by `new Date()`
 */
function dateFormatter(dateString) {
  const input = new Date(dateString);
  const now = new Date();

  // Helper: pad to 2 digits
  const pad = (n) => n.toString().padStart(2, "0");

  // Helper: format time as "h:mm am/pm"
  function formatTime(date) {
    let hours = date.getHours();
    const minutes = pad(date.getMinutes());
    const ampm = hours >= 12 ? "pm" : "am";
    hours = hours % 12;
    if (hours === 0) hours = 12;
    return `${hours}:${minutes} ${ampm}`;
  }

  // Helper: is same day
  function isSameDay(a, b) {
    return (
      a.getFullYear() === b.getFullYear() &&
      a.getMonth() === b.getMonth() &&
      a.getDate() === b.getDate()
    );
  }

  // Helper: is yesterday
  function isYesterday(a, b) {
    const yest = new Date(b);
    yest.setDate(b.getDate() - 1);
    return isSameDay(a, yest);
  }

  const diff = now - input;
  const secs = Math.floor(diff / 1000);

  if (secs < 5) return "just now";

  if (isSameDay(input, now)) {
    return `Today, ${formatTime(input)}`;
  }

  if (isYesterday(input, now)) {
    return `Yesterday, ${formatTime(input)}`;
  }

  // Always show "1 Jan, yyyy, hh:mm am/pm" for older messages
  const months = [
    "Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
  ];
  const day = input.getDate();
  const month = months[input.getMonth()];
  const year = input.getFullYear();
  const time = formatTime(input);

  return `${day} ${month}, ${year}, ${time}`;
}

export default dateFormatter;