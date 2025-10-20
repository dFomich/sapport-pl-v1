package com.wmm.app.repository;

import com.wmm.app.domain.MechanicTile;
import java.util.List;
import java.util.Optional;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

/**
 * Spring Data JPA repository for the MechanicTile entity.
 *
 * When extending this class, extend MechanicTileRepositoryWithBagRelationships too.
 * For more information refer to https://github.com/jhipster/generator-jhipster/issues/17990.
 */
@Repository
public interface MechanicTileRepository extends MechanicTileRepositoryWithBagRelationships, JpaRepository<MechanicTile, Long> {
    default Optional<MechanicTile> findOneWithEagerRelationships(Long id) {
        return this.fetchBagRelationships(this.findById(id));
    }

    default List<MechanicTile> findAllWithEagerRelationships() {
        return this.fetchBagRelationships(this.findAll());
    }

    default Page<MechanicTile> findAllWithEagerRelationships(Pageable pageable) {
        return this.fetchBagRelationships(this.findAll(pageable));
    }

    // ИДшники активных плиток для склада + опциональный поиск по названию
    @Query(
        """
        select distinct mt.id
        from MechanicTile mt
        join mt.warehouses w
        where mt.active = true
          and w.code = :storageType
          and ( :q is null or :q = '' or lower(mt.title) like lower(concat('%', :q, '%')) )
        """
    )
    List<Long> findActiveIdsByWarehouseAndQuery(@Param("storageType") String storageType, @Param("q") String q);

    // Жадная загрузка категорий и складов для набора id
    @EntityGraph(attributePaths = { "categories", "warehouses" })
    @Query("select distinct mt from MechanicTile mt where mt.id in :ids")
    List<MechanicTile> findAllWithEagerRelationshipsByIdIn(@Param("ids") List<Long> ids);

    // Имена категорий для склада (для фильтра)
    @Query(
        value = """
        select distinct c.name
        from product_category c
        join rel_mechanic_tile__categories rc on c.id = rc.categories_id
        join mechanic_tile mt on mt.id = rc.mechanic_tile_id
        join rel_mechanic_tile__warehouses rw on mt.id = rw.mechanic_tile_id
        join warehouse w on w.id = rw.warehouses_id
        where mt.active = true
          and w.code = :storageType
        order by c.name asc
        """,
        nativeQuery = true
    )
    List<String> findCategoryNamesForWarehouse(@Param("storageType") String storageType);

    Optional<MechanicTile> findByMaterialCodeAndActiveTrue(String materialCode);
}
