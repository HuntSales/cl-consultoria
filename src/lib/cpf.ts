export function apenasDigitosCpf(valor: string) {
  return valor.replace(/\D/g, "").slice(0, 11);
}

export function formatarCpf(valor: string) {
  const d = apenasDigitosCpf(valor);
  if (d.length <= 3) return d;
  if (d.length <= 6) return `${d.slice(0, 3)}.${d.slice(3)}`;
  if (d.length <= 9) return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6)}`;
  return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6, 9)}-${d.slice(9)}`;
}

export function cpfValido(valor: string) {
  const d = apenasDigitosCpf(valor);
  if (d.length !== 11) return false;
  if (/^(\d)\1{10}$/.test(d)) return false;
  const digito = (base: string, pesoInicial: number) => {
    let soma = 0;
    for (let i = 0; i < base.length; i += 1) soma += Number(base[i]) * (pesoInicial - i);
    const resto = (soma * 10) % 11;
    return resto === 10 ? 0 : resto;
  };
  const d1 = digito(d.slice(0, 9), 10);
  const d2 = digito(d.slice(0, 10), 11);
  return d1 === Number(d[9]) && d2 === Number(d[10]);
}
