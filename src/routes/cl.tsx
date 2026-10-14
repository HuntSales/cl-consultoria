import { createFileRoute } from "@tanstack/react-router";
import { Nav } from "@/components/landing-cl/Nav";
import { Hero } from "@/components/landing-cl/Hero";
import { Marquee } from "@/components/landing-cl/Marquee";
import { Scenario } from "@/components/landing-cl/Scenario";
import { Recognize } from "@/components/landing-cl/Recognize";
import { MethodRaiz } from "@/components/landing-cl/MethodRaiz";
import { Esteira } from "@/components/landing-cl/Esteira";
import { Changes } from "@/components/landing-cl/Changes";
import { ForWhom } from "@/components/landing-cl/ForWhom";
import { Beliefs } from "@/components/landing-cl/Beliefs";
import { StartHere } from "@/components/landing-cl/StartHere";
import { Footer } from "@/components/landing-cl/Footer";

export const Route = createFileRoute("/cl")({
  head: () => ({
    meta: [
      { title: "RAIZ — Consultoria Financeira" },
      {
        name: "description",
        content:
          "Psicanálise, método e IA. Vamos à raiz do comportamento que define seus resultados financeiros — Para Você e Para Seu Negócio.",
      },
      { property: "og:title", content: "RAIZ — Consultoria Financeira" },
      {
        property: "og:description",
        content: "Finanças que crescem da raiz. Psicanálise · Método · IA.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ClPage,
});

function ClPage() {
  return (
    <>
      <Nav />
      <Hero />
      <Marquee />
      <Scenario />
      <Recognize />
      <MethodRaiz />
      <Esteira />
      <Changes />
      <ForWhom />
      <Beliefs />
      <StartHere />
      <Footer />
    </>
  );
}
