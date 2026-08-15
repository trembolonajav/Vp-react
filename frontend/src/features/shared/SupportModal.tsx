import { useEffect } from "react";

export function SupportModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  useEffect(() => {
    if (!open) return;
    const close = (event: KeyboardEvent) => { if (event.key === "Escape") onClose(); };
    window.addEventListener("keydown", close);
    return () => window.removeEventListener("keydown", close);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="support-modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <section className="support-modal" role="dialog" aria-modal="true" aria-labelledby="support-title">
        <button className="support-modal__close" type="button" onClick={onClose} aria-label="Fechar">×</button>
        <span>Apoio opcional</span>
        <h2 id="support-title">Apoie o streamer</h2>
        <p>Se o conteúdo e as ferramentas do VPLab ajudam você, é possível apoiar diretamente o trabalho do streamer com uma contribuição voluntária.</p>
        <div className="support-modal__qr" role="img" aria-label="QR Code para contribuição voluntária" />
        <small>O apoio é 100% opcional e não oferece benefícios, vantagens ou acesso exclusivo. Antes de confirmar, confira no aplicativo bancário se os dados do destinatário estão corretos.</small>
      </section>
    </div>
  );
}
