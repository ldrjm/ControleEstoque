
const SUPABASE_URL = 'https://atuqsrlzxaekzfmdyfpo.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF0dXFzcmx6eGFla3pmbWR5ZnBvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg2MTM1ODksImV4cCI6MjA5NDE4OTU4OX0.3LLd4kuE5UA6zCWYB05tzucQMjsxwJE3hNKYyB27aIs';

let idEdicao = null; // controla modo edição/criação


/* =========================
   ELEMENTOS DA INTERFACE
========================= */

// Inputs do formulário
const nomeProduto = document.querySelector('#nomeProduto');
const quantidade = document.querySelector('#quantidade');
const precoUnitario = document.querySelector('#precoUnitario');
const categoria = document.querySelector('#categoria');

// Lista onde os produtos aparecem
const listaProdutos = document.querySelector('#listaProdutos');

// Botões principais
const btnSalvar = document.querySelector('#btnSalvar');
const btnLimpar = document.querySelector('#btnLimpar');


/* =========================
   CARREGAR PRODUTOS
========================= */

async function carregarProdutos() {

    try {

        const response = await fetch(
            `${SUPABASE_URL}/rest/v1/produtos?select=*&order=id.desc`,
            {
                method: 'GET',
                headers: {
                    apikey: SUPABASE_KEY,
                    Authorization: `Bearer ${SUPABASE_KEY}`
                }
            }
        );

        const dados = await response.json();

        // limpa lista antes de renderizar
        listaProdutos.innerHTML = '';

        // estado vazio
        if (dados.length === 0) {
            listaProdutos.innerHTML = `<div class="produto-card">Nenhum registro ainda</div>`;
            return;
        }

        // renderização dos produtos
        dados.forEach(produto => {

            const div = document.createElement('div');
            div.className = 'produto-card';

            // regra: alerta de estoque baixo
            const estoqueBaixo = produto.quantidade <= 5;

            if (estoqueBaixo) {
                div.style.border = "2px solid red";
                div.style.background = "#fff3f3";
            }

            // monta card
            div.innerHTML = `
                <strong>${produto.nome}</strong><br>

                Quantidade: ${produto.quantidade}
                ${estoqueBaixo ? '<span style="color:red;font-weight:bold;"> ⚠ Estoque baixo!</span>' : ''}<br>

                Categoria: ${produto.categoria}<br>

                Preço Unitário: R$ ${Number(produto.preco_unitario).toFixed(2)}<br>

                Preço Total: R$ ${Number(produto.valor_total).toFixed(2)}

                <div style="margin-top:8px;">
                    <button onclick="
                        prepararEdicao(
                            ${produto.id},
                            '${produto.nome}',
                            ${produto.quantidade},
                            ${produto.preco_unitario},
                            '${produto.categoria}'
                        )
                    ">Editar</button>

                    <button onclick="excluirProduto(${produto.id})">Excluir</button>
                </div>
            `;

            listaProdutos.appendChild(div);
        });

    } catch (error) {
        console.error("Erro ao carregar produtos:", error);
    }
}


/* =========================
   SALVAR / ATUALIZAR
========================= */

btnSalvar.addEventListener('click', async () => {

    // captura valores do formulário
    const nome = nomeProduto.value;
    const qtd = parseInt(quantidade.value) || 0;
    const precoUni = parseFloat(precoUnitario.value) || 0;
    const categoriaProduto = categoria.value;

    // cálculo do total
    const valorTotal = qtd * precoUni;

    try {

        // verifica se já existe produto igual
        const check = await fetch(
            `${SUPABASE_URL}/rest/v1/produtos?nome=eq.${nome}&preco_unitario=eq.${precoUni}`,
            {
                headers: {
                    apikey: SUPABASE_KEY,
                    Authorization: `Bearer ${SUPABASE_KEY}`
                }
            }
        );

        const existentes = await check.json();

        // se existe, soma estoque
        if (existentes.length > 0) {

            const produto = existentes[0];

            const novaQtd = produto.quantidade + qtd;
            const novoTotal = novaQtd * precoUni;

            await fetch(
                `${SUPABASE_URL}/rest/v1/produtos?id=eq.${produto.id}`,
                {
                    method: 'PATCH',
                    headers: {
                        apikey: SUPABASE_KEY,
                        Authorization: `Bearer ${SUPABASE_KEY}`,
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({
                        quantidade: novaQtd,
                        valor_total: novoTotal
                    })
                }
            );

        } else {

            // cria novo produto
            await fetch(`${SUPABASE_URL}/rest/v1/produtos`, {
                method: 'POST',
                headers: {
                    apikey: SUPABASE_KEY,
                    Authorization: `Bearer ${SUPABASE_KEY}`,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    nome,
                    quantidade: qtd,
                    preco_unitario: precoUni,
                    valor_total: valorTotal,
                    categoria: categoriaProduto
                })
            });
        }

        // reset do sistema
        apagarCampos();
        carregarProdutos();

    } catch (error) {
        console.error("Erro ao salvar:", error);
    }
});


/* =========================
   EDIÇÃO
========================= */

// preenche formulário para edição manual
window.prepararEdicao = function (id, nome, qtd, precoUni, categoriaProduto) {

    idEdicao = id;

    nomeProduto.value = nome;
    quantidade.value = qtd;
    precoUnitario.value = precoUni;
    categoria.value = categoriaProduto;

    btnSalvar.textContent = 'Atualizar Produto';
};


/* =========================
   EXCLUSÃO
========================= */

window.excluirProduto = async function (id) {

    if (!confirm('Deseja excluir este produto?')) return;

    await fetch(`${SUPABASE_URL}/rest/v1/produtos?id=eq.${id}`, {
        method: 'DELETE',
        headers: {
            apikey: SUPABASE_KEY,
            Authorization: `Bearer ${SUPABASE_KEY}`
        }
    });

    carregarProdutos();
};


/* =========================
   LIMPAR FORMULÁRIO
========================= */

function apagarCampos() {

    nomeProduto.value = '';
    quantidade.value = '';
    precoUnitario.value = '';
    categoria.selectedIndex = 0;

    idEdicao = null;
    btnSalvar.textContent = 'Calcular e Salvar';
}

btnLimpar.addEventListener('click', apagarCampos);


/* =========================
   INICIALIZAÇÃO
========================= */

carregarProdutos();