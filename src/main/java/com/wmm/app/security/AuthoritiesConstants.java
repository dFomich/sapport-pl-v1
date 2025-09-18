package com.wmm.app.security;

/**
 * Constants for Spring Security authorities.
 */
public final class AuthoritiesConstants {

    public static final String ADMIN = "ROLE_ADMIN";

    public static final String USER = "ROLE_USER";

    public static final String ANONYMOUS = "ROLE_ANONYMOUS";

    public static final String WAREHOUSEMAN = "ROLE_WAREHOUSEMAN";
    public static final String SENIOR_WAREHOUSEMAN = "ROLE_SENIOR_WAREHOUSEMAN";
    public static final String MECHANIC = "ROLE_MECHANIC";
    public static final String SENIOR_MECHANIC = "ROLE_SENIOR_MECHANIC";
    public static final String MANAGER = "ROLE_MANAGER";
    public static final String SENIOR_MANAGER = "ROLE_SENIOR_MANAGER";

    private AuthoritiesConstants() {}
}
