package com.wmm.app.domain;

import static com.wmm.app.domain.MechanicTileTestSamples.*;
import static com.wmm.app.domain.ProductCategoryTestSamples.*;
import static org.assertj.core.api.Assertions.assertThat;

import com.wmm.app.web.rest.TestUtil;
import java.util.HashSet;
import java.util.Set;
import org.junit.jupiter.api.Test;

class ProductCategoryTest {

    @Test
    void equalsVerifier() throws Exception {
        TestUtil.equalsVerifier(ProductCategory.class);
        ProductCategory productCategory1 = getProductCategorySample1();
        ProductCategory productCategory2 = new ProductCategory();
        assertThat(productCategory1).isNotEqualTo(productCategory2);

        productCategory2.setId(productCategory1.getId());
        assertThat(productCategory1).isEqualTo(productCategory2);

        productCategory2 = getProductCategorySample2();
        assertThat(productCategory1).isNotEqualTo(productCategory2);
    }

    @Test
    void tilesTest() {
        ProductCategory productCategory = getProductCategoryRandomSampleGenerator();
        MechanicTile mechanicTileBack = getMechanicTileRandomSampleGenerator();

        productCategory.addTiles(mechanicTileBack);
        assertThat(productCategory.getTiles()).containsOnly(mechanicTileBack);
        assertThat(mechanicTileBack.getCategories()).containsOnly(productCategory);

        productCategory.removeTiles(mechanicTileBack);
        assertThat(productCategory.getTiles()).doesNotContain(mechanicTileBack);
        assertThat(mechanicTileBack.getCategories()).doesNotContain(productCategory);

        productCategory.tiles(new HashSet<>(Set.of(mechanicTileBack)));
        assertThat(productCategory.getTiles()).containsOnly(mechanicTileBack);
        assertThat(mechanicTileBack.getCategories()).containsOnly(productCategory);

        productCategory.setTiles(new HashSet<>());
        assertThat(productCategory.getTiles()).doesNotContain(mechanicTileBack);
        assertThat(mechanicTileBack.getCategories()).doesNotContain(productCategory);
    }
}
