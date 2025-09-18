package com.wmm.app.web.rest;

import static com.wmm.app.domain.MechanicTileAsserts.*;
import static com.wmm.app.web.rest.TestUtil.createUpdateProxyForBean;
import static org.assertj.core.api.Assertions.assertThat;
import static org.hamcrest.Matchers.hasItem;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.wmm.app.IntegrationTest;
import com.wmm.app.domain.MechanicTile;
import com.wmm.app.repository.MechanicTileRepository;
import jakarta.persistence.EntityManager;
import java.util.ArrayList;
import java.util.Random;
import java.util.concurrent.atomic.AtomicLong;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

/**
 * Integration tests for the {@link MechanicTileResource} REST controller.
 */
@IntegrationTest
@ExtendWith(MockitoExtension.class)
@AutoConfigureMockMvc
@WithMockUser
class MechanicTileResourceIT {

    private static final String DEFAULT_TITLE = "AAAAAAAAAA";
    private static final String UPDATED_TITLE = "BBBBBBBBBB";

    private static final String DEFAULT_COMMENT = "AAAAAAAAAA";
    private static final String UPDATED_COMMENT = "BBBBBBBBBB";

    private static final String DEFAULT_MATERIAL_CODE = "AAAAAAAAAA";
    private static final String UPDATED_MATERIAL_CODE = "BBBBBBBBBB";

    private static final String DEFAULT_IMAGE_URL = "AAAAAAAAAA";
    private static final String UPDATED_IMAGE_URL = "BBBBBBBBBB";

    private static final Boolean DEFAULT_ACTIVE = false;
    private static final Boolean UPDATED_ACTIVE = true;

    private static final String ENTITY_API_URL = "/api/mechanic-tiles";
    private static final String ENTITY_API_URL_ID = ENTITY_API_URL + "/{id}";

    private static Random random = new Random();
    private static AtomicLong longCount = new AtomicLong(random.nextInt() + (2 * Integer.MAX_VALUE));

    @Autowired
    private ObjectMapper om;

    @Autowired
    private MechanicTileRepository mechanicTileRepository;

    @Mock
    private MechanicTileRepository mechanicTileRepositoryMock;

    @Autowired
    private EntityManager em;

    @Autowired
    private MockMvc restMechanicTileMockMvc;

    private MechanicTile mechanicTile;

    private MechanicTile insertedMechanicTile;

    /**
     * Create an entity for this test.
     *
     * This is a static method, as tests for other entities might also need it,
     * if they test an entity which requires the current entity.
     */
    public static MechanicTile createEntity() {
        return new MechanicTile()
            .title(DEFAULT_TITLE)
            .comment(DEFAULT_COMMENT)
            .materialCode(DEFAULT_MATERIAL_CODE)
            .imageUrl(DEFAULT_IMAGE_URL)
            .active(DEFAULT_ACTIVE);
    }

    /**
     * Create an updated entity for this test.
     *
     * This is a static method, as tests for other entities might also need it,
     * if they test an entity which requires the current entity.
     */
    public static MechanicTile createUpdatedEntity() {
        return new MechanicTile()
            .title(UPDATED_TITLE)
            .comment(UPDATED_COMMENT)
            .materialCode(UPDATED_MATERIAL_CODE)
            .imageUrl(UPDATED_IMAGE_URL)
            .active(UPDATED_ACTIVE);
    }

    @BeforeEach
    void initTest() {
        mechanicTile = createEntity();
    }

    @AfterEach
    void cleanup() {
        if (insertedMechanicTile != null) {
            mechanicTileRepository.delete(insertedMechanicTile);
            insertedMechanicTile = null;
        }
    }

