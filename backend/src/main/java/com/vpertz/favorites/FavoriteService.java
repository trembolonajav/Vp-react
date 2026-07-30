package com.vpertz.favorites;

import com.vpertz.common.exception.ResourceNotFoundException;
import com.vpertz.listings.ListingRepository;
import java.util.List;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class FavoriteService {
    private final FavoriteRepository repository;
    private final ListingRepository listingRepository;

    public FavoriteService(FavoriteRepository repository, ListingRepository listingRepository) {
        this.repository = repository;
        this.listingRepository = listingRepository;
    }

    @Transactional(readOnly = true)
    public List<String> list(String userId) {
        return repository.findByUserIdOrderByCreatedAtDesc(userId).stream()
                .map(Favorite::getListingPublicId)
                .toList();
    }

    @Transactional
    public void add(String userId, String listingId) {
        if (!listingRepository.existsByPublicId(listingId)) {
            throw new ResourceNotFoundException("Anúncio não encontrado.");
        }
        if (repository.findByUserIdAndListingPublicId(userId, listingId).isPresent()) {
            return;
        }
        Favorite favorite = new Favorite();
        favorite.setUserId(userId);
        favorite.setListingPublicId(listingId);
        repository.save(favorite);
    }

    @Transactional
    public void remove(String userId, String listingId) {
        repository.findByUserIdAndListingPublicId(userId, listingId).ifPresent(repository::delete);
    }
}
