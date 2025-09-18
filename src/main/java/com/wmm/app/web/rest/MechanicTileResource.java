package com.wmm.app.web.rest;

import com.wmm.app.domain.MechanicTile;
import com.wmm.app.repository.MechanicTileRepository;
import com.wmm.app.web.rest.errors.BadRequestAlertException;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import java.net.URI;
import java.net.URISyntaxException;
import java.util.List;
import java.util.Objects;
import java.util.Optional;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import tech.jhipster.web.util.HeaderUtil;
import tech.jhipster.web.util.ResponseUtil;

/**
 * REST controller for managing {@link com.wmm.app.domain.MechanicTile}.
 */
@RestController
@RequestMapping("/api/mechanic-tiles")
@Transactional
@PreAuthorize("hasAnyAuthority('ROLE_ADMIN','ROLE_SENIOR_WAREHOUSEMAN')")
public class MechanicTileResource {

    private static final Logger LOG = LoggerFactory.getLogger(MechanicTileResource.class);

    private static final String ENTITY_NAME = "mechanicTile";

    @Value("${jhipster.clientApp.name}")
    private String applicationName;

    private final MechanicTileRepository mechanicTileRepository;

    public MechanicTileResource(MechanicTileRepository mechanicTileRepository) {
        this.mechanicTileRepository = mechanicTileRepository;
    }

    /**
     * {@code POST  /mechanic-tiles} : Create a new mechanicTile.
     *
     * @param mechanicTile the mechanicTile to create.
     * @return the {@link ResponseEntity} with status {@code 201 (Created)} and with body the new mechanicTile, or with status {@code 400 (Bad Request)} if the mechanicTile has already an ID.
     * @throws URISyntaxException if the Location URI syntax is incorrect.
     */
    @PostMapping("")
    public ResponseEntity<MechanicTile> createMechanicTile(@Valid @RequestBody MechanicTile mechanicTile) throws URISyntaxException {
        LOG.debug("REST request to save MechanicTile : {}", mechanicTile);
        if (mechanicTile.getId() != null) {
            throw new BadRequestAlertException("A new mechanicTile cannot already have an ID", ENTITY_NAME, "idexists");
        }
        mechanicTile = mechanicTileRepository.save(mechanicTile);
        return ResponseEntity.created(new URI("/api/mechanic-tiles/" + mechanicTile.getId()))
            .headers(HeaderUtil.createEntityCreationAlert(applicationName, true, ENTITY_NAME, mechanicTile.getId().toString()))
            .body(mechanicTile);
    }

    /**
     * {@code PUT  /mechanic-tiles/:id} : Updates an existing mechanicTile.
     *
     * @param id the id of the mechanicTile to save.
     * @param mechanicTile the mechanicTile to update.
     * @return the {@link ResponseEntity} with status {@code 200 (OK)} and with body the updated mechanicTile,
     * or with status {@code 400 (Bad Request)} if the mechanicTile is not valid,
     * or with status {@code 500 (Internal Server Error)} if the mechanicTile couldn't be updated.
     * @throws URISyntaxException if the Location URI syntax is incorrect.
     */
    @PutMapping("/{id}")
    public ResponseEntity<MechanicTile> updateMechanicTile(
        @PathVariable(value = "id", required = false) final Long id,
        @Valid @RequestBody MechanicTile mechanicTile
    ) throws URISyntaxException {
        LOG.debug("REST request to update MechanicTile : {}, {}", id, mechanicTile);
        if (mechanicTile.getId() == null) {
            throw new BadRequestAlertException("Invalid id", ENTITY_NAME, "idnull");
        }
        if (!Objects.equals(id, mechanicTile.getId())) {
            throw new BadRequestAlertException("Invalid ID", ENTITY_NAME, "idinvalid");
        }

        if (!mechanicTileRepository.existsById(id)) {
            throw new BadRequestAlertException("Entity not found", ENTITY_NAME, "idnotfound");
        }

        mechanicTile = mechanicTileRepository.save(mechanicTile);
        return ResponseEntity.ok()
            .headers(HeaderUtil.createEntityUpdateAlert(applicationName, true, ENTITY_NAME, mechanicTile.getId().toString()))
            .body(mechanicTile);
    }