    @Test
    @Transactional
    void createMechanicTile() throws Exception {
        long databaseSizeBeforeCreate = getRepositoryCount();
        // Create the MechanicTile
        var returnedMechanicTile = om.readValue(
            restMechanicTileMockMvc
                .perform(post(ENTITY_API_URL).contentType(MediaType.APPLICATION_JSON).content(om.writeValueAsBytes(mechanicTile)))
                .andExpect(status().isCreated())
                .andReturn()
                .getResponse()
                .getContentAsString(),
            MechanicTile.class
        );

        // Validate the MechanicTile in the database
        assertIncrementedRepositoryCount(databaseSizeBeforeCreate);
        assertMechanicTileUpdatableFieldsEquals(returnedMechanicTile, getPersistedMechanicTile(returnedMechanicTile));

        insertedMechanicTile = returnedMechanicTile;
    }

    @Test
    @Transactional
    void createMechanicTileWithExistingId() throws Exception {
        // Create the MechanicTile with an existing ID
        mechanicTile.setId(1L);

        long databaseSizeBeforeCreate = getRepositoryCount();

        // An entity with an existing ID cannot be created, so this API call must fail
        restMechanicTileMockMvc
            .perform(post(ENTITY_API_URL).contentType(MediaType.APPLICATION_JSON).content(om.writeValueAsBytes(mechanicTile)))
            .andExpect(status().isBadRequest());

        // Validate the MechanicTile in the database
        assertSameRepositoryCount(databaseSizeBeforeCreate);
    }

    @Test
    @Transactional
    void checkTitleIsRequired() throws Exception {
        long databaseSizeBeforeTest = getRepositoryCount();
        // set the field null
        mechanicTile.setTitle(null);

        // Create the MechanicTile, which fails.

        restMechanicTileMockMvc
            .perform(post(ENTITY_API_URL).contentType(MediaType.APPLICATION_JSON).content(om.writeValueAsBytes(mechanicTile)))
            .andExpect(status().isBadRequest());

        assertSameRepositoryCount(databaseSizeBeforeTest);
    }

    @Test
    @Transactional
    void checkMaterialCodeIsRequired() throws Exception {
        long databaseSizeBeforeTest = getRepositoryCount();
        // set the field null
        mechanicTile.setMaterialCode(null);

        // Create the MechanicTile, which fails.

        restMechanicTileMockMvc
            .perform(post(ENTITY_API_URL).contentType(MediaType.APPLICATION_JSON).content(om.writeValueAsBytes(mechanicTile)))
            .andExpect(status().isBadRequest());

        assertSameRepositoryCount(databaseSizeBeforeTest);
    }

    @Test
    @Transactional
    void checkActiveIsRequired() throws Exception {
        long databaseSizeBeforeTest = getRepositoryCount();
        // set the field null
        mechanicTile.setActive(null);

        // Create the MechanicTile, which fails.

        restMechanicTileMockMvc
            .perform(post(ENTITY_API_URL).contentType(MediaType.APPLICATION_JSON).content(om.writeValueAsBytes(mechanicTile)))
            .andExpect(status().isBadRequest());

        assertSameRepositoryCount(databaseSizeBeforeTest);
    }

    @Test
    @Transactional
    void getAllMechanicTiles() throws Exception {
        // Initialize the database
        insertedMechanicTile = mechanicTileRepository.saveAndFlush(mechanicTile);

        // Get all the mechanicTileList
        restMechanicTileMockMvc
            .perform(get(ENTITY_API_URL + "?sort=id,desc"))
            .andExpect(status().isOk())
            .andExpect(content().contentType(MediaType.APPLICATION_JSON_VALUE))
            .andExpect(jsonPath("$.[*].id").value(hasItem(mechanicTile.getId().intValue())))
            .andExpect(jsonPath("$.[*].title").value(hasItem(DEFAULT_TITLE)))
            .andExpect(jsonPath("$.[*].comment").value(hasItem(DEFAULT_COMMENT)))
            .andExpect(jsonPath("$.[*].materialCode").value(hasItem(DEFAULT_MATERIAL_CODE)))
            .andExpect(jsonPath("$.[*].imageUrl").value(hasItem(DEFAULT_IMAGE_URL)))
            .andExpect(jsonPath("$.[*].active").value(hasItem(DEFAULT_ACTIVE)));
    }

