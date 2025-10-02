const API_URL = "http://localhost:3000"; // Endereço do nosso backend

const formPeca = document.getElementById("form-peca");
const tabelaPecas = document
  .getElementById("tabela-pecas")
  .getElementsByTagName("tbody")[0];
const tabelaVendas = document
  .getElementById("tabela-vendas")
  .getElementsByTagName("tbody")[0];

const marcasModelos = {
  Ford: ["Ranger", "F-150", "Maverick"],
  Chevrolet: ["S10", "Montana", "Silverado"],
  Toyota: ["Hilux"],
  Volkswagen: ["Amarok", "Saveiro"],
  Fiat: ["Toro", "Strada"],
  RAM: ["1500", "2500", "3500", "Rampage"],
  Mitsubishi: ["L200 Triton"],
  Nissan: ["Frontier"],
  Outra: ["Outro"],
};

const selectMarca = document.getElementById("marca");
const selectModelo = document.getElementById("modelo");
const inputVeiculoOutro = document.getElementById("veiculo-outro");
// --- FUNÇÃO PARA BUSCAR E EXIBIR AS PEÇAS ---
function mostrarSpinner() {
  tabelaPecas.innerHTML = `<tr><td colspan="7" class="spinner-container"><div class="spinner"></div></td></tr>`;
}

function atualizarDashboard(pecas) {
  const totalPecas = pecas.length;
  const totalItens = pecas.reduce((acc, peca) => acc + peca.quantidade, 0);
  const valorTotalEstoque = pecas.reduce(
    (acc, peca) => acc + peca.quantidade * (peca.precoVenda || 0),
    0
  );

  document.getElementById("total-pecas").textContent = totalPecas;
  document.getElementById("total-itens").textContent = totalItens;
  document.getElementById("valor-total-estoque").textContent =
    valorTotalEstoque.toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    });
}

function popularFiltroLocalizacao(pecas) {
  const filtroLocalizacao = document.getElementById("filtro-localizacao");
  const localizacoesUnicas = [
    ...new Set(pecas.map((p) => p.localizacao).filter(Boolean)),
  ];
  localizacoesUnicas.sort();

  // Guarda o valor selecionado para não perdê-lo
  const valorSelecionado = filtroLocalizacao.value;
  filtroLocalizacao.innerHTML =
    '<option value="">-- Todas as Localizações --</option>';
  localizacoesUnicas.forEach((loc) => {
    const option = new Option(loc, loc);
    filtroLocalizacao.add(option);
  });
  filtroLocalizacao.value = valorSelecionado;
}

async function buscarVendas() {
  try {
    const response = await fetch(`${API_URL}/vendas`);
    const vendas = await response.json();

    tabelaVendas.innerHTML = "";
    let lucroTotal = 0;
    vendas.forEach((venda) => {
      lucroTotal += venda.lucro;
      const row = tabelaVendas.insertRow();
      row.innerHTML = `
        <td>${new Date(venda.createdAt).toLocaleDateString("pt-BR")}</td>
        <td>${venda.pecaNome}</td>
        <td>${venda.quantidadeVendida}</td>
        <td>${venda.valorTotal.toLocaleString("pt-BR", {
          style: "currency",
          currency: "BRL",
        })}</td>
        <td>${venda.lucro.toLocaleString("pt-BR", {
          style: "currency",
          currency: "BRL",
        })}</td>
      `;
    });
    document.getElementById("lucro-total").textContent =
      lucroTotal.toLocaleString("pt-BR", {
        style: "currency",
        currency: "BRL",
      });
  } catch (error) {
    console.error("Erro ao buscar vendas:", error);
  }
}

