(function () {
  const root = document.querySelector("[data-chat]");
  const esc = window.vpEsc || ((s) => String(s ?? ""));
  let selected = new URLSearchParams(location.search).get("id");
  let current = null;
  let catalog = null;
  const request = async (url, options) => {
    const res = await fetch(url, { credentials: "same-origin", ...options });
    const data = await res.json(); if (!res.ok) throw new Error(data.error || "Não foi possível continuar."); return data;
  };
  const time = (value) => new Date(value).toLocaleString("pt-BR", { day:"2-digit", month:"2-digit", hour:"2-digit", minute:"2-digit" });
  const thumb = (c, alt = "") => c.image
    ? `<img src="${esc(c.image)}" alt="${esc(alt)}">`
    : `<i>${esc((alt || "VP").slice(0,2).toUpperCase())}</i>`;
  const price = (c) => c.price ? `${c.currency === "pix" ? "R$" : "◆"} ${Number(c.price).toLocaleString("pt-BR")}` : "";
  const statusLabel = (value) => ({ aberta:"Aberta", "intermedio-solicitado":"Intermédio", concluida:"Concluída", encerrada:"Encerrada" }[value] || value);
  async function enrich(conversation) {
    if (conversation.image) return conversation;
    try {
      if (!catalog) {
        const config = await window.vpFetchConfig();
        catalog = window.vpBazaar(config).anuncios || [];
      }
      const ad = catalog.find((item) => String(item.id) === String(conversation.adId));
      if (ad) return { ...conversation, image: ad.imagem, price: ad.preco, currency: ad.moeda, details: [ad.nivel ? `Nv. ${ad.nivel}` : "", ad.qualidadeRotulo || "", ad.ivTotal ? `IV ${ad.ivTotal}/192` : ""].filter(Boolean).join(" · ") };
    } catch {}
    return conversation;
  }

  async function list() {
    const data = await request("/api/bazaar/chat");
    root.querySelector("[data-unread]").textContent = data.unread;
    root.querySelector("[data-conversation-list]").innerHTML = data.conversations.length ? data.conversations.map((c) => `
      <button class="${c.id === selected ? "active" : ""}" data-open="${esc(c.id)}">
        <span class="bz-conv-thumb">${thumb(c, c.title)}</span>
        <span><span class="bz-conv-line"><strong>${esc(c.buyer === data.user.username ? c.seller : c.buyer)}</strong><time>${c.lastMessage ? time(c.lastMessage.createdAt).split(", ").pop() : ""}</time></span><small>${esc(c.title)}</small><em class="bz-conv-status ${esc(c.status)}">${esc(statusLabel(c.status))}</em></span>
        ${c.unread ? `<b>${c.unread}</b>` : ""}
      </button>`).join("") : `<div class="bz-chat-empty">Você ainda não iniciou uma negociação.</div>`;
    if (!selected && data.conversations[0]) selected = data.conversations[0].id;
    if (selected) await open(selected);
  }
  async function open(id) {
    selected = id;
    const data = await request(`/api/bazaar/chat?id=${encodeURIComponent(id)}`); data.conversation = await enrich(data.conversation); current = data;
    history.replaceState(null, "", `chat.html?id=${encodeURIComponent(id)}`);
    const other = data.conversation.buyer === data.user.username ? data.conversation.seller : data.conversation.buyer;
    const isBuyer = data.conversation.buyer === data.user.username;
    const role = isBuyer ? "Comprador" : "Vendedor";
    root.querySelectorAll("[data-open]").forEach((b) => b.classList.toggle("active", b.dataset.open === id));
    root.querySelector("[data-chat-panel]").innerHTML = `
      <header class="bz-chat-head"><span class="bz-chat-art">${thumb(data.conversation, data.conversation.title)}</span><div><h2>${esc(data.conversation.title)}</h2><p>${esc(data.conversation.details || "")}${price(data.conversation) ? ` <strong>${esc(price(data.conversation))}</strong>` : ""}</p></div><div class="bz-chat-person"><strong>${esc(other)}</strong><small>● ${isBuyer ? "Vendedor" : "Comprador"} · online</small></div><i class="bz-chat-avatar">${esc(other.slice(0,2).toUpperCase())}</i></header>
      <div class="bz-chat-messages" data-chat-messages>
        <div class="bz-chat-day">Negociação aberta em ${time(data.conversation.createdAt)}</div>
        ${data.messages.length ? data.messages.map((m) => `<article class="${m.authorId === data.user.id ? "mine" : ""}"><p>${esc(m.text)}</p><small>${esc(m.author)} · ${time(m.createdAt)}</small></article>`).join("") : `<div class="bz-chat-welcome"><strong>Conversa iniciada</strong><p>Envie uma proposta ou tire uma dúvida diretamente com ${esc(other)}.</p></div>`}
        ${data.conversation.status === "intermedio-solicitado" ? `<div class="bz-chat-system"><b>◇ Intermédio solicitado</b><span>Aguarde a confirmação do atendimento antes de realizar entregas.</span></div>` : ""}
      </div>
      <form class="bz-chat-compose" data-chat-form>
        <button class="bz-chat-attach" type="button" title="Anexar print" aria-label="Anexar print"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.5 12.7 20.8a5 5 0 0 1-7-7l8.3-8.4a3.3 3.3 0 0 1 4.7 4.7L10.3 18.5a1.7 1.7 0 0 1-2.4-2.4l7.7-7.7"></path></svg></button>
        <textarea name="message" maxlength="1000" required placeholder="Escreva para ${esc(other)}…"></textarea>
        <button aria-label="Enviar mensagem">Enviar</button>
      </form>`;
    root.querySelector("[data-deal-panel]").innerHTML = `
      <section class="bz-deal-panel bz-progress"><h2>Andamento</h2><ol>
        <li class="done"><b>Chat aberto</b><span>${time(data.conversation.createdAt)}</span></li>
        <li class="${data.messages.length ? "done" : ""}"><b>Conversa em andamento</b><span>${data.messages.length ? `${data.messages.length} mensagem(ns)` : "Aguardando mensagens"}</span></li>
        <li class="${data.conversation.status === "intermedio-solicitado" || data.conversation.status === "concluida" ? "current" : ""}"><b>Intermédio solicitado</b><span>${data.conversation.status === "intermedio-solicitado" ? "Aguardando atendimento" : "Opcional"}</span></li>
        <li class="${data.conversation.status === "concluida" ? "done" : ""}"><b>Troca concluída</b><span>Confirmação das partes</span></li>
      </ol></section>
      <section class="bz-deal-panel bz-actions"><h2>Ações</h2>
      <button class="bz-deal-primary" data-status="intermedio-solicitado"><i class="bz-shield-icon"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9"><path d="M12 3 4 6v5.5c0 4.6 3.2 8.4 8 9.5 4.8-1.1 8-4.9 8-9.5V6Z"></path><path d="m9 12 2 2 4-4"></path></svg></i><span><b>Solicitar intermédio</b><small>Moderador da VP acompanha o trade</small></span></button>
      <a class="bz-discord-action" href="https://discord.gg/9M3HCdytt" target="_blank" rel="noreferrer"><i class="bz-discord-icon"><svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M19.3 5.4A16.9 16.9 0 0 0 15.1 4l-.2.4a15.6 15.6 0 0 1 3.7 1.5 13.1 13.1 0 0 0-11.2 0A15.6 15.6 0 0 1 11.1 4.4L10.9 4a16.9 16.9 0 0 0-4.2 1.4C4 9.4 3.3 13.2 3.6 17a17 17 0 0 0 5.1 2.6l1-1.7a11 11 0 0 1-1.7-.8l.4-.3a12.1 12.1 0 0 0 9.2 0l.4.3a11 11 0 0 1-1.7.8l1 1.7a17 17 0 0 0 5.1-2.6c.4-4.4-.6-8.2-3.1-11.6ZM9.5 14.7c-1 0-1.8-.9-1.8-2s.8-2 1.8-2 1.8.9 1.8 2-.8 2-1.8 2Zm5 0c-1 0-1.8-.9-1.8-2s.8-2 1.8-2 1.8.9 1.8 2-.8 2-1.8 2Z"></path></svg></i><span><b>Discord oficial</b><small>Combinar ao vivo por voz</small></span><em>↗</em></a>
      <button class="bz-complete" data-status="concluida">✓ Confirmar recebimento</button>
      <small>Libera a avaliação e fecha a negociação.</small>
      <button class="danger" data-status="encerrada">× Encerrar negociação</button>
      <button class="bz-deal-report" data-report-conversation>⚠ Denunciar este usuário</button></section>
      <section class="bz-deal-note"><img src="/assets/bazaar/fields/disponivel-troca.webp" alt=""><span>O que for combinado aqui fica registrado. Sem intermédio, a negociação é responsabilidade do comprador e vendedor.</span></section>`;
    await request("/api/bazaar/chat", { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({ action:"read", id }) });
    const messages = root.querySelector("[data-chat-messages]"); messages.scrollTop = messages.scrollHeight;
  }
  root.addEventListener("click", async (e) => {
    const openButton = e.target.closest("[data-open]"); if (openButton) return open(openButton.dataset.open);
    const status = e.target.closest("[data-status]"); if (status) {
      await request("/api/bazaar/chat", { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({ action:"status", id:selected, status:status.dataset.status }) }); await open(selected);
    }
    const report = e.target.closest("[data-report-conversation]"); if (report) {
      const details = prompt("Descreva o problema nesta negociação:");
      if (details) {
        await request("/api/bazaar/report", { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({ adId:current.conversation.adId, reason:"Problema na negociação", details:`Conversa ${selected}: ${details}` }) });
        alert("Denúncia enviada para análise.");
      }
    }
  });
  root.addEventListener("submit", async (e) => {
    if (!e.target.matches("[data-chat-form]")) return; e.preventDefault();
    const field = e.target.elements.message;
    await request("/api/bazaar/chat", { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({ action:"message", id:selected, text:field.value }) });
    field.value = ""; await open(selected);
  });
  window.VPConta.ready().then(() => window.VPConta.contaAtual() ? list() : window.VPConta.pedirLogin().then((u) => u ? list() : location.href="index.html"));
})();