    @SuppressWarnings({ "unchecked" })
    void getAllMechanicTilesWithEagerRelationshipsIsEnabled() throws Exception {
        when(mechanicTileRepositoryMock.findAllWithEagerRelationships(any())).thenReturn(new PageImpl(new ArrayList<>()));

        restMechanicTileMockMvc.perform(get(ENTITY_API_URL + "?eagerload=true")).andExpect(status().isOk());

        verify(mechanicTileRepositoryMock, times(1)).findAllWithEagerRelationships(any());
    }

    @SuppressWarnings({ "unchecked" })
    void getAllMechanicTilesWithEagerRelationshipsIsNotEnabled() throws Exception {
        when(mechanicTileRepositoryMock.findAllWithEagerRelationships(any())).thenReturn(new PageImpl(new ArrayList<>()));

        restMechanicTileMockMvc.perform(get(ENTITY_API_URL + "?eagerload=false")).andExpect(status().isOk());
        verify(mechanicTileRepositoryMock, times(1)).findAll(any(Pageable.class));
    }

    @Test
    @Transactional
    void getMechanicTile() throws Exception {
        // Initialize the database
        insertedMechanicTile = mechanicTileRepository.saveAndFlush(mechanicTile);

        // Get the mechanicTile
        restMechanicTileMockMvc
            .perform(get(ENTITY_API_URL_ID, mechanicTile.getId()))
            .andExpect(status().isOk())
            .andExpect(content().contentType(MediaType.APPLICATION_JSON_VALUE))
            .andExpect(jsonPath("$.id").value(mechanicTile.getId().intValue()))
            .andExpect(jsonPath("$.title").value(DEFAULT_TITLE))
            .andExpect(jsonPath("$.comment").value(DEFAULT_COMMENT))
            .andExpect(jsonPath("$.materialCode").value(DEFAULT_MATERIAL_CODE))
            .andExpect(jsonPath("$.imageUrl").value(DEFAULT_IMAGE_URL))
            .andExpect(jsonPath("$.active").value(DEFAULT_ACTIVE));
    }

    @Test
    @Transactional
    void getNonExistingMechanicTile() throws Exception {
        // Get the mechanicTile
        restMechanicTileMockMvc.perform(get(ENTITY_API_URL_ID, Long.MAX_VALUE)).andExpect(status().isNotFound());
    }

    @Test
    @Transactional
    void putExistingMechanicTile() throws Exception {
        // Initialize the database
        insertedMechanicTile = mechanicTileRepository.saveAndFlush(mechanicTile);

        long databaseSizeBeforeUpdate = getRepositoryCount();

        // Update the mechanicTile
        MechanicTile updatedMechanicTile = mechanicTileRepository.findById(mechanicTile.getId()).orElseThrow();
        // Disconnect from session so that the updates on updatedMechanicTile are not directly saved in db
        em.detach(updatedMechanicTile);
        updatedMechanicTile
            .title(UPDATED_TITLE)
            .comment(UPDATED_COMMENT)
            .materialCode(UPDATED_MATERIAL_CODE)
            .imageUrl(UPDATED_IMAGE_URL)
            .active(UPDATED_ACTIVE);

        restMechanicTileMockMvc
            .perform(
                put(ENTITY_API_URL_ID, updatedMechanicTile.getId())
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(om.writeValueAsBytes(updatedMechanicTile))
            )
            .andExpect(status().isOk());

        // Validate the MechanicTile in the database
        assertSameRepositoryCount(databaseSizeBeforeUpdate);
        assertPersistedMechanicTileToMatchAllProperties(updatedMechanicTile);
    }

    @Test
    @Transactional
    void putNonExistingMechanicTile() throws Exception {
        long databaseSizeBeforeUpdate = getRepositoryCount();
        mechanicTile.setId(longCount.incrementAndGet());

        // If the entity doesn't have an ID, it will throw BadRequestAlertException
        restMechanicTileMockMvc
            .perform(
                put(ENTITY_API_URL_ID, mechanicTile.getId())
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(om.writeValueAsBytes(mechanicTile))
            )
            .andExpect(status().isBadRequest());

        // Validate the MechanicTile in the database
        assertSameRepositoryCount(databaseSizeBeforeUpdate);
    }

