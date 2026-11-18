// Set de íconos de referencia (24×24, trazo 2, extremos redondeados), equivalentes a lucide-react-native.
// En la app: import { Search, Heart, ... } from 'lucide-react-native' con strokeWidth={2}.
const P = {
  search: ['c11,11,7', 'M20 20l-4.2-4.2'],
  heart: ['M12 20.3s-7.4-4.6-9.2-9.5C1.6 7.3 3.9 4 7.4 4c2 0 3.6 1.1 4.6 2.8C13 5.1 14.6 4 16.6 4c3.5 0 5.8 3.3 4.6 6.8-1.8 4.9-9.2 9.5-9.2 9.5z'],
  calendar: ['M5 5h14a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2z', 'M3 10h18', 'M8 3v4', 'M16 3v4'],
  mapPin: ['M12 21.5s-7-6.2-7-11.7a7 7 0 0 1 14 0c0 5.5-7 11.7-7 11.7z', 'c12,9.8,2.5'],
  star: ['M12 3.3l2.6 5.4 5.9.8-4.3 4.2 1 5.9L12 16.8l-5.2 2.8 1-5.9-4.3-4.2 5.9-.8z'],
  clock: ['c12,12,9', 'M12 7.5V12l3 2'],
  hourglass: ['M6 3h12', 'M6 21h12', 'M7.5 3c0 4.5 4.5 5.5 4.5 9s-4.5 4.5-4.5 9', 'M16.5 3c0 4.5-4.5 5.5-4.5 9s4.5 4.5 4.5 9'],
  checkCircle: ['c12,12,9', 'M8 12.4l2.7 2.7L16 9.8'],
  xCircle: ['c12,12,9', 'M9 9l6 6', 'M15 9l-6 6'],
  check: ['M5 12.5l4.5 4.5L19 7.5'],
  checks: ['M2 12.5l4.5 4.5L16 7.5', 'M12.5 16l1 1L23 7.5'],
  ticket: ['M3 7.5A1.5 1.5 0 0 1 4.5 6h15A1.5 1.5 0 0 1 21 7.5V10a2 2 0 0 0 0 4v2.5a1.5 1.5 0 0 1-1.5 1.5h-15A1.5 1.5 0 0 1 3 16.5V14a2 2 0 0 0 0-4z', 'M15 6v2', 'M15 11v2', 'M15 16v2'],
  ticketCheck: ['M3 7.5A1.5 1.5 0 0 1 4.5 6h15A1.5 1.5 0 0 1 21 7.5V10a2 2 0 0 0 0 4v2.5a1.5 1.5 0 0 1-1.5 1.5h-15A1.5 1.5 0 0 1 3 16.5V14a2 2 0 0 0 0-4z', 'M8.5 12l2 2 4-4'],
  undo: ['M9 14L4 9l5-5', 'M4 9h10.5a5.5 5.5 0 0 1 0 11H11'],
  chevronLeft: ['M15 18l-6-6 6-6'],
  chevronRight: ['M9 6l6 6-6 6'],
  chevronDown: ['M6 9l6 6 6-6'],
  plus: ['M12 5v14', 'M5 12h14'],
  minus: ['M5 12h14'],
  home: ['M4 10.5L12 4l8 6.5V20a1 1 0 0 1-1 1h-4.5v-6h-5v6H5a1 1 0 0 1-1-1z'],
  compass: ['c12,12,9', 'M15.6 8.4l-2.1 5.1-5.1 2.1 2.1-5.1z'],
  user: ['c12,8,4', 'M4 21c1.4-4 4.4-6 8-6s6.6 2 8 6'],
  message: ['M5 4h14a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H9l-5 4V6a2 2 0 0 1 1-2z'],
  send: ['M21 3L10 14', 'M21 3l-7 18-4-7-7-4z'],
  sliders: ['M4 7h9', 'M17 7h3', 'M4 17h3', 'M11 17h9', 'c15,7,2', 'c9,17,2'],
  sort: ['M7 4v16', 'M3 8l4-4 4 4', 'M17 20V4', 'M13 16l4 4 4-4'],
  bell: ['M6 9a6 6 0 0 1 12 0c0 6 2.5 8 2.5 8h-17S6 15 6 9z', 'M10 20.5a2 2 0 0 0 4 0'],
  x: ['M6 6l12 12', 'M18 6L6 18'],
  alert: ['M12 3.5l9.5 16.5h-19z', 'M12 10v4.5', 'M12 17.2v.1'],
  info: ['c12,12,9', 'M12 11v5.5', 'M12 7.7v.1'],
  image: ['M5 4h14a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z', 'c9,10,2', 'M21 15.5l-5-5L5 20'],
  trash: ['M4 7h16', 'M9 7V4h6v3', 'M6 7l1 13h10l1-13'],
  upload: ['M12 16V4', 'M7 9l5-5 5 5', 'M4 20h16'],
  music: ['M9 18V5l11-2v13', 'c6,18,3', 'c17,16,3'],
  theater: ['M5 3.5h14V11a7 7 0 0 1-14 0z', 'M9 9h.01', 'M15 9h.01', 'M9 13.5c1.6 1.3 4.4 1.3 6 0'],
  festival: ['M2 20h20', 'M12 4L4 20', 'M12 4l8 16', 'M12 13l-3 7', 'M12 13l3 7'],
  mic: ['M12 3a3 3 0 0 1 3 3v5a3 3 0 0 1-6 0V6a3 3 0 0 1 3-3z', 'M5 11a7 7 0 0 0 14 0', 'M12 18v3'],
  trophy: ['M8 4h8v5a4 4 0 0 1-8 0z', 'M8 6H5a3 3 0 0 0 3 4', 'M16 6h3a3 3 0 0 1-3 4', 'M12 13v4', 'M8 21h8', 'M10 17h4v4h-4z'],
  grid: ['M4 4h7v7H4z', 'M13 4h7v7h-7z', 'M4 13h7v7H4z', 'M13 13h7v7h-7z'],
  lock: ['M6 11h12a1 1 0 0 1 1 1v8a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1v-8a1 1 0 0 1 1-1z', 'M8 11V7a4 4 0 0 1 8 0v4'],
  card: ['M4 5h16a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2z', 'M2 10h20', 'M6 15h4'],
  edit: ['M4 20h4L19 9l-4-4L4 16z', 'M13.5 6.5l4 4'],
  more: ['c12,5,1.2', 'c12,12,1.2', 'c12,19,1.2'],
  qr: ['M4 4h6v6H4z', 'M14 4h6v6h-6z', 'M4 14h6v6H4z', 'M14 14h2v2h-2z', 'M18 14h2', 'M14 18h2v2', 'M18 18h2v2h-2z'],
  share: ['c18,5,2.5', 'c6,12,2.5', 'c18,19,2.5', 'M8.2 10.8l7.6-4.4', 'M8.2 13.2l7.6 4.4'],
  barChart: ['M4 20V10', 'M10 20V4', 'M16 20v-7', 'M22 20H2'],
  sparkle: ['M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z', 'M19 16l.8 2.2L22 19l-2.2.8L19 22l-.8-2.2L16 19l2.2-.8z'],
};

export const iconNames = Object.keys(P);

export function Icon({ name, size = 20, color = 'currentColor', fill = 'none', strokeWidth = 2, title, style }) {
  const parts = P[name] || P.info;
  return (
    <svg className="at-icon" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth}
      strokeLinecap="round" strokeLinejoin="round" aria-hidden={title ? undefined : 'true'} role={title ? 'img' : undefined} style={style}>
      {title ? <title>{title}</title> : null}
      {parts.map((d, i) => {
        if (d[0] === 'c') { const [cx, cy, r] = d.slice(1).split(',').map(Number); return <circle key={i} cx={cx} cy={cy} r={r} fill={i === 0 ? fill : 'none'} />; }
        return <path key={i} d={d} fill={i === 0 ? fill : 'none'} />;
      })}
    </svg>
  );
}