async function buscarPecas() {
  const filtroNome = document.getElementById("filtro-nome").value;
  const filtroMarca = document.getElementById("filtro-marca").value;
  const filtroModelo = document.getElementById("filtro-modelo").value;
  const filtroAno = document.getElementById("filtro-ano").value;
  const filtroLocalizacao = document.getElementById("filtro-localizacao").value;
  const filtroQuantidadeMin = document.getElementById(
    "filtro-quantidade-min"
  ).value;
  const filtroQuantidadeMax = document.getElementById(
    "filtro-quantidade-max"
  ).value;
  const filtroPrecoVendaMin = document.getElementById(
    "filtro-preco-venda-min"
  ).value;
  const filtroPrecoVendaMax = document.getElementById(
    "filtro-preco-venda-max"
  ).value;

  const queryParams = new URLSearchParams();
  if (filtroNome) queryParams.append("nome", filtroNome);

  let filtroVeiculo = filtroMarca;
  if (filtroMarca && filtroModelo) {
    filtroVeiculo = `${filtroMarca} ${filtroModelo}`;
  }
  if (filtroVeiculo) queryParams.append("veiculo", filtroVeiculo);

  if (filtroAno) queryParams.append("ano", filtroAno);
  if (filtroLocalizacao) queryParams.append("localizacao", filtroLocalizacao);
  if (filtroQuantidadeMin)
    queryParams.append("quantidadeMin", filtroQuantidadeMin);
  if (filtroQuantidadeMax)
    queryParams.append("quantidadeMax", filtroQuantidadeMax);
  if (filtroPrecoVendaMin)
    queryParams.append("precoVendaMin", filtroPrecoVendaMin);
  if (filtroPrecoVendaMax)
    queryParams.append("precoVendaMax", filtroPrecoVendaMax);

  let url = `${API_URL}/pecas`;
  if (queryParams.toString()) {
    url += `?${queryParams.toString()}`;
  }

  try {
    mostrarSpinner();
    const response = await fetch(url);
    if (!response.ok) {
      // Tenta ler a mensagem de erro do corpo da resposta, se houver
      const errorData = await response
        .json()
        .catch(() => ({ message: response.statusText }));
      throw new Error(
        `Erro HTTP: ${response.status} - ${
          errorData.message || JSON.stringify(errorData)
        }`
      );
    }
    const pecas = await response.json();

    // Limpa a tabela antes de adicionar os novos dados
    tabelaPecas.innerHTML = "";
    if (pecas.length === 0) {
      const row = tabelaPecas.insertRow();
      row.innerHTML = `<td colspan="7" style="text-align: center; padding: 20px;">Nenhuma peça encontrada com os filtros aplicados.</td>`;
      return; // Sai da função se não houver peças para exibir
    }

    atualizarDashboard(pecas);
    // Popula o filtro de localização apenas se nenhum filtro estiver ativo
    // para ter a lista completa.
    if (!queryParams.toString()) {
      popularFiltroLocalizacao(pecas);
    }

    pecas.forEach((peca) => {
      const row = tabelaPecas.insertRow();
      row.innerHTML = `
            <td>${peca.nome}</td>
            <td>${peca.veiculo}</td>
            <td>${peca.ano || ""}</td>
            <td>${peca.quantidade}</td>
            <td>${peca.localizacao || ""}</td>
            <td>${(peca.precoVenda || 0).toLocaleString("pt-BR", {
              style: "currency",
              currency: "BRL",
            })}</td>
            <td>
                <button class="btn-acao btn-sucesso">Vender</button>
                <button class="btn-acao btn-editar">Editar</button>
                <button class="btn-acao btn-deletar">Excluir</button>
            </td>
        `;

      // Adiciona os event listeners de forma segura
      row
        .querySelector(".btn-sucesso")
        .addEventListener("click", () => abrirModalVenda(peca));
      row
        .querySelector(".btn-editar")
        .addEventListener("click", () => abrirModalEdicao(peca));
      row
        .querySelector(".btn-deletar")
        .addEventListener("click", () => abrirModalDelete(peca.id));
    });
  } catch (error) {
    console.error("Erro ao buscar peças:", error);
    alert("Erro ao buscar peças. Verifique o console para mais detalhes.");
  }
}

