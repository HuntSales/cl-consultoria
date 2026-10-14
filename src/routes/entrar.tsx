import { zodResolver } from "@hookform/resolvers/zod";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { lovable } from "@/integrations/lovable/index";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/entrar")({
  head: () => ({
    meta: [
      { title: "Entrar — Painel Cibele Lucena" },
      {
        name: "description",
        content:
          "Acesso da equipe ao painel de diagnóstico financeiro comportamental da consultoria Cibele Lucena.",
      },
      { property: "og:title", content: "Entrar — Painel Cibele Lucena" },
      {
        property: "og:description",
        content: "Acesso restrito da equipe ao painel de diagnóstico financeiro.",
      },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: EntrarPage,
});

const entrarSchema = z.object({
  email: z.string().min(1, "Informe o e-mail.").email("E-mail inválido."),
  senha: z.string().min(6, "A senha precisa ter ao menos 6 caracteres."),
});

const cadastroSchema = entrarSchema.extend({
  nomeCompleto: z.string().min(3, "Informe o nome completo."),
});

function GoogleButton({ carregando }: { carregando: boolean }) {
  const [indo, setIndo] = useState(false);

  async function entrarComGoogle() {
    setIndo(true);
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin + "/painel",
    });
    if (result.error) {
      setIndo(false);
      toast.error("Não foi possível entrar com o Google.");
      return;
    }
    if (result.redirected) return;
    window.location.href = "/painel";
  }

  return (
    <Button
      type="button"
      variant="outline"
      className="w-full"
      disabled={indo || carregando}
      onClick={entrarComGoogle}
    >
      {indo ? "Abrindo o Google..." : "Continuar com Google"}
    </Button>
  );
}

function EntrarPage() {
  const navigate = useNavigate();
  const [carregando, setCarregando] = useState(false);

  const formEntrar = useForm<z.infer<typeof entrarSchema>>({
    resolver: zodResolver(entrarSchema),
    defaultValues: { email: "", senha: "" },
  });

  const formCadastro = useForm<z.infer<typeof cadastroSchema>>({
    resolver: zodResolver(cadastroSchema),
    defaultValues: { nomeCompleto: "", email: "", senha: "" },
  });

  async function aoEntrar(valores: z.infer<typeof entrarSchema>) {
    setCarregando(true);
    const { error } = await supabase.auth.signInWithPassword({
      email: valores.email,
      password: valores.senha,
    });
    setCarregando(false);
    if (error) {
      toast.error("E-mail ou senha incorretos.");
      return;
    }
    navigate({ to: "/painel" });
  }

  async function aoCadastrar(valores: z.infer<typeof cadastroSchema>) {
    setCarregando(true);
    const { error } = await supabase.auth.signUp({
      email: valores.email,
      password: valores.senha,
      options: {
        emailRedirectTo: window.location.origin + "/painel",
        data: { nome_completo: valores.nomeCompleto },
      },
    });
    setCarregando(false);
    if (error) {
      toast.error(
        error.message.includes("already")
          ? "Já existe uma conta com este e-mail."
          : "Não foi possível criar a conta.",
      );
      return;
    }
    toast.success("Conta criada. Seu acesso passa por aprovação.");
    navigate({ to: "/painel" });
  }

  return (
    <div className="theme-painel flex min-h-screen items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <p className="text-xs uppercase tracking-[0.25em] text-accent">Cibele Lucena</p>
          <h1 className="mt-3 text-2xl font-semibold uppercase text-foreground">
            Painel da consultoria
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Área restrita. O acesso de novos consultores passa por aprovação.
          </p>
        </div>

        <div className="rounded-lg border border-border bg-card p-6 shadow-sm">
          <Tabs defaultValue="entrar">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="entrar">Entrar</TabsTrigger>
              <TabsTrigger value="criar">Criar conta</TabsTrigger>
            </TabsList>

            <TabsContent value="entrar" className="mt-6">
              <Form {...formEntrar}>
                <form onSubmit={formEntrar.handleSubmit(aoEntrar)} className="space-y-4">
                  <FormField
                    control={formEntrar.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>E-mail</FormLabel>
                        <FormControl>
                          <Input type="email" autoComplete="email" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={formEntrar.control}
                    name="senha"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Senha</FormLabel>
                        <FormControl>
                          <Input type="password" autoComplete="current-password" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button type="submit" className="w-full" disabled={carregando}>
                    {carregando ? "Entrando..." : "Entrar"}
                  </Button>
                </form>
              </Form>
            </TabsContent>

            <TabsContent value="criar" className="mt-6">
              <Form {...formCadastro}>
                <form onSubmit={formCadastro.handleSubmit(aoCadastrar)} className="space-y-4">
                  <FormField
                    control={formCadastro.control}
                    name="nomeCompleto"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nome completo</FormLabel>
                        <FormControl>
                          <Input autoComplete="name" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={formCadastro.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>E-mail</FormLabel>
                        <FormControl>
                          <Input type="email" autoComplete="email" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={formCadastro.control}
                    name="senha"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Senha</FormLabel>
                        <FormControl>
                          <Input type="password" autoComplete="new-password" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button type="submit" className="w-full" disabled={carregando}>
                    {carregando ? "Criando conta..." : "Criar conta"}
                  </Button>
                </form>
              </Form>
            </TabsContent>
          </Tabs>

          <div className="my-6 flex items-center gap-3">
            <span className="h-px flex-1 bg-border" />
            <span className="text-xs uppercase tracking-widest text-muted-foreground">ou</span>
            <span className="h-px flex-1 bg-border" />
          </div>

          <GoogleButton carregando={carregando} />
        </div>
      </div>
    </div>
  );
}
