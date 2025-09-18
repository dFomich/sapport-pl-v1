package com.wmm.app.repository;

import com.wmm.app.domain.MechanicTile;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Optional;
import java.util.stream.IntStream;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;

/**
 * Utility repository to load bag relationships based on https://vladmihalcea.com/hibernate-multiplebagfetchexception/
 */
public class MechanicTileRepositoryWithBagRelationshipsImpl implements MechanicTileRepositoryWithBagRelationships {

    private static final String ID_PARAMETER = "id";
    private static final String MECHANICTILES_PARAMETER = "mechanicTiles";

    @PersistenceContext
    private EntityManager entityManager;

    @Override
    public Optional<MechanicTile> fetchBagRelationships(Optional<MechanicTile> mechanicTile) {
        return mechanicTile.map(this::fetchCategories).map(this::fetchWarehouses);
    }

    @Override
    public Page<MechanicTile> fetchBagRelationships(Page<MechanicTile> mechanicTiles) {
        return new PageImpl<>(
            fetchBagRelationships(mechanicTiles.getContent()),
            mechanicTiles.getPageable(),
            mechanicTiles.getTotalElements()
        );
    }

    @Override
    public List<MechanicTile> fetchBagRelationships(List<MechanicTile> mechanicTiles) {
        return Optional.of(mechanicTiles).map(this::fetchCategories).map(this::fetchWarehouses).orElse(Collections.emptyList());
    }

    MechanicTile fetchCategories(MechanicTile result) {
        return entityManager
            .createQuery(
                "select mechanicTile from MechanicTile mechanicTile left join fetch mechanicTile.categories where mechanicTile.id = :id",
                MechanicTile.class
            )
            .setParameter(ID_PARAMETER, result.getId())
            .getSingleResult();
    }

    List<MechanicTile> fetchCategories(List<MechanicTile> mechanicTiles) {
        HashMap<Object, Integer> order = new HashMap<>();
        IntStream.range(0, mechanicTiles.size()).forEach(index -> order.put(mechanicTiles.get(index).getId(), index));
        List<MechanicTile> result = entityManager
            .createQuery(
                "select mechanicTile from MechanicTile mechanicTile left join fetch mechanicTile.categories where mechanicTile in :mechanicTiles",
                MechanicTile.class
            )
            .setParameter(MECHANICTILES_PARAMETER, mechanicTiles)
            .getResultList();
        Collections.sort(result, (o1, o2) -> Integer.compare(order.get(o1.getId()), order.get(o2.getId())));
        return result;
    }

    MechanicTile fetchWarehouses(MechanicTile result) {
        return entityManager
            .createQuery(
                "select mechanicTile from MechanicTile mechanicTile left join fetch mechanicTile.warehouses where mechanicTile.id = :id",
                MechanicTile.class
            )
            .setParameter(ID_PARAMETER, result.getId())
            .getSingleResult();
    }

    List<MechanicTile> fetchWarehouses(List<MechanicTile> mechanicTiles) {
        HashMap<Object, Integer> order = new HashMap<>();
        IntStream.range(0, mechanicTiles.size()).forEach(index -> order.put(mechanicTiles.get(index).getId(), index));
        List<MechanicTile> result = entityManager
            .createQuery(
                "select mechanicTile from MechanicTile mechanicTile left join fetch mechanicTile.warehouses where mechanicTile in :mechanicTiles",
                MechanicTile.class
            )
            .setParameter(MECHANICTILES_PARAMETER, mechanicTiles)
            .getResultList();
        Collections.sort(result, (o1, o2) -> Integer.compare(order.get(o1.getId()), order.get(o2.getId())));
        return result;
    }
}
