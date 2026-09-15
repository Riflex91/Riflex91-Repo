import { DASHBOARD_FRAGMENT_1 } from './dashboard-command-center-1.js';
import { DASHBOARD_FRAGMENT_2 } from './dashboard-command-center-2.js';
import { DASHBOARD_FRAGMENT_3 } from './dashboard-command-center-3.js';
import { DASHBOARD_FRAGMENT_4 } from './dashboard-command-center-4.js';
import { QUOTA_ROWS_FUNCTION } from './dashboard-quota.js';
import { MOBILE_SCRIPT, MOBILE_STYLE } from './dashboard-mobile.js';

const REDUCED_MOTION_STYLE = `
@media(prefers-reduced-motion:reduce){
  *,*::before,*::after{
    animation-duration:.01ms!important;
    animation-iteration-count:1!important;
    scroll-behavior:auto!important;
    transition-duration:.01ms!important;
  }
}
`;

function replaceSection(source, startMarker, endMarker, replacement) {
  const start = source.indexOf(startMarker);
  const end = source.indexOf(endMarker, start + startMarker.length);
  if (start < 0 || end < 0 || end <= start) throw new Error(`dashboard patch marker missing: ${startMarker}`);
  return source.slice(0, start) + replacement + '\n' + source.slice(end);
}

const DASHBOARD_BASE_HTML = DASHBOARD_FRAGMENT_1 + DASHBOARD_FRAGMENT_2 + DASHBOARD_FRAGMENT_3 + DASHBOARD_FRAGMENT_4;
const DASHBOARD_WITH_QUOTAS = replaceSection(
  DASHBOARD_BASE_HTML,
  'function quotaRows(){',
  'function renderQuotaDeck(){',
  QUOTA_ROWS_FUNCTION
).replace(
  'Nur das Wesentliche: wie viel Cloud-Spielraum noch übrig ist.',
  'Verfügbare Aufrufe und Zugriffe für Worker, D1, R2, Supabase und das Gehirn.'
);

export const DASHBOARD_HTML = DASHBOARD_WITH_QUOTAS
  .replace('</style>', MOBILE_STYLE + REDUCED_MOTION_STYLE + '</style>')
  .replace('</body>', MOBILE_SCRIPT + '</body>');
