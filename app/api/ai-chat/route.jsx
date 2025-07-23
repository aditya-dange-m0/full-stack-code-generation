// app/api/ai-chat/route.jsx
// IMPORTANT: Do NOT add "use client" here. API Routes are server-side.

import { chatSession } from "@/configs/AiModel"; // Import the new function
import { NextResponse } from "next/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";
import { StreamingTextResponse } from "ai"; // Import for streaming responses

export async function POST(req) {
  const { prompt, workspaceId, userId } = await req.json();

  console.log("Received /api/ai-chat request: ");
  console.log("workspaceId: ", workspaceId);
  console.log("userId: ", userId);

  // Initialize Convex client
  const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL);

  try {
    // Construct the messages array required by generateChatResponse
    // Assuming the client sends a single 'prompt' string for the user message.
    const messages = [{ role: "user", content: prompt }];

    // Define the model identifier. You can make this dynamic by passing it from the client
    // if you need to switch models based on user input or other logic.
    // const modelIdentifier = "google:gemini-2.0-flash"; // Defaulting to Gemini 1.5 Flash
    // const modelIdentifier = "openrouter:moonshotai/kimi-k2";
    const modelIdentifier = "openrouter:qwen/qwen3-235b-a22b-07-25"
    // Call the new generateChatResponse function
    const result = await chatSession({
      prompt,
      modelIdentifier: modelIdentifier,
    });
    const AIResp = result.text;
    // Extract token usage from the 'result.usage' object provided by ai-sdk
    const promptTokenCount = result.usage?.promptTokens || 0;
    const candidatesTokenCount = result.usage?.completionTokens || 0; // 'completionTokens' is for output tokens

    console.log("--- AI SDK Token Usage ---");
    console.log("Prompt Tokens (Input):", promptTokenCount);
    console.log("Completion Tokens (Output):", candidatesTokenCount);
    console.log("----------------------------");

    // --- Convex Token Update Logic ---
    if (!workspaceId || !userId) {
      console.error(
        "ERROR: Skipping Convex mutation because workspaceId or userId is missing."
      );
      console.error("   workspaceId:", workspaceId);
      console.error("   userId:", userId);
    } else {
      try {
        console.log("Mutation arguments for Convex:", {
          workspaceId,
          inputTokens: promptTokenCount,
          outputTokens: candidatesTokenCount,
        });

        // Call the mutation using Convex client to update token counts
        await convex.mutation(api.workspace.UpdateWorkspaceTokens, {
          workspaceId,
          inputTokens: promptTokenCount,
          outputTokens: candidatesTokenCount,
        });

        console.log(
          "Convex UpdateWorkspaceTokens mutation called successfully!"
        );
      } catch (convexError) {
        // Log the error but do not prevent the AI response from streaming
        console.error(
          "Error calling Convex UpdateWorkspaceTokens mutation:",
          convexError,
          convexError.stack
        );
        // You might want to send this error to a monitoring service as well
      }
    }

    // Return the streaming response directly from the AI SDK result
    return NextResponse.json({ result: AIResp });
  } catch (error) {
    console.error("Error in /api/ai-chat:", error, error.stack);
    return NextResponse.json(
      { error: error.message, stack: error.stack },
      { status: 500 }
    );
  }
}

// import { chatSession } from "@/configs/AiModel";
// import { NextResponse } from "next/server";
// import { ConvexHttpClient } from "convex/browser";
// import { api } from "@/convex/_generated/api"; // Adjust path as needed
// // import { auth } from "@clerk/nextjs/server"; // If using Clerk

// export async function POST(req) {
//   const { prompt, workspaceId, userId } = await req.json();

//   console.log("Received /api/ai-chat request: ");
//   console.log("workspaceId: ", workspaceId);
//   console.log("userId: ", userId);

//   // Initialize Convex client
//   const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL);

//   try {
//     const result = await chatSession.sendMessage(prompt);
//     const AIResp = result.response.text();

//     const usageMetadata = result.response.usageMetadata;
//     const promptTokenCount = Number(usageMetadata?.promptTokenCount) || 0;
//     const candidatesTokenCount = Number(usageMetadata?.candidatesTokenCount) || 0;
//     const totalTokenCount = usageMetadata?.totalTokenCount || (promptTokenCount + candidatesTokenCount);
//     const cachedContentTokenCount = usageMetadata?.cachedContentTokenCount || 0;

//     console.log("--- Gemini API Token Usage ---");
//     console.log("Prompt Tokens (Input):", promptTokenCount);
//     console.log("Candidates Tokens (Output):", candidatesTokenCount);
//     console.log("Cached Content Tokens:", cachedContentTokenCount);
//     console.log("Total Tokens for this call:", totalTokenCount);
//     console.log("----------------------------");

//     if (!workspaceId || !userId) {
//       console.error("ERROR: Skipping Convex mutation because workspaceId or userId is missing.");
//       console.error("  workspaceId:", workspaceId);
//       console.error("  userId:", userId);
//     } else {
//       try {
//         console.log("Mutation arguments:", {
//           workspaceId,
//           inputTokens: promptTokenCount,
//           outputTokens: candidatesTokenCount,
//         });

//         // Call the mutation using Convex client
//         await convex.mutation(api.workspace.UpdateWorkspaceTokens, {
//           workspaceId,
//           inputTokens: promptTokenCount,
//           outputTokens: candidatesTokenCount,
//         });

//         console.log("Convex UpdateWorkspaceTokens mutation called successfully!");
//       } catch (convexError) {
//         console.error("Error calling Convex UpdateWorkspaceTokens mutation:", convexError, convexError.stack);
//         return NextResponse.json(
//           { error: "Failed to update tokens in Convex", details: String(convexError) },
//           { status: 500 }
//         );
//       }
//     }

//     return NextResponse.json({result: AIResp});
//   } catch (error) {
//     console.error("Error in /api/ai-chat:", error, error.stack);
//     return NextResponse.json({ error: error.message, stack: error.stack }, { status: 500 });
//   }
// }

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
