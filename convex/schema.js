// convex/schema.js
import { defineSchema, defineTable } from 'convex/server';
import { v } from 'convex/values';

export default defineSchema({
  users: defineTable({
    name: v.string(),
    email: v.string(),
    picture: v.string(),
    uid: v.string(),
    token: v.optional(v.number()),
    usedTokensTillNow: v.optional(v.number()), // Keep as optional
  }),
  workspace: defineTable({
    messages: v.any(), // JSON OBJECT
    fileData: v.optional(v.any()),
    user: v.id('users'),
    inputTokensTotal: v.optional(v.number()), // Changed to optional
    outputTokensTotal: v.optional(v.number()), // Changed to optional
  }),
});