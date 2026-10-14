import logoClMonogram from "@/assets/logo-cl-monogram.png.asset.json";
import { Nav } from "@/components/landing-cl/Nav";

export function NavCln() {
  return (
    <Nav
      brand="CIBELE LUCENA"
      sub="CONSULTORIA FINANCEIRA"
      logoSrc={logoClMonogram.url}
      logoAlt="Cibele Lucena — Consultoria Financeira"
    />
  );
}
