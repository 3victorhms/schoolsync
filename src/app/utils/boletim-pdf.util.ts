// Exportação do boletim em PDF, gerada no próprio app (sem carga na API).
// jsPDF e os plugins do Capacitor são carregados só quando o aluno toca em "Exportar",
// para não pesar a abertura do app.
//
// No Android o arquivo vai para o cache do app e abre a folha de compartilhamento
// (salvar no Drive, mandar no WhatsApp...). No navegador, baixa direto.

import { Capacitor } from '@capacitor/core';
import {
  Boletim,
  LinhaBoletim,
  META_APROVACAO,
  ROTULO_SITUACAO,
  SituacaoMateria,
  analisarMateria,
  aproveitamento,
  juntarNomes,
  resumirSituacoes
} from './boletim.util';
import { formatarDataBr } from './periodo.util';
import { NotaModel } from '../model/nota.model';

export interface DadosPdfBoletim {
  boletim: Boletim;
  nomeSala: string;
  nomeAluno: string;
}

const MARGEM = 15;
const LARGURA_PAGINA = 210;
const ALTURA_PAGINA = 297;
const LARGURA_UTIL = LARGURA_PAGINA - MARGEM * 2;
const ALTURA_LINHA = 7;

const COR_TEXTO: [number, number, number] = [33, 37, 41];
const COR_SUAVE: [number, number, number] = [110, 117, 130];
const COR_DESTAQUE: [number, number, number] = [76, 134, 190];
const COR_FUNDO_CABECALHO: [number, number, number] = [232, 240, 250];
const COR_LINHA: [number, number, number] = [220, 224, 230];

// Cor do texto da situação de cada matéria (feito com auxílio do Claude)
const COR_SITUACAO: Record<SituacaoMateria, [number, number, number]> = {
  'atingida': [40, 140, 80],
  'no-caminho': COR_DESTAQUE,
  'atencao': [190, 120, 0],
  'fora-de-alcance': [200, 55, 55],
  'sem-notas': COR_SUAVE,
  'sem-pontos': COR_SUAVE,
};

interface Coluna {
  titulo: string;
  largura: number;
  alinhamento?: 'left' | 'right' | 'center';
}

function numero(valor: number): string {
  return Number.isInteger(valor) ? String(valor) : valor.toFixed(2).replace('.', ',');
}

function percentual(obtido: number, avaliado: number): string {
  const valor = aproveitamento(obtido, avaliado);
  return valor === null ? '-' : `${valor}%`;
}

function nomeArquivo(nomeSala: string): string {
  const base = nomeSala
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-zA-Z0-9]+/g, '-').replace(/^-|-$/g, '').toLowerCase() || 'sala';
  return `boletim-${base}.pdf`;
}

