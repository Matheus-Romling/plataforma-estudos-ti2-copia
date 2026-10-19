// Gerenciamento de Tarefas - Quorbe / TI2
// Integrado com o servidor da plataforma no endpoint /tarefas.

let tarefas = [];
let turmas = [];
let filtroAtual = 'todos';

// Elementos da interface
const listaTarefas = document.getElementById('listaTarefas');
const alertaSucesso = document.getElementById('alertaSucesso');
const alertaErro = document.getElementById('alertaErro');
const modalTarefaEl = document.getElementById('modalTarefa');
const modalTarefa = new bootstrap.Modal(modalTarefaEl);
const modalDetalhesEl = document.getElementById('modalDetalhes');
const modalDetalhes = new bootstrap.Modal(modalDetalhesEl);
const formTarefa = document.getElementById('formTarefa');

// Funções auxiliares para falar com a API Node / JSON Server
async function api(url, opcoes = {}) {
  const res = await fetch(url, opcoes);
  if (!res.ok) {
    throw new Error(`Erro ${res.status} ao comunicar com a API em ${url}`);
  }
  return res.json();
}

function jsonHeaders(metodo, corpo) {
  return {
    method: metodo,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(corpo),
  };
}

function mostrarMensagem(tipo, texto) {
  if (tipo === 'sucesso') {
    alertaSucesso.textContent = texto;
    alertaSucesso.classList.remove('d-none');
    setTimeout(() => alertaSucesso.classList.add('d-none'), 4000);
  } else {
    alertaErro.textContent = texto;
    alertaErro.classList.remove('d-none');
    setTimeout(() => alertaErro.classList.add('d-none'), 5000);
  }
}

// Formatação amigável de data e hora (HH:MM DD/MM conforme PDF)
function formatarPrazo(isoString) {
  if (!isoString) return 'Sem prazo definido';
  try {
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return isoString;
    const dia = String(d.getDate()).padStart(2, '0');
    const mes = String(d.getMonth() + 1).padStart(2, '0');
    const ano = d.getFullYear();
    const horas = String(d.getHours()).padStart(2, '0');
    const minutos = String(d.getMinutes()).padStart(2, '0');
    return `${horas}:${minutos} ${dia}/${mes}/${ano}`;
  } catch {
    return isoString;
  }
}

// Converte string ISO para o formato do input datetime-local (YYYY-MM-DDTHH:mm)
function paraInputDatetime(isoString) {
  if (!isoString) return '';
  const d = new Date(isoString);
  if (isNaN(d.getTime())) return '';
  const ano = d.getFullYear();
  const mes = String(d.getMonth() + 1).padStart(2, '0');
  const dia = String(d.getDate()).padStart(2, '0');
  const horas = String(d.getHours()).padStart(2, '0');
  const minutos = String(d.getMinutes()).padStart(2, '0');
  return `${ano}-${mes}-${dia}T${horas}:${minutos}`;
}

// Carregar dados do servidor Node.js
async function carregar() {
  try {
    const [dadosTarefas, dadosTurmas] = await Promise.all([
      api('/tarefas'),
      api('/turmas')
    ]);
    tarefas = dadosTarefas;
    turmas = dadosTurmas;
    preencherSelectTurmas();
    desenhar();
  } catch (erro) {
    console.error('Falha ao carregar dados:', erro);
    mostrarMensagem('erro', 'Não foi possível carregar as tarefas. Tente novamente em instantes.');
  }
}

function preencherSelectTurmas() {
  const select = document.getElementById('tarefaTurma');
  select.innerHTML = '<option value="">Selecione uma turma ou disciplina...</option>';
  turmas.forEach((t) => {
    const op = document.createElement('option');
    op.value = t.id;
    op.textContent = t.nome;
    op.dataset.nome = t.nome;
    select.appendChild(op);
  });
}

function badgeEstado(estado) {
  switch (estado) {
    case 'concluida':
      return '<span class="badge text-bg-success">Concluída</span>';
    case 'em_progresso':
      return '<span class="badge text-bg-warning text-dark">Em progresso</span>';
    case 'pendente':
    default:
      return '<span class="badge text-bg-secondary">Pendente</span>';
  }
}