    @Test
    @Transactional
    void putWithIdMismatchMechanicTile() throws Exception {
        long databaseSizeBeforeUpdate = getRepositoryCount();
        mechanicTile.setId(longCount.incrementAndGet());

        // If url ID doesn't match entity ID, it will throw BadRequestAlertException
        restMechanicTileMockMvc
            .perform(
                put(ENTITY_API_URL_ID, longCount.incrementAndGet())
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(om.writeValueAsBytes(mechanicTile))
            )
            .andExpect(status().isBadRequest());

        // Validate the MechanicTile in the database
        assertSameRepositoryCount(databaseSizeBeforeUpdate);
    }

    @Test
    @Transactional
    void putWithMissingIdPathParamMechanicTile() throws Exception {
        long databaseSizeBeforeUpdate = getRepositoryCount();
        mechanicTile.setId(longCount.incrementAndGet());

        // If url ID doesn't match entity ID, it will throw BadRequestAlertException
        restMechanicTileMockMvc
            .perform(put(ENTITY_API_URL).contentType(MediaType.APPLICATION_JSON).content(om.writeValueAsBytes(mechanicTile)))
            .andExpect(status().isMethodNotAllowed());

        // Validate the MechanicTile in the database
        assertSameRepositoryCount(databaseSizeBeforeUpdate);
    }

    @Test
    @Transactional
    void partialUpdateMechanicTileWithPatch() throws Exception {
        // Initialize the database
        insertedMechanicTile = mechanicTileRepository.saveAndFlush(mechanicTile);

        long databaseSizeBeforeUpdate = getRepositoryCount();

        // Update the mechanicTile using partial update
        MechanicTile partialUpdatedMechanicTile = new MechanicTile();
        partialUpdatedMechanicTile.setId(mechanicTile.getId());

        partialUpdatedMechanicTile
            .title(UPDATED_TITLE)
            .materialCode(UPDATED_MATERIAL_CODE)
            .imageUrl(UPDATED_IMAGE_URL)
            .active(UPDATED_ACTIVE);

        restMechanicTileMockMvc
            .perform(
                patch(ENTITY_API_URL_ID, partialUpdatedMechanicTile.getId())
                    .contentType("application/merge-patch+json")
                    .content(om.writeValueAsBytes(partialUpdatedMechanicTile))
            )
            .andExpect(status().isOk());

        // Validate the MechanicTile in the database

        assertSameRepositoryCount(databaseSizeBeforeUpdate);
        assertMechanicTileUpdatableFieldsEquals(
            createUpdateProxyForBean(partialUpdatedMechanicTile, mechanicTile),
            getPersistedMechanicTile(mechanicTile)
        );
    }

    @Test
    @Transactional
    void fullUpdateMechanicTileWithPatch() throws Exception {
        // Initialize the database
        insertedMechanicTile = mechanicTileRepository.saveAndFlush(mechanicTile);

        long databaseSizeBeforeUpdate = getRepositoryCount();

        // Update the mechanicTile using partial update
        MechanicTile partialUpdatedMechanicTile = new MechanicTile();
        partialUpdatedMechanicTile.setId(mechanicTile.getId());

        partialUpdatedMechanicTile
            .title(UPDATED_TITLE)
            .comment(UPDATED_COMMENT)
            .materialCode(UPDATED_MATERIAL_CODE)
            .imageUrl(UPDATED_IMAGE_URL)
            .active(UPDATED_ACTIVE);

        restMechanicTileMockMvc
            .perform(
                patch(ENTITY_API_URL_ID, partialUpdatedMechanicTile.getId())
                    .contentType("application/merge-patch+json")
                    .content(om.writeValueAsBytes(partialUpdatedMechanicTile))
            )
            .andExpect(status().isOk());

        // Validate the MechanicTile in the database

        assertSameRepositoryCount(databaseSizeBeforeUpdate);
        assertMechanicTileUpdatableFieldsEquals(partialUpdatedMechanicTile, getPersistedMechanicTile(partialUpdatedMechanicTile));
    }

