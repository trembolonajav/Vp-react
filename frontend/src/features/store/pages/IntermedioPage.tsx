import {Link} from "react-router-dom";
import {useConfig} from "../../../hooks/useConfig";
import {waLink} from "../../../utils/whatsapp";

const MESSAGE="Olá, VP Store! Quero contratar o serviço de intermédio para uma negociação de Pokémon.";

export function IntermedioPage(){
 const {config}=useConfig();
 const whatsapp=config?waLink(config.whatsapp,MESSAGE):"#";
 return <main className="page intermediary-page"><div className="container">
  <section className="intermediary-hero"><div className="intermediary-copy"><span className="kicker">Intermédio VP Store</span><h1>Uma negociação importante não precisa depender da confiança em um desconhecido.</h1><p>A VP Store aproxima comprador e vendedor, registra o que foi combinado e acompanha a negociação pelo canal oficial. Você sabe com quem está falando e as duas partes confirmam as condições antes de concluir a troca.</p><div className="intermediary-actions"><a className="btn-icon-label btn-whats intermediary-cta" href={whatsapp} target="_blank" rel="noreferrer" aria-disabled={!config}>Solicitar um intermédio</a><Link className="intermediary-secondary" to="/comunidade">Ver canais oficiais</Link></div></div><div className="intermediary-seal"><img src="/assets/logo-vp-store-quadrada.webp" alt="Brasão da VP Store"/><span>Canal oficial</span><strong>VP Store</strong></div></section>
  <section className="intermediary-section" aria-labelledby="como-funciona-intermedio"><div className="section-head"><span className="kicker">Como funciona</span><h2 id="como-funciona-intermedio">Acompanhamento do começo ao fim</h2><p>Antes de qualquer entrega, comprador e vendedor alinham os detalhes com o atendimento oficial.</p></div><div className="intermediary-steps"><article><span className="step-number">01</span><h3>Apresente a negociação</h3><p>Informe qual Pokémon será negociado, o valor e as condições combinadas entre as partes.</p></article><article><span className="step-number">02</span><h3>Confirme os envolvidos</h3><p>A VP Store reúne e confirma as informações com comprador e vendedor no atendimento oficial.</p></article><article><span className="step-number">03</span><h3>Conclua com acompanhamento</h3><p>A negociação é conduzida conforme o combinado, com confirmação de ambas as partes em cada etapa.</p></article></div></section>
  <section className="intermediary-trust"><div><span className="kicker">Quem está por trás do serviço</span><h2>A loja oficial do Vperts</h2><p>A VP Store nasceu dentro da live. O intermédio é atendido por quem joga todos os dias na frente de milhares de pessoas — com clareza desde o primeiro contato até a confirmação da negociação.</p></div><aside><strong>Proteja sua negociação</strong><p>Fale somente pelo WhatsApp oficial indicado neste site. Não entregue Pokémon, itens ou pagamento a contatos não confirmados pela VP Store.</p></aside></section>
 </div></main>
}
