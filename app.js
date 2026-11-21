const STORAGE = "knowledge_hub";
let dados = JSON.parse(localStorage.getItem(STORAGE)) || {
    projetos: [],
    atual: null
};

const $ = id => document.getElementById(id);

function salvar() {
    localStorage.setItem(STORAGE, JSON.stringify(dados));
}

function projetoAtual() {
    return dados.projetos.find(p => p.id === dados.atual);
}

function criarProjeto() {
    const nome = prompt("Nome do projeto:");

    if (!nome || !nome.trim()) return;

    const projeto = {
        id: crypto.randomUUID(),
        nome: nome.trim(),
        memoria: "",
        textos: []
    };

    dados.projetos.push(projeto);
    dados.atual = projeto.id;

    salvar();
    atualizar();
}

function selecionarProjeto(id) {
    dados.atual = id;
    salvar();
    atualizar();
}

function excluirProjeto(id) {
    if (!confirm("Excluir este projeto?")) return;

    dados.projetos = dados.projetos.filter(p => p.id !== id);

    if (dados.atual === id) {
        dados.atual = dados.projetos[0]?.id || null;
    }

    salvar();
    atualizar();
}

function atualizar() {
    const lista = $("projectList");
    lista.innerHTML = "";

    dados.projetos.forEach(p => {
        const item = document.createElement("div");
        item.className = "project-item";

        const abrir = document.createElement("button");
        abrir.textContent = "📁 " + p.nome;
        abrir.className = "project-item";
        abrir.onclick = () => selecionarProjeto(p.id);

        const apagar = document.createElement("button");
        apagar.textContent = "×";
        apagar.onclick = () => excluirProjeto(p.id);

        item.append(abrir, apagar);
        lista.appendChild(item);
    });

    const projeto = projetoAtual();

    $("welcome").hidden = !!projeto;
    $("workspace").hidden = !projeto;

    if (projeto) {
        $("projectTitle").textContent = projeto.nome;
        $("projectMemory").value = projeto.memoria;
        mostrarTextos();
    } else {
        $("savedTexts").innerHTML = "";
        $("projectMemory").value = "";
    }
}

function salvarMemoria() {
    const p = projetoAtual();
    if (!p) return;

    p.memoria = $("projectMemory").value;
    salvar();

    alert("Memória salva!");
}

function salvarTexto() {
    const p = projetoAtual();
    const texto = $("textEditor").value;

    if (!p || !texto.trim()) return;

    p.textos.push({
        id: crypto.randomUUID(),
        conteudo: texto
    });

    $("textEditor").value = "";

    salvar();
    mostrarTextos();

    alert("Texto salvo!");
}

function mostrarTextos() {
    const lista = $("savedTexts");
    const p = projetoAtual();

    lista.innerHTML = "";
    if (!p) return;

    p.textos.forEach(t => {
        const artigo = document.createElement("article");
        const conteudo = document.createElement("p");
        conteudo.textContent = t.conteudo;

        const editar = document.createElement("button");
        editar.textContent = "Editar";

        editar.onclick = () => {
            const novo = prompt("Editar texto:", t.conteudo);
            if (novo === null) return;

            t.conteudo = novo;
            salvar();
            mostrarTextos();
        };

        const apagar = document.createElement("button");
        apagar.textContent = "Excluir";

        apagar.onclick = () => {
            p.textos = p.textos.filter(x => x.id !== t.id);
            salvar();
            mostrarTextos();
        };

        artigo.append(conteudo, editar, apagar);
        lista.appendChild(artigo);
    });
}

async function pesquisar(modo) {
    const termo = $("searchInput").value.trim();
    const sites = $("siteInput").value.trim();

    if (!termo) {
        alert("Digite o que deseja pesquisar.");
        return;
    }

    const resultados = $("searchResults");
    resultados.textContent = "Pesquisando...";

    try {
        const params = new URLSearchParams({
            q: termo,
            mode: modo,
            sites: sites
        });

        const resposta = await fetch("/api/search?" + params);
        const dadosPesquisa = await resposta.json();

        if (!resposta.ok) {
            throw new Error(dadosPesquisa.error || "Erro na pesquisa");
        }

        resultados.innerHTML = "";

        dadosPesquisa.results.forEach(r => {
            const artigo = document.createElement("article");

            const titulo = document.createElement("h3");
            titulo.textContent = r.title;

            const descricao = document.createElement("p");
            descricao.textContent = r.description || "";

            const link = document.createElement("a");
            link.href = r.url;
            link.target = "_blank";
            link.rel = "noopener noreferrer";
            link.textContent = "Abrir resultado";

            artigo.append(titulo, descricao, link);
            resultados.appendChild(artigo);
        });

        if (!dadosPesquisa.results.length) {
            resultados.textContent = "Nenhum resultado encontrado.";
        }

    } catch (erro) {
        resultados.textContent = erro.message;
    }
}

$("newProjectBtn").onclick = criarProjeto;
$("welcomeProject").onclick = criarProjeto;
$("saveMemoryBtn").onclick = salvarMemoria;
$("saveTextBtn").onclick = salvarTexto;

$("searchBtn").onclick = () => pesquisar("normal");
$("deepSearchBtn").onclick = () => pesquisar("deep");

$("menuBtn").onclick = () => {
    $("sidebar").classList.toggle("open");
};

$("themeBtn").onclick = () => {
    document.body.classList.toggle("light");
};

document.querySelectorAll(".tab").forEach(botao => {
    botao.onclick = () => {
        const aba = botao.dataset.tab;

        ["search", "editor", "memory"].forEach(nome => {
            $(nome + "Panel").hidden = nome !== aba;
        });

        document.querySelectorAll(".tab").forEach(b => {
            b.classList.toggle("active", b === botao);
        });
    };
});

atualizar();

console.log("Knowledge Hub iniciado!");