export async function exportarBoletimPdf(dados: DadosPdfBoletim): Promise<void> {
  const { jsPDF } = await import('jspdf');
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  let y = MARGEM;

  const garantirEspaco = (altura: number) => {
    if (y + altura > ALTURA_PAGINA - MARGEM) {
      doc.addPage();
      y = MARGEM;
    }
  };

  const texto = (conteudo: string, x: number, tamanho: number, estilo: 'normal' | 'bold' = 'normal',
    cor: [number, number, number] = COR_TEXTO, alinhamento: 'left' | 'right' | 'center' = 'left') => {
    doc.setFont('helvetica', estilo);
    doc.setFontSize(tamanho);
    doc.setTextColor(...cor);
    doc.text(conteudo, x, y, { align: alinhamento });
  };

  /** Parágrafo que quebra em várias linhas se não couber na largura da página. */
  const paragrafo = (conteudo: string, tamanho: number, estilo: 'normal' | 'bold' = 'normal',
    cor: [number, number, number] = COR_TEXTO) => {
    if (!conteudo) return;
    doc.setFont('helvetica', estilo);
    doc.setFontSize(tamanho);
    const partes: string[] = doc.splitTextToSize(conteudo, LARGURA_UTIL);
    partes.forEach((parte, i) => {
      if (i > 0) y += tamanho * 0.45;
      texto(parte, MARGEM, tamanho, estilo, cor);
    });
  };

  /**
   * Desenha uma tabela simples; repete o cabeçalho se quebrar de página.
   * `situacoes` (opcional) pinta a última coluna com a cor da situação da matéria.
   */
  const tabela = (colunas: Coluna[], linhas: string[][], ultimaEmNegrito = false, situacoes?: SituacaoMateria[]) => {
    const desenharCabecalho = () => {
      doc.setFillColor(...COR_FUNDO_CABECALHO);
      doc.rect(MARGEM, y - 5, LARGURA_UTIL, ALTURA_LINHA, 'F');
      let x = MARGEM;
      colunas.forEach(coluna => {
        const xTexto = coluna.alinhamento === 'right' ? x + coluna.largura - 2
          : coluna.alinhamento === 'center' ? x + coluna.largura / 2 : x + 2;
        texto(coluna.titulo, xTexto, 9, 'bold', COR_TEXTO, coluna.alinhamento ?? 'left');
        x += coluna.largura;
      });
      y += ALTURA_LINHA;
    };

    garantirEspaco(ALTURA_LINHA * 2);
    desenharCabecalho();

    linhas.forEach((linha, indice) => {
      if (y + ALTURA_LINHA > ALTURA_PAGINA - MARGEM) {
        doc.addPage();
        y = MARGEM + 5;
        desenharCabecalho();
      }
      const negrito = ultimaEmNegrito && indice === linhas.length - 1;
      let x = MARGEM;
      linha.forEach((celula, i) => {
        const coluna = colunas[i];
        const xTexto = coluna.alinhamento === 'right' ? x + coluna.largura - 2
          : coluna.alinhamento === 'center' ? x + coluna.largura / 2 : x + 2;
        // Corta textos longos para caberem na coluna
        const conteudo = doc.splitTextToSize(celula, coluna.largura - 4)[0] ?? '';
        const situacao = situacoes && i === linha.length - 1 ? situacoes[indice] : undefined;
        texto(conteudo, xTexto, 9.5, negrito || situacao ? 'bold' : 'normal',
          situacao ? COR_SITUACAO[situacao] : COR_TEXTO, coluna.alinhamento ?? 'left');
        x += coluna.largura;
      });
      doc.setDrawColor(...COR_LINHA);
      doc.line(MARGEM, y + 2, MARGEM + LARGURA_UTIL, y + 2);
      y += ALTURA_LINHA;
    });
    y += 4;
  };

  const { boletim, nomeSala, nomeAluno } = dados;

  // ===== Cabeçalho =====
  y += 5;
  texto('Boletim escolar', MARGEM, 20, 'bold', COR_DESTAQUE);
  y += 8;
  texto(nomeSala, MARGEM, 12, 'bold');
  y += 6;
  texto(`Aluno(a): ${nomeAluno}`, MARGEM, 10, 'normal', COR_SUAVE);
  texto(`Emitido em ${new Date().toLocaleDateString('pt-BR')} pelo SchoolSync`, LARGURA_PAGINA - MARGEM, 10, 'normal', COR_SUAVE, 'right');
  y += 4;
  doc.setDrawColor(...COR_DESTAQUE);
  doc.setLineWidth(0.6);
  doc.line(MARGEM, y, LARGURA_PAGINA - MARGEM, y);
  doc.setLineWidth(0.2);
  y += 10;

  // ===== Resumo do ano =====
  // Sem linha de "Total": a aprovação é por matéria, então somar matérias diferentes
  // esconderia justamente a matéria que está mal. No lugar, cada matéria tem sua situação.
  const metaPercentual = Math.round(META_APROVACAO * 100);

  /** "Meta de 60% atingida em 3 de 8 matérias · foque em Química e Física" */
  const frase = (linhas: LinhaBoletim[]): string => {
    const resumo = resumirSituacoes(linhas);
    if (!resumo.total) return '';
    const partes = [`Meta de ${metaPercentual}% atingida em ${resumo.contagem['atingida']} de ${resumo.total} matérias`];
    if (resumo.foco.length) partes.push(`foque em ${juntarNomes(resumo.foco.map(l => l.nomeMateria), 4)}`);
    return partes.join(' · ');
  };

  const colunasPeriodos = boletim.periodos.length;
  const colunasAno: Coluna[] = [
    { titulo: 'Matéria', largura: 40 },
    ...boletim.periodos.map(p => ({
      titulo: `${p.periodo.ordem}º`,
      largura: Math.min(18, (LARGURA_UTIL - 40 - 76) / Math.max(1, colunasPeriodos)),
      alinhamento: 'center' as const,
    })),
    { titulo: 'Total', largura: 16, alinhamento: 'right' },
    { titulo: 'Máx.', largura: 14, alinhamento: 'right' },
    { titulo: 'Aprov.', largura: 16, alinhamento: 'right' },
    { titulo: 'Situação', largura: 30 },
  ];
  // A coluna da matéria absorve a sobra para a tabela ocupar a largura toda
  colunasAno[0].largura += LARGURA_UTIL - colunasAno.reduce((soma, c) => soma + c.largura, 0);

  garantirEspaco(40);
  texto('Resumo do ano', MARGEM, 13, 'bold');
  y += 6;
  paragrafo(frase(boletim.ano), 10, 'bold', COR_TEXTO);
  y += 7;

  const situacoesAno = boletim.ano.map(linha => analisarMateria(linha).situacao);
  const linhasAno = boletim.ano.map((linha, indice) => [
    linha.nomeMateria,
    ...boletim.periodos.map(p => {
      const doPeriodo = p.linhas.find(l => l.idMateria === linha.idMateria);
      return doPeriodo && doPeriodo.avaliado > 0 ? numero(doPeriodo.obtido) : '-';
    }),
    linha.avaliado > 0 ? numero(linha.obtido) : '-',
    numero(linha.maximo),
    percentual(linha.obtido, linha.avaliado),
    ROTULO_SITUACAO[situacoesAno[indice]],
  ]);
  tabela(colunasAno, linhasAno, false, situacoesAno);

  paragrafo(
    `Situação: compara os pontos de cada matéria com a meta de ${metaPercentual}% do máximo. ` +
    'Atenção = ainda dá para chegar, mas é preciso tirar no que falta uma porcentagem maior do que vem tirando. ' +
    'Fora de alcance = mesmo tirando tudo o que falta, não chega na meta. ' +
    'Aprov. (aproveitamento) = nota obtida / valor das avaliações já lançadas.',
    8, 'normal', COR_SUAVE);
  y += 8;

  // ===== Um bloco por período =====
  const colunasPeriodo: Coluna[] = [
    { titulo: 'Matéria', largura: 58 },
    { titulo: 'Notas', largura: 16, alinhamento: 'center' },
    { titulo: 'Obtido', largura: 18, alinhamento: 'right' },
    { titulo: 'Avaliado', largura: 20, alinhamento: 'right' },
    { titulo: 'Máximo', largura: 18, alinhamento: 'right' },
    { titulo: 'Aprov.', largura: 18, alinhamento: 'right' },
    { titulo: 'Situação', largura: 32 },
  ];

  const colunasNotas: Coluna[] = [
    { titulo: 'Data', largura: 22 },
    { titulo: 'Matéria', largura: 40 },
    { titulo: 'Avaliação', largura: 88 },
    { titulo: 'Nota', largura: 30, alinhamento: 'right' },
  ];

  boletim.periodos.forEach(periodoBoletim => {
    const { periodo } = periodoBoletim;
    y += 2;
    garantirEspaco(40);
    texto(periodo.nome, MARGEM, 13, 'bold');
    texto(`${formatarDataBr(periodo.dataInicio)} a ${formatarDataBr(periodo.dataFim)} · até ${numero(periodo.pontuacaoMaxima)} pontos por matéria`,
      LARGURA_PAGINA - MARGEM, 9, 'normal', COR_SUAVE, 'right');
    y += 6;
    paragrafo(frase(periodoBoletim.linhas), 9.5, 'bold', COR_TEXTO);
    y += 7;

    const situacoes = periodoBoletim.linhas.map(linha => analisarMateria(linha).situacao);
    const linhas = periodoBoletim.linhas.map((linha: LinhaBoletim, indice) => [
      linha.nomeMateria,
      String(linha.notas.length),
      linha.avaliado > 0 ? numero(linha.obtido) : '-',
      numero(linha.avaliado),
      numero(linha.maximo),
      percentual(linha.obtido, linha.avaliado),
      ROTULO_SITUACAO[situacoes[indice]],
    ]);
    tabela(colunasPeriodo, linhas, false, situacoes);

    const notas = periodoBoletim.linhas
      .reduce<NotaModel[]>((todas, l) => todas.concat(l.notas), [])
      .sort((a, b) => a.data.localeCompare(b.data));
    if (notas.length) {
      garantirEspaco(20);
      texto('Avaliações lançadas', MARGEM, 10, 'bold', COR_SUAVE);
      y += 6;
      tabela(colunasNotas, notas.map(nota => [
        formatarDataBr(nota.data),
        nota.nomeMateria,
        nota.avulsa ? `${nota.descricao} (avulsa)` : nota.descricao,
        `${numero(nota.valorObtido)} / ${numero(nota.valorMaximo)}`,
      ]));
    }
  });

  // ===== Rodapé com numeração =====
  const totalPaginas = doc.getNumberOfPages();
  for (let pagina = 1; pagina <= totalPaginas; pagina++) {
    doc.setPage(pagina);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(...COR_SUAVE);
    doc.text(`Notas lançadas pelo próprio aluno · página ${pagina} de ${totalPaginas}`,
      LARGURA_PAGINA / 2, ALTURA_PAGINA - 8, { align: 'center' });
  }

  await salvarOuCompartilhar(doc.output('datauristring'), nomeArquivo(nomeSala), doc);
}

async function salvarOuCompartilhar(dataUri: string, arquivo: string, doc: { save: (nome: string) => unknown }): Promise<void> {
  if (!Capacitor.isNativePlatform()) {
    doc.save(arquivo);
    return;
  }

  const [{ Filesystem, Directory }, { Share }] = await Promise.all([
    import('@capacitor/filesystem'),
    import('@capacitor/share'),
  ]);

  const base64 = dataUri.substring(dataUri.indexOf(',') + 1);
  const resultado = await Filesystem.writeFile({
    path: arquivo,
    data: base64,
    directory: Directory.Cache,
  });

  await Share.share({
    title: 'Boletim',
    dialogTitle: 'Salvar ou enviar o boletim',
    files: [resultado.uri],
  });
}
