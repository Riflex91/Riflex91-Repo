import { DASHBOARD_FRAGMENT_1 } from './dashboard-command-center-1.js';
import { DASHBOARD_FRAGMENT_2 } from './dashboard-command-center-2.js';
import { DASHBOARD_FRAGMENT_3 } from './dashboard-command-center-3.js';
import { DASHBOARD_FRAGMENT_4 } from './dashboard-command-center-4.js';

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

const DASHBOARD_BASE_HTML = DASHBOARD_FRAGMENT_1 + DASHBOARD_FRAGMENT_2 + DASHBOARD_FRAGMENT_3 + DASHBOARD_FRAGMENT_4;

export const DASHBOARD_HTML = DASHBOARD_BASE_HTML.replace('</style>', REDUCED_MOTION_STYLE + '</style>');