// Renderiza a lista de tarefas conforme o wireframe do PDF
function desenhar() {
  listaTarefas.innerHTML = '';

  const busca = (document.getElementById('buscaTarefa')?.value || '').toLowerCase().trim();

  let filtradas = tarefas.filter((t) => {
    const correspondeBusca = !busca || t.nome.toLowerCase().includes(busca) || (t.descricao && t.descricao.toLowerCase().includes(busca));
    const correspondeFiltro = filtroAtual === 'todos' || t.estado === filtroAtual;
    return correspondeBusca && correspondeFiltro;
  });

  // Atualiza contador no topo
  const contadorEl = document.getElementById('contadorTarefas');
  if (contadorEl) {
    contadorEl.textContent = `${filtradas.length} ${filtradas.length === 1 ? 'tarefa' : 'tarefas'}`;
  }

  if (filtradas.length === 0) {
    listaTarefas.innerHTML = `
      <div class="list-group-item text-center py-5">
        <i class="bi bi-card-checklist fs-1 text-muted d-block mb-2"></i>
        <h6 class="fw-semibold">Nenhuma tarefa encontrada</h6>
        <p class="text-muted small mb-3">Clique no botão "Criar" acima para adicionar sua primeira tarefa.</p>
        <button class="btn btn-sm btn-primary" onclick="abrirModalCriar()">
          <i class="bi bi-plus-lg me-1"></i> Criar tarefa
        </button>
      </div>
    `;
    return;
  }

  filtradas.forEach((t) => {
    const item = document.createElement('div');
    item.className = 'list-group-item list-group-item-action d-flex justify-content-between align-items-center py-3 px-3 tarefa-item';

    // Área de conteúdo principal da tarefa
    const info = document.createElement('div');
    info.className = 'd-flex flex-column flex-grow-1 me-3 tarefa-info';
    info.title = 'Clique para ver detalhes';
    info.addEventListener('click', () => abrirModalDetalhes(t));

    const linhaTitulo = document.createElement('div');
    linhaTitulo.className = 'd-flex align-items-center gap-2 mb-1 flex-wrap';

    const nome = document.createElement('span');
    nome.className = 'fw-bold fs-6';
    nome.textContent = t.nome;

    linhaTitulo.appendChild(nome);
    linhaTitulo.innerHTML += badgeEstado(t.estado);

    const linhaMetadados = document.createElement('div');
    linhaMetadados.className = 'd-flex align-items-center gap-3 small text-muted flex-wrap';

    const turmaNome = t.turmaNome || (turmas.find(tu => String(tu.id) === String(t.turmaId))?.nome) || 'Sem turma';
    for (const [icone, texto] of [
      ['bi-mortarboard', turmaNome],
      ['bi-clock', formatarPrazo(t.dataPrazo)],
      ['bi-award', t.nota !== undefined && t.nota !== null ? t.nota + ' pts' : 'Sem nota'],
    ]) {
      const metadado = document.createElement('span');
      const simbolo = document.createElement('i');
      simbolo.className = `bi ${icone} me-1`;
      metadado.append(simbolo, document.createTextNode(texto));
      linhaMetadados.appendChild(metadado);
    }

    info.appendChild(linhaTitulo);
    info.appendChild(linhaMetadados);

    // Área de ações (Editar, Excluir e Seta do Wireframe)
    const acoes = document.createElement('div');
    acoes.className = 'tarefa-acoes d-flex align-items-center gap-2';

    const btnEditar = document.createElement('button');
    btnEditar.type = 'button';
    btnEditar.className = 'btn btn-outline-secondary btn-sm';
    btnEditar.title = 'Editar tarefa';
    btnEditar.innerHTML = '<i class="bi bi-pencil"></i>';
    btnEditar.addEventListener('click', (e) => {
      e.stopPropagation();
      abrirModalEditar(t);
    });

    const btnExcluir = document.createElement('button');
    btnExcluir.type = 'button';
    btnExcluir.className = 'btn btn-outline-danger btn-sm';
    btnExcluir.title = 'Excluir tarefa';
    btnExcluir.innerHTML = '<i class="bi bi-trash"></i>';
    btnExcluir.addEventListener('click', (e) => {
      e.stopPropagation();
      excluirTarefa(t);
    });

    // Seta indicada no Wireframe do PDF (->)
    const btnSeta = document.createElement('button');
    btnSeta.type = 'button';
    btnSeta.className = 'btn btn-link text-decoration-none text-muted p-0 ms-1 seta-detalhes';
    btnSeta.title = 'Ver detalhes';
    btnSeta.innerHTML = '<i class="bi bi-arrow-right fs-5"></i>';
    btnSeta.addEventListener('click', (e) => {
      e.stopPropagation();
      abrirModalDetalhes(t);
    });

    acoes.append(btnEditar, btnExcluir, btnSeta);
    item.append(info, acoes);
    listaTarefas.appendChild(item);
  });
}

// Abrir modal para Criar Tarefa
function abrirModalCriar() {
  formTarefa.reset();
  document.getElementById('tarefaId').value = '';
  document.getElementById('tituloModalTarefa').textContent = 'Criar tarefa';
  document.getElementById('tarefaEstado').value = 'pendente';
  
  // Data e hora padrão sugerida (amanhã às 23:59)
  const amanha = new Date();
  amanha.setDate(amanha.getDate() + 1);
  amanha.setHours(23, 59, 0, 0);
  document.getElementById('tarefaPrazo').value = paraInputDatetime(amanha);

  modalTarefa.show();
}

// Abrir modal para Editar Tarefa
function abrirModalEditar(tarefa) {
  document.getElementById('tarefaId').value = tarefa.id;
  document.getElementById('tituloModalTarefa').textContent = 'Editar tarefa';
  document.getElementById('tarefaNome').value = tarefa.nome || '';
  document.getElementById('tarefaPrazo').value = paraInputDatetime(tarefa.dataPrazo);
  document.getElementById('tarefaNota').value = tarefa.nota !== undefined ? tarefa.nota : '';
  document.getElementById('tarefaDescricao').value = tarefa.descricao || '';
  document.getElementById('tarefaEstado').value = tarefa.estado || 'pendente';

  const selectTurma = document.getElementById('tarefaTurma');
  if (tarefa.turmaId) {
    selectTurma.value = tarefa.turmaId;
  } else {
    selectTurma.value = '';
  }

  modalTarefa.show();
}

