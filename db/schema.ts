import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const progress = sqliteTable("progress", {
  markerId: text("marker_id").primaryKey(),
  completed: integer("completed", { mode: "boolean" }).notNull().default(true),
  updatedAt: text("updated_at").notNull(),
});