    /**
     * {@code PATCH  /mechanic-tiles/:id} : Partial updates given fields of an existing mechanicTile, field will ignore if it is null
     *
     * @param id the id of the mechanicTile to save.
     * @param mechanicTile the mechanicTile to update.
     * @return the {@link ResponseEntity} with status {@code 200 (OK)} and with body the updated mechanicTile,
     * or with status {@code 400 (Bad Request)} if the mechanicTile is not valid,
     * or with status {@code 404 (Not Found)} if the mechanicTile is not found,
     * or with status {@code 500 (Internal Server Error)} if the mechanicTile couldn't be updated.
     * @throws URISyntaxException if the Location URI syntax is incorrect.
     */
    @PatchMapping(value = "/{id}", consumes = { "application/json", "application/merge-patch+json" })
    public ResponseEntity<MechanicTile> partialUpdateMechanicTile(
        @PathVariable(value = "id", required = false) final Long id,
        @NotNull @RequestBody MechanicTile mechanicTile
    ) throws URISyntaxException {
        LOG.debug("REST request to partial update MechanicTile partially : {}, {}", id, mechanicTile);
        if (mechanicTile.getId() == null) {
            throw new BadRequestAlertException("Invalid id", ENTITY_NAME, "idnull");
        }
        if (!Objects.equals(id, mechanicTile.getId())) {
            throw new BadRequestAlertException("Invalid ID", ENTITY_NAME, "idinvalid");
        }

        if (!mechanicTileRepository.existsById(id)) {
            throw new BadRequestAlertException("Entity not found", ENTITY_NAME, "idnotfound");
        }

        Optional<MechanicTile> result = mechanicTileRepository
            .findById(mechanicTile.getId())
            .map(existingMechanicTile -> {
                if (mechanicTile.getTitle() != null) {
                    existingMechanicTile.setTitle(mechanicTile.getTitle());
                }
                if (mechanicTile.getComment() != null) {
                    existingMechanicTile.setComment(mechanicTile.getComment());
                }
                if (mechanicTile.getMaterialCode() != null) {
                    existingMechanicTile.setMaterialCode(mechanicTile.getMaterialCode());
                }
                if (mechanicTile.getImageUrl() != null) {
                    existingMechanicTile.setImageUrl(mechanicTile.getImageUrl());
                }
                if (mechanicTile.getActive() != null) {
                    existingMechanicTile.setActive(mechanicTile.getActive());
                }

                return existingMechanicTile;
            })
            .map(mechanicTileRepository::save);

        return ResponseUtil.wrapOrNotFound(
            result,
            HeaderUtil.createEntityUpdateAlert(applicationName, true, ENTITY_NAME, mechanicTile.getId().toString())
        );
    }

    /**
     * {@code GET  /mechanic-tiles} : get all the mechanicTiles.
     *
     * @param eagerload flag to eager load entities from relationships (This is applicable for many-to-many).
     * @return the {@link ResponseEntity} with status {@code 200 (OK)} and the list of mechanicTiles in body.
     */
    @GetMapping("")
    public List<MechanicTile> getAllMechanicTiles(
        @RequestParam(name = "eagerload", required = false, defaultValue = "true") boolean eagerload
    ) {
        LOG.debug("REST request to get all MechanicTiles");
        if (eagerload) {
            return mechanicTileRepository.findAllWithEagerRelationships();
        } else {
            return mechanicTileRepository.findAll();
        }
    }

    /**
     * {@code GET  /mechanic-tiles/:id} : get the "id" mechanicTile.
     *
     * @param id the id of the mechanicTile to retrieve.
     * @return the {@link ResponseEntity} with status {@code 200 (OK)} and with body the mechanicTile, or with status {@code 404 (Not Found)}.
     */
    @GetMapping("/{id}")
    public ResponseEntity<MechanicTile> getMechanicTile(@PathVariable("id") Long id) {
        LOG.debug("REST request to get MechanicTile : {}", id);
        Optional<MechanicTile> mechanicTile = mechanicTileRepository.findOneWithEagerRelationships(id);
        return ResponseUtil.wrapOrNotFound(mechanicTile);
    }

    /**
     * {@code DELETE  /mechanic-tiles/:id} : delete the "id" mechanicTile.
     *
     * @param id the id of the mechanicTile to delete.
     * @return the {@link ResponseEntity} with status {@code 204 (NO_CONTENT)}.
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteMechanicTile(@PathVariable("id") Long id) {
        LOG.debug("REST request to delete MechanicTile : {}", id);
        mechanicTileRepository.deleteById(id);
        return ResponseEntity.noContent()
            .headers(HeaderUtil.createEntityDeletionAlert(applicationName, true, ENTITY_NAME, id.toString()))
            .build();
    }
}
