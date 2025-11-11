import { ProductTile, ProductTileProps } from "./product-tile";
import { useFavorite } from "@/hooks/use-favorite";

export function FavoriteProductTile(props: ProductTileProps) {
  const { isFavorite, toggleFavorite } = useFavorite(props.id);

  return (
    <ProductTile
      {...props}
      isFavorite={isFavorite}
      onFavoriteToggle={toggleFavorite}
    />
  );
}