// Exibir modal de detalhes da tarefa
function abrirModalDetalhes(tarefa) {
  document.getElementById('detalheNome').textContent = tarefa.nome;
  document.getElementById('detalhePrazo').textContent = formatarPrazo(tarefa.dataPrazo);
  document.getElementById('detalheNota').textContent = tarefa.nota !== undefined ? `${tarefa.nota} pontos` : 'Não pontuada';
  
  const turmaNome = tarefa.turmaNome || (turmas.find(tu => String(tu.id) === String(tarefa.turmaId))?.nome) || 'Não associada';
  document.getElementById('detalheTurma').textContent = turmaNome;
  
  document.getElementById('detalheEstado').innerHTML = badgeEstado(tarefa.estado);
  document.getElementById('detalheDescricao').textContent = tarefa.descricao || 'Sem descrição cadastrada.';

  const btnEditarDetalhe = document.getElementById('btnEditarDoDetalhe');
  btnEditarDetalhe.onclick = () => {
    modalDetalhes.hide();
    abrirModalEditar(tarefa);
  };

  modalDetalhes.show();
}

// Submissão do formulário - Salva tarefa no servidor Node (db.json)
formTarefa.addEventListener('submit', async (e) => {
  e.preventDefault();

  const id = document.getElementById('tarefaId').value;
  const selectTurma = document.getElementById('tarefaTurma');
  const turmaOption = selectTurma.options[selectTurma.selectedIndex];
  const turmaNome = turmaOption ? (turmaOption.dataset.nome || turmaOption.text) : '';

  const prazoValor = document.getElementById('tarefaPrazo').value;
  const dataPrazoISO = prazoValor ? new Date(prazoValor).toISOString() : new Date().toISOString();

  const dadosTarefa = {
    nome: document.getElementById('tarefaNome').value.trim(),
    dataPrazo: dataPrazoISO,
    nota: Number(document.getElementById('tarefaNota').value) || 0,
    turmaId: selectTurma.value || '1',
    turmaNome: turmaNome && selectTurma.value ? turmaNome : 'Geral',
    descricao: document.getElementById('tarefaDescricao').value.trim(),
    estado: document.getElementById('tarefaEstado').value || 'pendente',
  };

  try {
    if (id) {
      // Edição: atualiza a tarefa no servidor da plataforma.
      await api(`/tarefas/${id}`, jsonHeaders('PUT', { id, ...dadosTarefa }));
      mostrarMensagem('sucesso', 'Tarefa atualizada com sucesso!');
    } else {
      // O servidor atribui um ID para a nova tarefa.
      await api('/tarefas', jsonHeaders('POST', dadosTarefa));
      mostrarMensagem('sucesso', 'Tarefa criada com sucesso!');
    }

    modalTarefa.hide();
    await carregar();
  } catch (erro) {
    console.error('Erro ao salvar tarefa:', erro);
    mostrarMensagem('erro', 'Não foi possível salvar a tarefa. Tente novamente.');
  }
});

// Exclusão de tarefa no servidor Node (db.json)
async function excluirTarefa(tarefa) {
  const confirmou = confirm(`Tem certeza que deseja excluir a tarefa "${tarefa.nome}"?`);
  if (!confirmou) return;

  try {
    await api(`/tarefas/${tarefa.id}`, { method: 'DELETE' });
    mostrarMensagem('sucesso', `Tarefa "${tarefa.nome}" excluída com sucesso!`);
    await carregar();
  } catch (erro) {
    console.error('Erro ao excluir tarefa:', erro);
    mostrarMensagem('erro', 'Falha ao excluir a tarefa no servidor.');
  }
}

// Configuração dos filtros de estado
document.querySelectorAll('[data-filtro]').forEach((btn) => {
  btn.addEventListener('click', (e) => {
    document.querySelectorAll('[data-filtro]').forEach(b => b.classList.remove('active'));
    e.target.classList.add('active');
    filtroAtual = e.target.getAttribute('data-filtro');
    desenhar();
  });
});

// Busca em tempo real
const inputBusca = document.getElementById('buscaTarefa');
if (inputBusca) {
  inputBusca.addEventListener('input', desenhar);
}

// Evento de inicialização
const usuarioAtualTarefas = usuarioLogado();
if (usuarioAtualTarefas) {
  const nomeUsuario = usuarioAtualTarefas.nome || usuarioAtualTarefas.usuario || 'Usuário';
  document.getElementById('nomeUsuario').textContent = nomeUsuario;
  document.getElementById('avatarUsuario').textContent = nomeUsuario.slice(0, 1).toUpperCase();
}
document.getElementById('sairUsuario').addEventListener('click', (e) => {
  e.preventDefault();
  sair();
});
document.addEventListener('DOMContentLoaded', carregar);

