import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { useServerFn } from "@tanstack/react-start";
import { ArrowLeft } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Link } from "@tanstack/react-router";

import { criarDiagnostico } from "@/lib/diagnosticos.functions";

const schema = z.object({
  titulo: z.string().min(3, "Mínimo 3 caracteres.").max(120),
  descricao: z.string().max(500).optional(),
  slug: z.string().max(160).optional(),
});

type FormValues = z.infer<typeof schema>;

export const Route = createFileRoute("/_authenticated/painel/diagnosticos/novo")({
  component: NovoDiagnosticoPage,
});

function NovoDiagnosticoPage() {
  const navigate = useNavigate();
  const criar = useServerFn(criarDiagnostico);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { titulo: "", descricao: "", slug: "" },
  });

  async function onSubmit(values: FormValues) {
    try {
      const { id } = await criar({
        data: {
          titulo: values.titulo,
          descricao: values.descricao || undefined,
          slug: values.slug || undefined,
        },
      });
      toast.success("Diagnóstico criado.");
      await navigate({ to: "/painel/diagnosticos/$id", params: { id } });
    } catch (e) {
      toast.error("Não foi possível criar o diagnóstico.");
    }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <Button variant="ghost" size="sm" asChild>
        <Link to="/painel/diagnosticos">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Voltar
        </Link>
      </Button>

      <div>
        <h1 className="text-3xl font-semibold tracking-wide">Novo diagnóstico</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Preencha os dados básicos. Depois você poderá adicionar dimensões, perguntas e perfis de resultado.
        </p>
      </div>

      <Card className="p-6">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
            <FormField
              control={form.control}
              name="titulo"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Título</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: Diagnóstico Financeiro Comportamental" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="descricao"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descrição</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Breve descrição do objetivo do diagnóstico..."
                      rows={4}
                      {...field}
                      value={field.value || ""}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="slug"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Slug (opcional)</FormLabel>
                  <FormControl>
                    <Input placeholder="diagnostico-financeiro" {...field} value={field.value || ""} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="flex justify-end gap-3 pt-2">
              <Button variant="outline" asChild>
                <Link to="/painel/diagnosticos">Cancelar</Link>
              </Button>
              <Button type="submit" className="bg-primary text-primary-foreground hover:bg-primary/90">
                Criar e continuar
              </Button>
            </div>
          </form>
        </Form>
      </Card>
    </div>
  );
}
