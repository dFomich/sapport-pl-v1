package com.wmm.app.domain;

import static com.wmm.app.domain.MechanicTileTestSamples.*;
import static com.wmm.app.domain.ProductCategoryTestSamples.*;
import static com.wmm.app.domain.WarehouseTestSamples.*;
import static org.assertj.core.api.Assertions.assertThat;

import com.wmm.app.web.rest.TestUtil;
import java.util.HashSet;
import java.util.Set;
import org.junit.jupiter.api.Test;

class MechanicTileTest {

    @Test
    void equalsVerifier() throws Exception {
        TestUtil.equalsVerifier(MechanicTile.class);
        MechanicTile mechanicTile1 = getMechanicTileSample1();
        MechanicTile mechanicTile2 = new MechanicTile();
        assertThat(mechanicTile1).isNotEqualTo(mechanicTile2);

        mechanicTile2.setId(mechanicTile1.getId());
        assertThat(mechanicTile1).isEqualTo(mechanicTile2);

        mechanicTile2 = getMechanicTileSample2();
        assertThat(mechanicTile1).isNotEqualTo(mechanicTile2);
    }

    @Test
    void categoriesTest() {
        MechanicTile mechanicTile = getMechanicTileRandomSampleGenerator();
        ProductCategory productCategoryBack = getProductCategoryRandomSampleGenerator();

        mechanicTile.addCategories(productCategoryBack);
        assertThat(mechanicTile.getCategories()).containsOnly(productCategoryBack);

        mechanicTile.removeCategories(productCategoryBack);
        assertThat(mechanicTile.getCategories()).doesNotContain(productCategoryBack);

        mechanicTile.categories(new HashSet<>(Set.of(productCategoryBack)));
        assertThat(mechanicTile.getCategories()).containsOnly(productCategoryBack);

        mechanicTile.setCategories(new HashSet<>());
        assertThat(mechanicTile.getCategories()).doesNotContain(productCategoryBack);
    }

    @Test
    void warehousesTest() {
        MechanicTile mechanicTile = getMechanicTileRandomSampleGenerator();
        Warehouse warehouseBack = getWarehouseRandomSampleGenerator();

        mechanicTile.addWarehouses(warehouseBack);
        assertThat(mechanicTile.getWarehouses()).containsOnly(warehouseBack);

        mechanicTile.removeWarehouses(warehouseBack);
        assertThat(mechanicTile.getWarehouses()).doesNotContain(warehouseBack);

        mechanicTile.warehouses(new HashSet<>(Set.of(warehouseBack)));
        assertThat(mechanicTile.getWarehouses()).containsOnly(warehouseBack);

        mechanicTile.setWarehouses(new HashSet<>());
        assertThat(mechanicTile.getWarehouses()).doesNotContain(warehouseBack);
    }
}
