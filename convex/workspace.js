import { v } from 'convex/values';
import { mutation, query } from './_generated/server';

export const CreateWorkspace = mutation({
  args: {
    messages: v.any(),
    user: v.id('users'),
  },
  handler: async (ctx, args) => {
    const workspaceId = await ctx.db.insert('workspace', {
      messages: args.messages,
      user: args.user,
      inputTokensTotal: 0, // Initialize to 0 for a new workspace
      outputTokensTotal: 0, // Initialize to 0 for a new workspace
    });
    return workspaceId;
  },
});

export const GetWorkspace = query({
  args: {
    workspaceId: v.id('workspace'),
  },
  handler: async (ctx, args) => {
    const result = await ctx.db.get(args.workspaceId);
    return result;
  },
});

export const UpdateMessages = mutation({
  args: {
    workspaceId: v.id('workspace'),
    messages: v.any(),
  },
  handler: async (ctx, args) => {
    const result = await ctx.db.patch(args.workspaceId, {
      messages: args.messages,
    });
    return result;
  },
});

export const UpdateFiles = mutation({
  args: {
    workspaceId: v.id('workspace'),
    files: v.any(),
  },
  handler: async (ctx, args) => {
    const result = await ctx.db.patch(args.workspaceId, {
      fileData: args.files,
    });
    return result;
  },
});

export const GetAllWorkspace = query({
  args: {
    userId: v.id('users'),
  },
  handler: async (ctx, args) => {
    const result = await ctx.db
      .query('workspace')
      .filter((q) => q.eq(q.field('user'), args.userId))
      .collect();

    return result;
  },
});


export const UpdateUserTotalTokens = mutation({
  args: {
    userId: v.id('users'),
    tokensToAdd: v.number(),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user) {
      throw new Error('User not found');
    }
    const updatedTokens = (user.usedTokensTillNow || 0) + args.tokensToAdd;
    await ctx.db.patch(args.userId, {
      usedTokensTillNow: updatedTokens,
    });
    return { success: true };
  },
});


export const UpdateWorkspaceTokens = mutation({
  args: {
    workspaceId: v.id('workspace'),
    inputTokens: v.number(),
    outputTokens: v.number(),
  },
  handler: async (ctx, args) => {
    const workspace = await ctx.db.get(args.workspaceId);
    if (!workspace) {
      throw new Error('Workspace not found');
    }

    // Safely add to existing totals, defaulting to 0 if undefined
    const updatedInputTokens = (workspace.inputTokensTotal || 0) + args.inputTokens;
    const updatedOutputTokens = (workspace.outputTokensTotal || 0) + args.outputTokens;

    await ctx.db.patch(args.workspaceId, {
      inputTokensTotal: updatedInputTokens,
      outputTokensTotal: updatedOutputTokens,
    });

    // Initialize outside
    let updatedUserTokens = null;

    // Also update the user's total tokens
    const user = await ctx.db.get(workspace.user);
    if (user) {
      updatedUserTokens = (user.usedTokensTillNow || 0) + args.inputTokens + args.outputTokens;
      await ctx.db.patch(user._id, {
        usedTokensTillNow: updatedUserTokens,
      });
    }

    return { success: true, updatedInputTokens, updatedOutputTokens, updatedUserTokens }; // Return for debugging
  },
});