    @Test
    @Transactional
    void patchNonExistingMechanicTile() throws Exception {
        long databaseSizeBeforeUpdate = getRepositoryCount();
        mechanicTile.setId(longCount.incrementAndGet());

        // If the entity doesn't have an ID, it will throw BadRequestAlertException
        restMechanicTileMockMvc
            .perform(
                patch(ENTITY_API_URL_ID, mechanicTile.getId())
                    .contentType("application/merge-patch+json")
                    .content(om.writeValueAsBytes(mechanicTile))
            )
            .andExpect(status().isBadRequest());

        // Validate the MechanicTile in the database
        assertSameRepositoryCount(databaseSizeBeforeUpdate);
    }

    @Test
    @Transactional
    void patchWithIdMismatchMechanicTile() throws Exception {
        long databaseSizeBeforeUpdate = getRepositoryCount();
        mechanicTile.setId(longCount.incrementAndGet());

        // If url ID doesn't match entity ID, it will throw BadRequestAlertException
        restMechanicTileMockMvc
            .perform(
                patch(ENTITY_API_URL_ID, longCount.incrementAndGet())
                    .contentType("application/merge-patch+json")
                    .content(om.writeValueAsBytes(mechanicTile))
            )
            .andExpect(status().isBadRequest());

        // Validate the MechanicTile in the database
        assertSameRepositoryCount(databaseSizeBeforeUpdate);
    }

    @Test
    @Transactional
    void patchWithMissingIdPathParamMechanicTile() throws Exception {
        long databaseSizeBeforeUpdate = getRepositoryCount();
        mechanicTile.setId(longCount.incrementAndGet());

        // If url ID doesn't match entity ID, it will throw BadRequestAlertException
        restMechanicTileMockMvc
            .perform(patch(ENTITY_API_URL).contentType("application/merge-patch+json").content(om.writeValueAsBytes(mechanicTile)))
            .andExpect(status().isMethodNotAllowed());

        // Validate the MechanicTile in the database
        assertSameRepositoryCount(databaseSizeBeforeUpdate);
    }

    @Test
    @Transactional
    void deleteMechanicTile() throws Exception {
        // Initialize the database
        insertedMechanicTile = mechanicTileRepository.saveAndFlush(mechanicTile);

        long databaseSizeBeforeDelete = getRepositoryCount();

        // Delete the mechanicTile
        restMechanicTileMockMvc
            .perform(delete(ENTITY_API_URL_ID, mechanicTile.getId()).accept(MediaType.APPLICATION_JSON))
            .andExpect(status().isNoContent());

        // Validate the database contains one less item
        assertDecrementedRepositoryCount(databaseSizeBeforeDelete);
    }

    protected long getRepositoryCount() {
        return mechanicTileRepository.count();
    }

    protected void assertIncrementedRepositoryCount(long countBefore) {
        assertThat(countBefore + 1).isEqualTo(getRepositoryCount());
    }

    protected void assertDecrementedRepositoryCount(long countBefore) {
        assertThat(countBefore - 1).isEqualTo(getRepositoryCount());
    }

    protected void assertSameRepositoryCount(long countBefore) {
        assertThat(countBefore).isEqualTo(getRepositoryCount());
    }

    protected MechanicTile getPersistedMechanicTile(MechanicTile mechanicTile) {
        return mechanicTileRepository.findById(mechanicTile.getId()).orElseThrow();
    }

    protected void assertPersistedMechanicTileToMatchAllProperties(MechanicTile expectedMechanicTile) {
        assertMechanicTileAllPropertiesEquals(expectedMechanicTile, getPersistedMechanicTile(expectedMechanicTile));
    }

    protected void assertPersistedMechanicTileToMatchUpdatableProperties(MechanicTile expectedMechanicTile) {
        assertMechanicTileAllUpdatablePropertiesEquals(expectedMechanicTile, getPersistedMechanicTile(expectedMechanicTile));
    }
}
