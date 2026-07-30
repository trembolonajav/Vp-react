package com.vpertz.favorites;

import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface FavoriteRepository extends JpaRepository<Favorite, Long> {
    List<Favorite> findByUserIdOrderByCreatedAtDesc(String userId);
    Optional<Favorite> findByUserIdAndListingPublicId(String userId, String listingPublicId);
}
