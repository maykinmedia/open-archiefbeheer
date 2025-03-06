export type LogoProps = {
  width?: number;
};

export function Logo({ width = 128 }: LogoProps) {
  return <img src="/logo.svg" alt="Open Archiefbeheer Logo" width={width} />;
}
