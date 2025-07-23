// app/api/gen-ai-code/route.jsx
import { GenAiCode } from "@/configs/AiModel";
import { NextResponse } from "next/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api"; // Adjust path as needed
// import { auth } from "@clerk/nextjs/server"; // If using Clerk

export async function POST(req) {
  const { prompt, workspaceId, userId } = await req.json();

  console.log("Received /api/gen-ai-code request:");
  console.log("  workspaceId:", workspaceId);
  console.log("  userId:", userId);

  // Initialize Convex client
  const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL);
  // const modelIdentifier = "google:gemini-2.0-flash";
  // const modelIdentifier = "openrouter:moonshotai/kimi-k2";
  const modelIdentifier = "openrouter:qwen/qwen3-235b-a22b-07-25"

  try {
    const result = await GenAiCode({
      prompt,
      modelIdentifier: modelIdentifier,
    });

    console.log("result : ", result);
    let resp = result.text;

    const usageMetadata = result.response.usageMetadata;
    const promptTokenCount = Number(usageMetadata?.promptTokenCount) || 0;
    const candidatesTokenCount =
      Number(usageMetadata?.candidatesTokenCount) || 0;
    const totalTokenCount =
      usageMetadata?.totalTokenCount || promptTokenCount + candidatesTokenCount;
    const cachedContentTokenCount = usageMetadata?.cachedContentTokenCount || 0;

    console.log("--- Gemini API Token Usage (GenAI Code) ---");
    console.log("Prompt Tokens (Input):", promptTokenCount);
    console.log("Candidates Tokens (Output):", candidatesTokenCount);
    console.log("Cached Content Tokens:", cachedContentTokenCount);
    console.log("Total Tokens for this call:", totalTokenCount);
    console.log("-----------------------------------------");

    if (!workspaceId || !userId) {
      console.error(
        "ERROR: Skipping Convex mutation because workspaceId or userId is missing."
      );
      console.error("  workspaceId:", workspaceId);
      console.error("  userId:", Id);
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

        console.log(
          "Convex UpdateWorkspaceTokens mutation called successfully!"
        );
      } catch (convexError) {
        console.error(
          "Error calling Convex UpdateWorkspaceTokens mutation:",
          convexError,
          convexError.stack
        );
        return NextResponse.json(
          {
            error: "Failed to update tokens in Convex",
            details: String(convexError),
          },
          { status: 500 }
        );
      }
    }
    // Clean the response - remove markdown code blocks if present
    if (resp.includes("```json")) {
      resp = resp.replace(/```json\n?/g, "").replace(/\n?```/, "");
    } else if (resp.includes("```")) {
      resp = resp.replace(/```\n?/g, "").replace(/\n?```/, "");
    }

    // Trim any extra whitespace
    resp = resp.trim();

    const parsedResp = JSON.parse(resp);
    return NextResponse.json(parsedResp);

    // return NextResponse.json(JSON.parse(resp));
  } catch (error) {
    console.error("Error in /api/gen-ai-chat:", error, error.stack);
    return NextResponse.json(
      { error: error.message, stack: error.stack },
      { status: 500 }
    );
  }
}
// import { GenAiCode } from "@/configs/AiModel";
// import { NextResponse } from "next/server";
// import { api } from "@/convex/_generated/api"; // Adjust path as per your project structure

// export async function POST(req) {
//     const { prompt, workspaceId, userId } = await req.json();

//     console.log("Received /api/gen-ai-code request:");
//     console.log("  workspaceId received:", workspaceId);
//     console.log("  userId received:", userId);

//     try {
//         const result = await GenAiCode.sendMessage(prompt);
//         const resp = result.response.text();

//         const usageMetadata = result.response.usageMetadata;
//         const promptTokenCount = usageMetadata?.promptTokenCount || 0;
//         const candidatesTokenCount = usageMetadata?.candidatesTokenCount || 0;
//         const totalTokenCount = usageMetadata?.totalTokenCount || (promptTokenCount + candidatesTokenCount);
//         const cachedContentTokenCount = usageMetadata?.cachedContentTokenCount || 0;

//         console.log("--- Gemini API Token Usage (GenAI Code) ---");
//         console.log("Prompt Tokens (Input):", promptTokenCount);
//         console.log("Candidates Tokens (Output):", candidatesTokenCount);
//         console.log("Cached Content Tokens:", cachedContentTokenCount);
//         console.log("Total Tokens for this call:", totalTokenCount);
//         console.log("-----------------------------------------");

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

//         return NextResponse.json({resp:resp,usageMetadata,promptTokenCount,candidatesTokenCount,totalTokenCount,cachedContentTokenCount});
//     } catch (error) {
//         console.error("Error in /api/gen-ai-code:", error);
//         return NextResponse.json({ error: error.message, stack: error.stack }, { status: 500 });
//     }
// }
