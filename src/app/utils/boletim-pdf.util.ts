// Exportação do boletim em PDF, gerada no próprio app (sem carga na API).
// jsPDF e os plugins do Capacitor são carregados só quando o aluno toca em "Exportar",
// para não pesar a abertura do app.
//
// No Android o arquivo vai para o cache do app e abre a folha de compartilhamento
// (salvar no Drive, mandar no WhatsApp...). No navegador, baixa direto.

import { Capacitor } from '@capacitor/core';
import { Boletim, LinhaBoletim, aproveitamento } from './boletim.util';
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

  /** Desenha uma tabela simples; repete o cabeçalho se quebrar de página. */
  const tabela = (colunas: Coluna[], linhas: string[][], ultimaEmNegrito = false) => {
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
        texto(conteudo, xTexto, 9.5, negrito ? 'bold' : 'normal', COR_TEXTO, coluna.alinhamento ?? 'left');
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
  const colunasPeriodos = boletim.periodos.length;
  const larguraMateria = 50;
  const larguraPeriodo = Math.min(22, (LARGURA_UTIL - larguraMateria - 50) / Math.max(1, colunasPeriodos));
  const colunasAno: Coluna[] = [
    { titulo: 'Matéria', largura: larguraMateria },
    ...boletim.periodos.map(p => ({ titulo: `${p.periodo.ordem}º`, largura: larguraPeriodo, alinhamento: 'center' as const })),
    { titulo: 'Total', largura: 18, alinhamento: 'right' },
    { titulo: 'Máx.', largura: 16, alinhamento: 'right' },
    { titulo: 'Aprov.', largura: 16, alinhamento: 'right' },
  ];
  // A coluna da matéria absorve a sobra para a tabela ocupar a largura toda
  colunasAno[0].largura += LARGURA_UTIL - colunasAno.reduce((soma, c) => soma + c.largura, 0);

  garantirEspaco(30);
  texto('Resumo do ano', MARGEM, 13, 'bold');
  y += 5;
  texto('Pontos obtidos em cada período. Aproveitamento = nota obtida / valor das avaliações já lançadas.',
    MARGEM, 8, 'normal', COR_SUAVE);
  y += 7;

  const linhasAno = boletim.ano.map(linha => [
    linha.nomeMateria,
    ...boletim.periodos.map(p => {
      const doPeriodo = p.linhas.find(l => l.idMateria === linha.idMateria);
      return doPeriodo && doPeriodo.avaliado > 0 ? numero(doPeriodo.obtido) : '-';
    }),
    numero(linha.obtido),
    numero(linha.maximo),
    percentual(linha.obtido, linha.avaliado),
  ]);
  linhasAno.push([
    'Total',
    ...boletim.periodos.map(p => (p.avaliado > 0 ? numero(p.obtido) : '-')),
    numero(boletim.obtidoAno),
    numero(boletim.maximoAno),
    percentual(boletim.obtidoAno, boletim.avaliadoAno),
  ]);
  tabela(colunasAno, linhasAno, true);

  // ===== Um bloco por período =====
  const colunasPeriodo: Coluna[] = [
    { titulo: 'Matéria', largura: 70 },
    { titulo: 'Avaliações', largura: 24, alinhamento: 'center' },
    { titulo: 'Obtido', largura: 22, alinhamento: 'right' },
    { titulo: 'Avaliado', largura: 22, alinhamento: 'right' },
    { titulo: 'Máximo', largura: 20, alinhamento: 'right' },
    { titulo: 'Aprov.', largura: 22, alinhamento: 'right' },
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
    y += 7;

    const linhas = periodoBoletim.linhas.map((linha: LinhaBoletim) => [
      linha.nomeMateria,
      String(linha.notas.length),
      linha.avaliado > 0 ? numero(linha.obtido) : '-',
      numero(linha.avaliado),
      numero(linha.maximo),
      percentual(linha.obtido, linha.avaliado),
    ]);
    linhas.push([
      'Total do período', '',
      numero(periodoBoletim.obtido), numero(periodoBoletim.avaliado), numero(periodoBoletim.maximo),
      percentual(periodoBoletim.obtido, periodoBoletim.avaliado),
    ]);
    tabela(colunasPeriodo, linhas, true);

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
