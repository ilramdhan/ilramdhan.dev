// Minimal typings for the Vanta globe effect (the package ships no types).
declare module 'vanta/dist/vanta.globe.min.js' {
  export interface VantaEffect {
    setOptions(options: Record<string, unknown>): void;
    destroy(): void;
  }
  const GLOBE: (options: Record<string, unknown>) => VantaEffect;
  export default GLOBE;
}
