package com.wmm.app.domain;

import java.util.Random;
import java.util.UUID;
import java.util.concurrent.atomic.AtomicLong;

public class WarehouseTestSamples {

    private static final Random random = new Random();
    private static final AtomicLong longCount = new AtomicLong(random.nextInt() + (2 * Integer.MAX_VALUE));

    public static Warehouse getWarehouseSample1() {
        return new Warehouse().id(1L).code("code1").name("name1");
    }

    public static Warehouse getWarehouseSample2() {
        return new Warehouse().id(2L).code("code2").name("name2");
    }

    public static Warehouse getWarehouseRandomSampleGenerator() {
        return new Warehouse().id(longCount.incrementAndGet()).code(UUID.randomUUID().toString()).name(UUID.randomUUID().toString());
    }
}
