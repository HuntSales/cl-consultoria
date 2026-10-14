import { useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";

import { transcreverAudio } from "@/lib/gestao.functions";

/** Gravação por microfone com transcrição automática (Lovable AI). */
export function useDitado(aoTranscrever: (texto: string) => void) {
  const transcreverFn = useServerFn(transcreverAudio);
  const [gravando, setGravando] = useState(false);
  const [transcrevendo, setTranscrevendo] = useState(false);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  async function alternarGravacao() {
    if (gravando) {
      recorderRef.current?.stop();
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      chunksRef.current = [];
      recorder.ondataavailable = (e) => chunksRef.current.push(e.data);
      recorder.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        setGravando(false);
        const blob = new Blob(chunksRef.current, { type: recorder.mimeType || "audio/webm" });
        if (blob.size < 2048) {
          toast.error("Gravação muito curta. Tente novamente.");
          return;
        }
        setTranscrevendo(true);
        try {
          const buffer = await blob.arrayBuffer();
          const bytes = new Uint8Array(buffer);
          let binario = "";
          for (let i = 0; i < bytes.length; i += 1) binario += String.fromCharCode(bytes[i]!);
          const { texto } = await transcreverFn({ data: { audioBase64: btoa(binario), mime: blob.type } });
          if (texto.trim()) aoTranscrever(texto.trim());
        } catch (erro) {
          toast.error(erro instanceof Error ? erro.message : "Não foi possível transcrever o áudio.");
        } finally {
          setTranscrevendo(false);
        }
      };
      recorder.start();
      recorderRef.current = recorder;
      setGravando(true);
    } catch {
      toast.error("Não foi possível acessar o microfone.");
    }
  }

  return { gravando, transcrevendo, alternarGravacao };
}
