package com.vpertz.catalog;

import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface GameRepository extends JpaRepository<Game, String> {

    List<Game> findAllByOrderByOrderingAscNomeAsc();
}
