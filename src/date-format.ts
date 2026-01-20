// GitHub action
// Copyright © 2026 Alexander Thoukydides

import { plural } from './utils.js';

// Generate a friendly description of a date
export function relativeDateString(date: Date): string {
    const today = new Date();
    const yesterday = new Date(today.getFullYear(), today.getMonth(), today.getDate() - 1);

    // Check for yesterday, today, and in the future
    if (isSameDay(date, today))     return 'today';
    if (isSameDay(date, yesterday)) return 'yesterday';
    if (today < date)               return 'in the future';

    // Calculate the difference in days
    const daysAgo = Math.floor((today.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    if (daysAgo < 30)   return `${plural(daysAgo, 'day')} ago`;
    if (daysAgo < 365)  return `${plural(Math.floor(daysAgo / 30), 'month')} ago`;
    return                     `${plural(Math.floor(daysAgo / 365), 'year')} ago`;
}

// Are two dates the same day
function isSameDay(date1: Date, date2: Date): boolean {
    return date1.getFullYear() === date2.getFullYear()
        && date1.getMonth()    === date2.getMonth()
        && date1.getDate()     === date2.getDate();
}