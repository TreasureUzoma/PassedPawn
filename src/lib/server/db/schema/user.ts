import { pgTable, serial, pgEnum, uuid } from 'drizzle-orm/pg-core';

export const userAuthMethodEnum = pgEnum('user_auth_method', ['email', 'google']);
export const userRoleEnum = pgEnum('user_role', ['user', 'admin']);
export const userSubscriptionEnum = pgEnum('user_subscription', ['free', 'pro']);
export const userStatusEnum = pgEnum('user_status', ['active', 'inactive', 'banned']);

export const users = pgTable('users', {
	serial: serial('serial').primaryKey(),
	id: uuid('id').defaultRandom().notNull().unique(),
	authMethod: userAuthMethodEnum('auth_method'),
	role: userRoleEnum('role'),
	subscription: userSubscriptionEnum('subscription'),
	status: userStatusEnum('status').default('active')
});