// --- FUNÇÃO PARA LIMPAR FILTROS ---
function limparFiltros() {
  const filtros = document.getElementById("filtros");
  const inputs = filtros.querySelectorAll("input, select");
  inputs.forEach((input) => (input.value = ""));
  // Dispara o evento de change para resetar o filtro de modelo
  document.getElementById("filtro-marca").dispatchEvent(new Event("change"));

  // Após limpar, busca todas as peças novamente
  buscarPecas();
}

// --- FUNÇÃO PARA CADASTRAR UMA NOVA PEÇA ---
formPeca.addEventListener("submit", async (event) => {
  event.preventDefault(); // Evita que a página recarregue

  // Validação no lado do cliente
  const nome = document.getElementById("nome").value;
  const marca = selectMarca.value;
  const modelo = selectModelo.value;
  const ano = document.getElementById("ano").value;
  const quantidade = document.getElementById("quantidade").value;
  const precoCompra = document.getElementById("precoCompra").value;
  const precoVenda = document.getElementById("precoVenda").value;
  const estoqueMinimo = document.getElementById("estoqueMinimo").value;

  let veiculo;
  if (marca === "Outra") {
    veiculo = inputVeiculoOutro.value;
  } else {
    veiculo = `${marca} ${modelo}`;
  }

  if (!nome.trim()) {
    return alert("O nome da peça é obrigatório.");
  }
  if (ano && !/^\d{4}(-\d{4})?$/.test(ano)) {
    return alert("O ano deve estar no formato YYYY ou YYYY-YYYY.");
  }
  if (quantidade === "" || parseInt(quantidade) < 0) {
    return alert("A quantidade deve ser um número maior ou igual a zero.");
  }
  if (precoCompra === "" || parseFloat(precoCompra) < 0) {
    return alert("O preço de compra é obrigatório e não pode ser negativo.");
  }
  if (precoVenda && parseFloat(precoVenda) < 0) {
    return alert("O preço de venda não pode ser negativo.");
  }

  const novaPeca = {
    nome: nome,
    veiculo: veiculo,
    ano: ano,
    quantidade: parseInt(quantidade),
    precoCompra: parseFloat(precoCompra),
    localizacao: document.getElementById("localizacao").value,
    estoqueMinimo: estoqueMinimo ? parseInt(estoqueMinimo) : 0,
    precoVenda: precoVenda ? parseFloat(precoVenda) : null,
    descricao: document.getElementById("descricao").value,
  };

  try {
    const response = await fetch(`${API_URL}/pecas`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(novaPeca),
    });

    if (response.ok) {
      alert("Peça cadastrada com sucesso!");
      formPeca.reset(); // Limpa o formulário
      selectMarca.dispatchEvent(new Event("change")); // Reseta os selects de veículo
      buscarPecas(); // Atualiza a tabela
      buscarAlertasErelatorios(); // Atualiza os novos cards
    } else {
      const errorData = await response.json();
      const errorMessage = Array.isArray(errorData.error)
        ? errorData.error.join("\n")
        : errorData.error;
      alert(`Erro ao cadastrar peça:\n${errorMessage || response.statusText}`);
    }
  } catch (error) {
    console.error("Erro ao cadastrar peça:", error);
    alert("Erro ao cadastrar peça. Verifique o console para mais detalhes.");
  }
});

// --- MODAL ---
const modal = document.getElementById("modal-generico");
const modalTitulo = document.getElementById("modal-titulo");
const modalCorpo = document.getElementById("modal-corpo");
const modalRodape = document.getElementById("modal-rodape");

function fecharModal() {
  modal.classList.remove("visible");
}

function abrirModalDelete(id) {
  modalTitulo.textContent = "Confirmar Exclusão";
  modalCorpo.innerHTML = `<p>Você tem certeza que deseja excluir esta peça? Esta ação não pode ser desfeita.</p>`;
  modalRodape.innerHTML = `
    <button class="btn-secundaria" onclick="fecharModal()">Cancelar</button>
    <button class="btn-deletar" onclick="deletarPeca(${id})">Excluir</button>
  `;
  modal.classList.add("visible");
}

