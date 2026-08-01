import { Link } from "react-router-dom";

const STEPS = [
  { n: "1", title: "Encontre", body: "Filtre por jogo, servidor, categoria, moeda e faixa de preço até achar o anúncio certo." },
  { n: "2", title: "Demonstre interesse", body: "O botão Negociar agora abre uma conversa direta entre comprador e vendedor. O intermédio da VP é um serviço separado e precisa ser solicitado pelas partes." },
  { n: "3", title: "Combine", body: "Valor, forma de pagamento e como a entrega acontece dentro do jogo." },
  { n: "4", title: "Feche com intermédio", body: "Em negociações de valor mais alto, a VP entra no meio e garante os dois lados." },
];

export function ComoFuncionaPage() {
  return (
    <main className="page">
      <div className="container">
        <div className="section-head center">
          <div>
            <span className="kicker">Regras do marketplace</span>
            <h1>Como funciona o VP Bazaar</h1>
            <p className="section-sub">
              Um lugar só pra comunidade negociar sem cair em golpe. Leia rápido antes de fechar sua primeira troca.
            </p>
            <div className="ornament" aria-hidden="true" />
          </div>
        </div>

        <section className="section">
          <div className="bz-steps">
            {STEPS.map((step) => (
              <div className="bz-step" key={step.n}>
                <b>{step.n}</b>
                <strong>{step.title}</strong>
                <p>{step.body}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="section" id="intermedio">
          <div className="section-head">
            <div>
              <span className="kicker">Serviço da casa</span>
              <h2>Intermédio da VP</h2>
            </div>
          </div>
          <div className="bz-prose">
            <h3>O que é</h3>
            <p>
              O intermédio é a VP entrando no meio da negociação como garantia. Em vez de você entregar o item
              torcendo para receber, quem entrega primeiro entrega <strong>para a VP</strong> — e só depois da
              confirmação das duas partes o negócio é concluído.
            </p>

            <h3>Como funciona na prática</h3>
            <ul>
              <li>Comprador e vendedor combinam os termos e chamam a VP na conversa.</li>
              <li>O vendedor transfere o item para a conta indicada pela VP.</li>
              <li>O comprador faz o pagamento combinado.</li>
              <li>Confirmados os dois lados, a VP libera item e valor para cada um.</li>
              <li>Todo o histórico da negociação fica registrado no atendimento.</li>
            </ul>

            <h3>Quando vale a pena</h3>
            <p>
              Sempre que o valor pesar no seu bolso, quando você não conhece a outra parte, ou quando a entrega
              precisa ser feita em partes. Para trocas pequenas entre gente que já se conhece da live, normalmente
              não é necessário.
            </p>

            <h3>Custo</h3>
            <p>
              A taxa é combinada caso a caso, conforme o valor e a complexidade da entrega. Ela é sempre informada
              <strong> antes</strong> de qualquer transferência — nunca cobramos nada depois que o negócio já começou.
            </p>
          </div>
        </section>

        <section className="section" id="seguranca">
          <div className="section-head">
            <div>
              <span className="kicker">Não caia em golpe</span>
              <h2>Segurança</h2>
            </div>
          </div>
          <div className="bz-prose">
            <h3>Canais oficiais</h3>
            <p>
              A VP fala com você pelos contatos listados no rodapé deste site e na{" "}
              <Link to="/store/contato" style={{ color: "var(--gold)" }}>página de contato</Link>. Qualquer perfil,
              número ou conta diferente disso <strong>não é a VP</strong>, mesmo que use nossa logo, nosso nome ou
              fale como se fosse a equipe.
            </p>

            <h3>Regras que valem sempre</h3>
            <ul>
              <li>Confira o número oficial antes de mandar qualquer pagamento.</li>
              <li>Desconfie de preço muito abaixo do mercado e de pressa para fechar.</li>
              <li>Nunca compartilhe a senha da sua conta — nem com a VP, nem com ninguém.</li>
              <li>Guarde prints da conversa e dos comprovantes até a entrega concluída.</li>
              <li>Na dúvida, peça o intermédio: é mais barato que perder o item.</li>
            </ul>

            <h3>Responsabilidades</h3>
            <p>
              Os anúncios são publicados a pedido dos próprios jogadores e o conteúdo é de responsabilidade de quem
              anuncia. A VP faz curadoria do que entra no marketplace e garante as negociações em que atua como
              intermediária. Negociações fechadas por fora, sem intermédio, ficam por conta das partes.
            </p>

            <h3>O que não é aceito</h3>
            <ul>
              <li>Contas ou itens obtidos por invasão, engano ou uso de programas proibidos.</li>
              <li>Anúncios com preço ou descrição enganosa.</li>
              <li>Qualquer coisa que fuja das regras do jogo anunciado.</li>
            </ul>
          </div>
        </section>

        <section className="section">
          <div className="bz-prose" style={{ textAlign: "center" }}>
            <h3 style={{ marginBottom: 14 }}>Pronto para começar?</h3>
            <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
              <Link className="btn-icon-label btn-twitch" to="/bazaar">Ver o marketplace</Link>
              <Link className="btn-icon-label btn-whats" to="/bazaar/anunciar">Anunciar meu item</Link>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
