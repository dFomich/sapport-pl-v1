package com.wmm.app.repository;

import com.wmm.app.domain.MechanicTile;
import java.util.List;
import java.util.Optional;
import org.springframework.data.domain.Page;

public interface MechanicTileRepositoryWithBagRelationships {
    Optional<MechanicTile> fetchBagRelationships(Optional<MechanicTile> mechanicTile);

    List<MechanicTile> fetchBagRelationships(List<MechanicTile> mechanicTiles);

    Page<MechanicTile> fetchBagRelationships(Page<MechanicTile> mechanicTiles);
}