async function deletarPeca(id) {
  try {
    const response = await fetch(`${API_URL}/pecas/${id}`, {
      method: "DELETE",
    });
    if (response.ok) {
      alert("Peça deletada com sucesso!");
      fecharModal();
      buscarPecas(); // Atualiza a tabela
    } else {
      throw new Error("Falha ao deletar a peça.");
    }
  } catch (error) {
    console.error("Erro ao deletar peça:", error);
    alert("Erro ao deletar peça.");
  }
}

function abrirModalEdicao(peca) {
  modalTitulo.textContent = "Editar Peça";
  modalCorpo.innerHTML = `
    <form id="form-edit-peca">
      <input type="hidden" id="edit-id" value="${peca.id}">
      <input type="text" id="edit-nome" placeholder="Nome da Peça" value="${
        peca.nome
      }" required>
      <div id="edit-veiculo-container"></div>
      <input type="text" id="edit-ano" placeholder="Ano" value="${
        peca.ano || ""
      }">
      <input type="number" step="0.01" id="edit-precoCompra" placeholder="Preço de Compra" value="${
        peca.precoCompra
      }" min="0" required>
      <input type="number" id="edit-quantidade" placeholder="Quantidade" value="${
        peca.quantidade
      }" min="0" required>
      <input type="number" id="edit-estoqueMinimo" placeholder="Estoque Mínimo" value="${
        peca.estoqueMinimo || 0
      }" min="0">
      <input type="text" id="edit-localizacao" placeholder="Localização" value="${
        peca.localizacao || ""
      }">
      <input type="number" step="0.01" id="edit-precoVenda" placeholder="Preço de Venda" value="${
        peca.precoVenda || ""
      }" min="0">
      <textarea id="edit-descricao" placeholder="Descrição">${
        peca.descricao || ""
      }</textarea>
    </form>
  `;
  modalRodape.innerHTML = `
    <button class="btn-secundaria" onclick="fecharModal()">Cancelar</button>
    <button class="btn-azul" onclick="salvarEdicao()">Salvar Alterações</button>
  `;

  // --- Lógica para popular e selecionar o veículo no modal de edição ---
  const veiculoContainer = document.getElementById("edit-veiculo-container");
  const editSelectMarca = document.createElement("select");
  editSelectMarca.id = "edit-marca";
  const editSelectModelo = document.createElement("select");
  editSelectModelo.id = "edit-modelo";
  const editInputVeiculoOutro = document.createElement("input");
  editInputVeiculoOutro.type = "text";
  editInputVeiculoOutro.id = "edit-veiculo-outro";
  editInputVeiculoOutro.placeholder = "Ou digite outro veículo";
  editInputVeiculoOutro.style.display = "none";

  // Popula marcas
  Object.keys(marcasModelos).forEach((marca) => {
    const option = document.createElement("option");
    option.value = marca;
    option.textContent = marca;
    editSelectMarca.appendChild(option);
  });

  // Adiciona listener para atualizar modelos
  editSelectMarca.addEventListener("change", () => {
    const marcaSelecionada = editSelectMarca.value;
    editSelectModelo.innerHTML =
      '<option value="">-- Selecione o Modelo --</option>';
    if (marcaSelecionada === "Outra") {
      editInputVeiculoOutro.style.display = "block";
      editSelectModelo.style.display = "none";
    } else {
      editInputVeiculoOutro.style.display = "none";
      editSelectModelo.style.display = "block";
      marcasModelos[marcaSelecionada].forEach((modelo) => {
        const option = document.createElement("option");
        option.value = modelo;
        option.textContent = modelo;
        editSelectModelo.appendChild(option);
      });
    }
  });

  veiculoContainer.innerHTML = ""; // Limpa o container
  veiculoContainer.appendChild(editSelectMarca);
  veiculoContainer.appendChild(editSelectModelo);
  veiculoContainer.appendChild(editInputVeiculoOutro);

  // Tenta pré-selecionar a marca e modelo
  const [marcaPeca, ...modeloPecaArray] = peca.veiculo.split(" ");
  const modeloPeca = modeloPecaArray.join(" ");
  if (marcasModelos[marcaPeca]) {
    editSelectMarca.value = marcaPeca;
    editSelectMarca.dispatchEvent(new Event("change")); // Dispara o evento para popular os modelos
    editSelectModelo.value = modeloPeca;
  } else {
    editSelectMarca.value = "Outra";
    editSelectMarca.dispatchEvent(new Event("change"));
    editInputVeiculoOutro.value = peca.veiculo;
  }

  modal.classList.add("visible");
}

