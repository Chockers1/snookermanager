export const captureRoutes = Object.freeze({
  match: '/match/live', dashboard: '/', tournament: '/tournaments/hub',
  training: '/training', attributes: '/player/attributes', rankings: '/rankings',
  staff: '/staff/coaches', sponsors: '/sponsorship', finance: '/finance', legacy: '/career/stats',
});

export function parseCaptureOptions(args) {
  const options = { screen: 'dashboard', check: false };
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === '--check') options.check = true;
    else if (arg === '--save' || arg === '--screen') {
      const value = args[++i];
      if (!value || value.startsWith('--')) throw new Error(`${arg} needs a value.`);
      options[arg.slice(2)] = value;
    } else throw new Error(`Unknown argument: ${arg}`);
  }
  if (!options.save) throw new Error('Provide --save with an existing portable career JSON export.');
  if (!Object.hasOwn(captureRoutes, options.screen)) throw new Error(`Choose --screen from: ${Object.keys(captureRoutes).join(', ')}`);
  return { ...options, route: captureRoutes[options.screen] };
}
