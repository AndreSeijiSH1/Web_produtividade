// Ícones simples em SVG (traço), herdam a cor do texto.
const base = {
  width: 18, height: 18, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor',
  strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round', 'aria-hidden': true,
};

export const Casa = () => (<svg {...base}><path d="M3 11l9-7 9 7" /><path d="M5 10v10h14V10" /></svg>);
export const Calendario = () => (<svg {...base}><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M3 10h18M8 3v4M16 3v4" /></svg>);
export const Corrente = () => (<svg {...base}><path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1" /><path d="M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1" /></svg>);
export const Nota = () => (<svg {...base}><path d="M5 3h10l4 4v14H5z" /><path d="M9 12h6M9 16h6M9 8h3" /></svg>);
export const Relogio = () => (<svg {...base}><circle cx="12" cy="13" r="8" /><path d="M12 9v4l2.5 2.5M9 2h6" /></svg>);
export const Sol = () => (<svg {...base}><circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" /></svg>);
export const Lua = () => (<svg {...base}><path d="M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5z" /></svg>);
export const Monitor = () => (<svg {...base}><rect x="3" y="4" width="18" height="12" rx="2" /><path d="M8 20h8M12 16v4" /></svg>);
export const Mais = () => (<svg {...base}><path d="M12 5v14M5 12h14" /></svg>);
export const Lixo = () => (<svg {...base}><path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13" /></svg>);
export const Lapis = () => (<svg {...base}><path d="M4 20h4L19 9l-4-4L4 16z" /></svg>);
export const Sair = () => (<svg {...base}><path d="M15 4h4v16h-4M10 8l-4 4 4 4M6 12h10" /></svg>);
export const Pino = () => (<svg {...base}><path d="M9 4h6l-1 6 3 3H7l3-3zM12 13v7" /></svg>);
export const Alerta = () => (<svg {...base}><path d="M12 3l9 16H3z" /><path d="M12 10v4M12 17v.5" /></svg>);
export const Externo = () => (<svg {...base} width={14} height={14}><path d="M14 4h6v6M20 4l-9 9M18 14v6H4V6h6" /></svg>);
export const Esquerda = () => (<svg {...base}><path d="M15 6l-6 6 6 6" /></svg>);
export const Direita = () => (<svg {...base}><path d="M9 6l6 6-6 6" /></svg>);
