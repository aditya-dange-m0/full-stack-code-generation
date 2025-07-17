// app/api/ai-chat/route.jsx
// IMPORTANT: Do NOT add "use client" here. API Routes are server-side.

import { chatSession } from "@/configs/AiModel";
import { NextResponse } from "next/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api"; // Adjust path as needed
// import { auth } from "@clerk/nextjs/server"; // If using Clerk

export async function POST(req) {
  const { prompt, workspaceId, userId } = await req.json();

  console.log("Received /api/ai-chat request:");
  console.log("  workspaceId:", workspaceId);
  console.log("  userId:", userId);

  // Initialize Convex client
  const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL);


  try {
    const result = await chatSession.sendMessage(prompt);
    const AIResp = result.response.text();

    const usageMetadata = result.response.usageMetadata;
    const promptTokenCount = Number(usageMetadata?.promptTokenCount) || 0;
    const candidatesTokenCount = Number(usageMetadata?.candidatesTokenCount) || 0;
    const totalTokenCount = usageMetadata?.totalTokenCount || (promptTokenCount + candidatesTokenCount);
    const cachedContentTokenCount = usageMetadata?.cachedContentTokenCount || 0;

    console.log("--- Gemini API Token Usage ---");
    console.log("Prompt Tokens (Input):", promptTokenCount);
    console.log("Candidates Tokens (Output):", candidatesTokenCount);
    console.log("Cached Content Tokens:", cachedContentTokenCount);
    console.log("Total Tokens for this call:", totalTokenCount);
    console.log("----------------------------");

    if (!workspaceId || !userId) {
      console.error("ERROR: Skipping Convex mutation because workspaceId or userId is missing.");
      console.error("  workspaceId:", workspaceId);
      console.error("  userId:", userId);
    } else {
      try {
        console.log("Mutation arguments:", {
          workspaceId,
          inputTokens: promptTokenCount,
          outputTokens: candidatesTokenCount,
        });

        // Call the mutation using Convex client
        await convex.mutation(api.workspace.UpdateWorkspaceTokens, {
          workspaceId,
          inputTokens: promptTokenCount,
          outputTokens: candidatesTokenCount,
        });

        console.log("Convex UpdateWorkspaceTokens mutation called successfully!");
      } catch (convexError) {
        console.error("Error calling Convex UpdateWorkspaceTokens mutation:", convexError, convexError.stack);
        return NextResponse.json(
          { error: "Failed to update tokens in Convex", details: String(convexError) },
          { status: 500 }
        );
      }
    }

    return NextResponse.json({result: AIResp});
  } catch (error) {
    console.error("Error in /api/ai-chat:", error, error.stack);
    return NextResponse.json({ error: error.message, stack: error.stack }, { status: 500 });
  }
}
// import { chatSession } from "@/configs/AiModel";
// import { NextResponse } from "next/server";
// import { api } from "../../../convex/_generated/api"; // Adjust path as per your project structure

// export async function POST(req) {
//     const { prompt, workspaceId, userId } = await req.json();

//     console.log("Received /api/ai-chat request:");
//     console.log("  workspaceId received:", workspaceId);
//     console.log("  userId received:", userId);

//     try {
//         const result = await chatSession.sendMessage(prompt);
//         const AIResp = result.response.text();

//         const usageMetadata = result.response.usageMetadata;
//         const promptTokenCount = usageMetadata?.promptTokenCount || 0;
//         const candidatesTokenCount = usageMetadata?.candidatesTokenCount || 0;
//         const totalTokenCount = usageMetadata?.totalTokenCount || (promptTokenCount + candidatesTokenCount);
//         const cachedContentTokenCount = usageMetadata?.cachedContentTokenCount || 0;

//         console.log("--- Gemini API Token Usage ---");
//         console.log("Prompt Tokens (Input):", promptTokenCount);
//         console.log("Candidates Tokens (Output):", candidatesTokenCount);
//         console.log("Cached Content Tokens:", cachedContentTokenCount);
//         console.log("Total Tokens for this call:", totalTokenCount);
//         console.log("----------------------------");

//         if (!workspaceId || !userId) {
//             console.error("ERROR: Skipping Convex mutation because workspaceId or userId is missing.");
//             console.error("  workspaceId:", workspaceId);
//             console.error("  userId:", userId);
//         } else {
//             try {
//                 // THIS IS THE CORRECT WAY TO CALL A CONVEX MUTATION IN AN API ROUTE
//                 // Make sure 'workspace' is the correct name of your Convex file (e.g., convex/workspace.js)
//                 await api.workspace.UpdateWorkspaceTokens({ 
//                     workspaceId: workspaceId,
//                     inputTokens: promptTokenCount,
//                     outputTokens: candidatesTokenCount,
//                 });
//                 console.log("Convex UpdateWorkspaceTokens mutation called successfully!");
//             } catch (convexError) {
//                 console.error("Error calling Convex UpdateWorkspaceTokens mutation:", convexError);
//                 return NextResponse.json({ error: "Failed to update tokens in Convex", details: String(convexError) }, { status: 500 });
//             }
//         }

//         return NextResponse.json({ result: AIResp,usageMetadata,promptTokenCount,candidatesTokenCount,totalTokenCount,cachedContentTokenCount });
//     } catch (error) {
//         console.error("Error in /api/ai-chat:", error);
//         return NextResponse.json({ error: error.message, stack: error.stack }, { status: 500 });
//     }
// }