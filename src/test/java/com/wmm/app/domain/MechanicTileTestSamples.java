package com.wmm.app.domain;

import java.util.Random;
import java.util.UUID;
import java.util.concurrent.atomic.AtomicLong;

public class MechanicTileTestSamples {

    private static final Random random = new Random();
    private static final AtomicLong longCount = new AtomicLong(random.nextInt() + (2 * Integer.MAX_VALUE));

    public static MechanicTile getMechanicTileSample1() {
        return new MechanicTile().id(1L).title("title1").comment("comment1").materialCode("materialCode1").imageUrl("imageUrl1");
    }

    public static MechanicTile getMechanicTileSample2() {
        return new MechanicTile().id(2L).title("title2").comment("comment2").materialCode("materialCode2").imageUrl("imageUrl2");
    }

    public static MechanicTile getMechanicTileRandomSampleGenerator() {
        return new MechanicTile()
            .id(longCount.incrementAndGet())
            .title(UUID.randomUUID().toString())
            .comment(UUID.randomUUID().toString())
            .materialCode(UUID.randomUUID().toString())
            .imageUrl(UUID.randomUUID().toString());
    }
}