async function salvarEdicao() {
  const id = document.getElementById("edit-id").value;
  const editMarcaSelect = document.getElementById("edit-marca");
  const editModeloSelect = document.getElementById("edit-modelo");
  const editVeiculoOutroInput = document.getElementById("edit-veiculo-outro");

  let veiculo;
  if (editMarcaSelect && editMarcaSelect.value === "Outra") {
    veiculo = editVeiculoOutroInput.value;
  } else if (editMarcaSelect) {
    veiculo = `${editMarcaSelect.value} ${editModeloSelect.value}`;
  }

  const pecaAtualizada = {
    nome: document.getElementById("edit-nome").value,
    veiculo: veiculo,
    ano: document.getElementById("edit-ano").value,
    precoCompra: parseFloat(document.getElementById("edit-precoCompra").value),
    quantidade: parseInt(document.getElementById("edit-quantidade").value),
    estoqueMinimo: parseInt(
      document.getElementById("edit-estoqueMinimo").value
    ),
    localizacao: document.getElementById("edit-localizacao").value,
    precoVenda: parseFloat(document.getElementById("edit-precoVenda").value),
    descricao: document.getElementById("edit-descricao").value,
  };

  // Validação simples
  if (!pecaAtualizada.nome.trim() || !pecaAtualizada.veiculo.trim()) {
    return alert("Nome e Veículo são obrigatórios.");
  }
  if (isNaN(pecaAtualizada.precoCompra) || pecaAtualizada.precoCompra < 0) {
    return alert("O preço de compra é obrigatório e não pode ser negativo.");
  }
  if (pecaAtualizada.quantidade < 0) {
    return alert("A quantidade não pode ser negativa.");
  }

  try {
    const response = await fetch(`${API_URL}/pecas/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(pecaAtualizada),
    });

    if (response.ok) {
      alert("Peça atualizada com sucesso!");
      fecharModal();
      buscarPecas();
      buscarAlertasErelatorios();
    } else {
      const errorData = await response.json();
      const errorMessage = Array.isArray(errorData.error)
        ? errorData.error.join("\n")
        : errorData.error;
      alert(`Erro ao atualizar peça:\n${errorMessage || response.statusText}`);
    }
  } catch (error) {
    console.error("Erro ao salvar edições:", error);
    alert("Erro ao salvar edições.");
  }
}

function abrirModalVenda(peca) {
  modalTitulo.textContent = "Registrar Venda";
  modalCorpo.innerHTML = `
    <p><strong>Peça:</strong> ${peca.nome}</p>
    <p><strong>Estoque Atual:</strong> ${peca.quantidade}</p>
    <form id="form-venda-peca">
      <input type="hidden" id="venda-peca-id" value="${peca.id}">

      <label for="venda-cliente">Cliente (para venda fiado):</label>
      <select id="venda-cliente">
        <option value="">Venda à Vista</option>
        <!-- Clientes serão populados aqui -->
      </select>
      <label for="venda-quantidade">Quantidade a Vender:</label>
      <input type="number" id="venda-quantidade" value="1" min="1" max="${
        peca.quantidade
      }" required>
      <label for="venda-preco">Preço de Venda Unitário (R$):</label>
      <input type="number" step="0.01" id="venda-preco" value="${
        peca.precoVenda || 0
      }" min="0" required>
    </form>
  `;
  modalRodape.innerHTML = `
    <button class="btn-secundaria" onclick="fecharModal()">Cancelar</button>
    <button class="btn-sucesso" onclick="registrarVenda()">Confirmar Venda</button>
  `;
  modal.classList.add("visible");

  // Popula o dropdown de clientes no modal de venda
  const selectCliente = document.getElementById("venda-cliente");
  const clientesFiado = document.getElementById("select-cliente-fiado");
  // Clona as opções do seletor principal para não buscar na API de novo
  Array.from(clientesFiado.options).forEach((option) => {
    if (option.value) {
      // Não clona o "--Selecione--"
      selectCliente.appendChild(option.cloneNode(true));
    }
  });
}

async function registrarVenda() {
  const pecaId = document.getElementById("venda-peca-id").value;
  const quantidadeVendida = parseInt(
    document.getElementById("venda-quantidade").value
  );
  const precoVendaUnitario = parseFloat(
    document.getElementById("venda-preco").value
  );
  const clienteId = document.getElementById("venda-cliente").value;

  if (isNaN(quantidadeVendida) || quantidadeVendida <= 0) {
    return alert("A quantidade a vender deve ser um número positivo.");
  }
  if (isNaN(precoVendaUnitario) || precoVendaUnitario < 0) {
    return alert("O preço de venda deve ser um número positivo.");
  }

  try {
    const response = await fetch(`${API_URL}/vendas`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        pecaId,
        quantidadeVendida,
        precoVendaUnitario,
        clienteId,
      }),
    });

    if (response.ok) {
      alert("Venda registrada com sucesso!");
      fecharModal();
      buscarPecas();
      buscarVendas();
      buscarAlertasErelatorios();
    } else {
      const errorData = await response.json();
      alert(
        `Erro ao registrar venda: ${errorData.error || response.statusText}`
      );
    }
  } catch (error) {
    console.error("Erro ao registrar venda:", error);
    alert("Erro ao registrar venda.");
  }
}

// Fechar modal ao clicar fora dele ou pressionar Esc
window.addEventListener("click", (event) => {
  if (event.target === modal) {
    fecharModal();
  }
});
window.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && modal.classList.contains("visible")) {
    fecharModal();
  }
});

// --- FUNÇÕES PARA NOVOS RELATÓRIOS E ALERTAS ---
async function buscarAlertasErelatorios() {
  // Alertas de Estoque Baixo
  try {
    const response = await fetch(`${API_URL}/pecas/alertas-estoque`);
    const pecas = await response.json();
    const listaAlertas = document.getElementById("lista-alertas-estoque");
    listaAlertas.innerHTML = "";
    if (pecas.length === 0) {
      listaAlertas.innerHTML = "<li>Nenhum alerta no momento.</li>";
    } else {
      pecas.forEach((peca) => {
        const item = document.createElement("li");
        item.innerHTML = `${peca.nome} <strong>(Restam: ${peca.quantidade})</strong>`;
        listaAlertas.appendChild(item);
      });
    }
  } catch (error) {
    console.error("Erro ao buscar alertas de estoque:", error);
  }

  // Relatório de Mais Vendidas
  try {
    const response = await fetch(`${API_URL}/relatorios/mais-vendidas`);
    const relatorio = await response.json();
    const tabela = document
      .getElementById("tabela-mais-vendidas")
      .getElementsByTagName("tbody")[0];
    tabela.innerHTML = "";
    relatorio.forEach((item) => {
      const row = tabela.insertRow();
      row.innerHTML = `
        <td>${item.pecaNome}</td>
        <td>${item.totalVendido}</td>
      `;
    });
  } catch (error) {
    console.error("Erro ao buscar relatório de mais vendidas:", error);
  }

  // Relatório de Mais Lucrativas
  try {
    const response = await fetch(`${API_URL}/relatorios/mais-lucrativas`);
    const relatorio = await response.json();
    const tabela = document
      .getElementById("tabela-mais-lucrativas")
      .getElementsByTagName("tbody")[0];
    tabela.innerHTML = "";
    relatorio.forEach((item) => {
      const row = tabela.insertRow();
      row.innerHTML = `
        <td>${item.pecaNome}</td>
        <td>${item.lucroTotal.toLocaleString("pt-BR", {
          style: "currency",
          currency: "BRL",
        })}</td>
      `;
    });
  } catch (error) {
    console.error("Erro ao buscar relatório de mais lucrativas:", error);
  }
}

// --- FUNÇÕES PARA CLIENTES E FIADO ---

async function buscarClientes() {
  try {
    const response = await fetch(`${API_URL}/clientes`);
    const clientes = await response.json();
    const select = document.getElementById("select-cliente-fiado");
    select.innerHTML = '<option value="">-- Selecione um Cliente --</option>'; // Limpa
    clientes.forEach((cliente) => {
      const option = document.createElement("option");
      option.value = cliente.id;
      option.textContent = cliente.nome;
      select.appendChild(option);
    });
  } catch (error) {
    console.error("Erro ao buscar clientes:", error);
  }
}

async function cadastrarCliente(event) {
  event.preventDefault();
  const nome = document.getElementById("cliente-nome").value;
  const telefone = document.getElementById("cliente-telefone").value;

  if (!nome.trim()) return alert("O nome do cliente é obrigatório.");

  try {
    const response = await fetch(`${API_URL}/clientes`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nome, telefone }),
    });
    if (response.ok) {
      alert("Cliente cadastrado com sucesso!");
      document.getElementById("form-cliente").reset();
      buscarClientes(); // Atualiza a lista de clientes
    } else {
      const errorData = await response.json();
      alert(`Erro: ${errorData.error}`);
    }
  } catch (error) {
    console.error("Erro ao cadastrar cliente:", error);
  }
}

async function buscarVendasFiado(clienteId) {
  const tabelaFiado = document
    .getElementById("tabela-fiado")
    .getElementsByTagName("tbody")[0];
  const totalFiadoEl = document.getElementById("total-fiado");
  const nomeClienteEl = document.getElementById("nome-cliente-selecionado");
  const btnQuitar = document.getElementById("btn-quitar-selecionados");

  tabelaFiado.innerHTML = '<tr><td colspan="5">Carregando...</td></tr>';
  totalFiadoEl.textContent = "R$ 0,00";
  btnQuitar.disabled = true;

  if (!clienteId) {
    nomeClienteEl.textContent =
      "Selecione um cliente para ver as vendas em aberto";
    tabelaFiado.innerHTML = "";
    return;
  }

  const select = document.getElementById("select-cliente-fiado");
  nomeClienteEl.textContent = `Vendas em aberto para: ${
    select.options[select.selectedIndex].text
  }`;

  try {
    const response = await fetch(`${API_URL}/clientes/${clienteId}/fiado`);
    const vendas = await response.json();
    tabelaFiado.innerHTML = "";
    let totalFiado = 0;

    if (vendas.length === 0) {
      tabelaFiado.innerHTML =
        '<tr><td colspan="5" style="text-align:center;">Nenhuma venda em aberto para este cliente.</td></tr>';
      return;
    }

    vendas.forEach((venda) => {
      totalFiado += venda.valorTotal;
      const row = tabelaFiado.insertRow();
      row.innerHTML = `
        <td>${new Date(venda.createdAt).toLocaleDateString("pt-BR")}</td>
        <td>${venda.pecaNome}</td>
        <td>${venda.quantidadeVendida}</td>
        <td>${venda.valorTotal.toLocaleString("pt-BR", {
          style: "currency",
          currency: "BRL",
        })}</td>
        <td><input type="checkbox" class="checkbox-fiado" value="${
          venda.id
        }"></td>
      `;
    });

    totalFiadoEl.textContent = totalFiado.toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    });
    btnQuitar.disabled = false;
  } catch (error) {
    console.error("Erro ao buscar vendas fiado:", error);
    tabelaFiado.innerHTML =
      '<tr><td colspan="5" style="text-align:center;">Erro ao carregar vendas.</td></tr>';
  }
}

async function quitarVendasSelecionadas() {
  const checkboxes = document.querySelectorAll(".checkbox-fiado:checked");
  const vendaIds = Array.from(checkboxes).map((cb) => cb.value);

  if (vendaIds.length === 0)
    return alert("Selecione pelo menos uma venda para quitar.");

  try {
    const response = await fetch(`${API_URL}/vendas/quitar`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ vendaIds }),
    });
    if (response.ok) {
      alert("Venda(s) quitada(s) com sucesso!");
      buscarVendasFiado(document.getElementById("select-cliente-fiado").value); // Recarrega a notinha
      buscarVendas(); // Atualiza o histórico geral de vendas
    } else {
      const errorData = await response.json();
      alert(`Erro ao quitar vendas: ${errorData.error}`);
    }
  } catch (error) {
    console.error("Erro ao quitar vendas:", error);
  }
}

// --- CARREGA AS PEÇAS QUANDO A PÁGINA É ABERTA ---
document.addEventListener("DOMContentLoaded", () => {
  // Popula o seletor de marcas do formulário de cadastro
  Object.keys(marcasModelos).forEach((marca) => {
    const option = document.createElement("option");
    option.value = marca;
    option.textContent = marca;
    selectMarca.appendChild(option);
  });

  // Adiciona o listener para atualizar os modelos quando a marca muda
  selectMarca.addEventListener("change", () => {
    const marcaSelecionada = selectMarca.value;
    selectModelo.innerHTML =
      '<option value="">-- Selecione o Modelo --</option>'; // Limpa e reseta

    if (marcaSelecionada) {
      if (marcaSelecionada === "Outra") {
        inputVeiculoOutro.style.display = "block";
        inputVeiculoOutro.value = "";
        selectModelo.style.display = "none";
      } else {
        inputVeiculoOutro.style.display = "none";
        selectModelo.style.display = "block";
        const modelos = marcasModelos[marcaSelecionada];
        modelos.forEach((modelo) => {
          const option = document.createElement("option");
          option.value = modelo;
          option.textContent = modelo;
          selectModelo.appendChild(option);
        });
      }
    } else {
      inputVeiculoOutro.style.display = "none";
      selectModelo.style.display = "block";
    }
  });

  // --- LÓGICA PARA FILTROS DE VEÍCULO ---
  const filtroMarcaSelect = document.getElementById("filtro-marca");
  const filtroModeloSelect = document.getElementById("filtro-modelo");

  // Popula o seletor de marcas do filtro
  Object.keys(marcasModelos).forEach((marca) => {
    if (marca !== "Outra") {
      const option = new Option(marca, marca);
      filtroMarcaSelect.add(option);
    }
  });

  // Adiciona listener para atualizar os modelos do filtro
  filtroMarcaSelect.addEventListener("change", () => {
    const marcaSelecionada = filtroMarcaSelect.value;
    filtroModeloSelect.innerHTML =
      '<option value="">-- Todos os Modelos --</option>';
    if (marcaSelecionada && marcasModelos[marcaSelecionada]) {
      marcasModelos[marcaSelecionada].forEach((modelo) => {
        const option = new Option(modelo, modelo);
        filtroModeloSelect.add(option);
      });
    }
  });

  buscarPecas();
  buscarVendas();
  buscarClientes();
  buscarAlertasErelatorios();

  // Listeners para a nova seção de fiado
  document
    .getElementById("form-cliente")
    .addEventListener("submit", cadastrarCliente);
  document
    .getElementById("select-cliente-fiado")
    .addEventListener("change", (e) => buscarVendasFiado(e.target.value));
  document
    .getElementById("btn-quitar-selecionados")
    .addEventListener("click", quitarVendasSelecionadas);

  // Lógica para o checkbox "selecionar tudo"
  document
    .getElementById("selecionar-tudo-fiado")
    .addEventListener("change", function () {
      const checkboxes = document.querySelectorAll(".checkbox-fiado");
      checkboxes.forEach((cb) => {
        cb.checked = this.checked;
      });
    });
});
