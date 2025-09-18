package com.wmm.app.domain;

import static com.wmm.app.domain.MechanicTileTestSamples.*;
import static com.wmm.app.domain.WarehouseTestSamples.*;
import static org.assertj.core.api.Assertions.assertThat;

import com.wmm.app.web.rest.TestUtil;
import java.util.HashSet;
import java.util.Set;
import org.junit.jupiter.api.Test;

class WarehouseTest {

    @Test
    void equalsVerifier() throws Exception {
        TestUtil.equalsVerifier(Warehouse.class);
        Warehouse warehouse1 = getWarehouseSample1();
        Warehouse warehouse2 = new Warehouse();
        assertThat(warehouse1).isNotEqualTo(warehouse2);

        warehouse2.setId(warehouse1.getId());
        assertThat(warehouse1).isEqualTo(warehouse2);

        warehouse2 = getWarehouseSample2();
        assertThat(warehouse1).isNotEqualTo(warehouse2);
    }

    @Test
    void tilesTest() {
        Warehouse warehouse = getWarehouseRandomSampleGenerator();
        MechanicTile mechanicTileBack = getMechanicTileRandomSampleGenerator();

        warehouse.addTiles(mechanicTileBack);
        assertThat(warehouse.getTiles()).containsOnly(mechanicTileBack);
        assertThat(mechanicTileBack.getWarehouses()).containsOnly(warehouse);

        warehouse.removeTiles(mechanicTileBack);
        assertThat(warehouse.getTiles()).doesNotContain(mechanicTileBack);
        assertThat(mechanicTileBack.getWarehouses()).doesNotContain(warehouse);

        warehouse.tiles(new HashSet<>(Set.of(mechanicTileBack)));
        assertThat(warehouse.getTiles()).containsOnly(mechanicTileBack);
        assertThat(mechanicTileBack.getWarehouses()).containsOnly(warehouse);

        warehouse.setTiles(new HashSet<>());
        assertThat(warehouse.getTiles()).doesNotContain(mechanicTileBack);
        assertThat(mechanicTileBack.getWarehouses()).doesNotContain(warehouse);
    }
}
