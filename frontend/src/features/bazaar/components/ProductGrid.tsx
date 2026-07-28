import type { Listing } from "../../../types/listing";
import { ProductCard } from "./ProductCard";

export function ProductGrid({ listings }: { listings: Listing[] }) {
  if (listings.length === 0) {
    return (
      <div className="bz-empty">
        <strong>Nenhum anúncio encontrado</strong>
        <p>
          Ajuste os filtros — se o que você procura não está aqui, a VP corre
          atrás na comunidade.
        </p>
      </div>
    );
  }

  return (
    <div className="bz-grid">
      {listings.map((listing) => (
        <ProductCard key={listing.id} listing={listing} />
      ))}
    </div>
  );
}
