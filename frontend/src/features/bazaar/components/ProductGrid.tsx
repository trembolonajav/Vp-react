import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../../contexts/AuthContext";
import { addFavorite, listFavorites, removeFavorite } from "../../../services/favoritesService";
import type { Listing } from "../../../types/listing";
import { ProductCard } from "./ProductCard";

export function ProductGrid({ listings }: { listings: Listing[] }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [favorites, setFavorites] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!user) {
      setFavorites(new Set());
      return;
    }
    const controller = new AbortController();
    listFavorites(controller.signal).then((ids) => setFavorites(new Set(ids))).catch(() => undefined);
    return () => controller.abort();
  }, [user]);

  const toggleFavorite = async (listing: Listing) => {
    if (!user) {
      navigate("/bazaar/login", { state: { from: "/bazaar" } });
      return;
    }
    const removing = favorites.has(listing.id);
    setFavorites((current) => {
      const next = new Set(current);
      if (removing) next.delete(listing.id);
      else next.add(listing.id);
      return next;
    });
    try {
      if (removing) await removeFavorite(listing.id);
      else await addFavorite(listing.id);
    } catch {
      setFavorites((current) => {
        const next = new Set(current);
        if (removing) next.add(listing.id);
        else next.delete(listing.id);
        return next;
      });
    }
  };
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
        <ProductCard
          key={listing.id}
          listing={listing}
          favorite={favorites.has(listing.id)}
          onFavorite={toggleFavorite}
        />
      ))}
    </div>
  );
}
