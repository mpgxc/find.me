import {
  RekognitionClient,
  SearchFacesByImageCommand,
} from "@aws-sdk/client-rekognition";
import { serve } from "@hono/node-server";
import type { Context, Next } from "hono";
import { Hono } from "hono";

const rekognitionClient = new RekognitionClient({
  region: "us-east-1",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

const MAX_FILE_SIZE = 5 * 1024 * 1024;

export const uploadMiddleware = async (ctx: Context, next: Next) => {
  try {
    const content = await ctx.req.blob();

    if (!content.size) {
      return ctx.json({ message: "File is empty" }, 400);
    }

    if (content.size >= MAX_FILE_SIZE) {
      return ctx.json({ message: "File too large, max size is 5MB" }, 413);
    }

    await next();
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "An unexpected error occurred";
    return ctx.json({ message }, 500);
  }
};

const COLLECTION_ID = process.env.REKOGNITION_COLLECTION!;

const app = new Hono();

app.get("/", (c) =>
  c.json({
    message: "Hello, human! 🦆 You are so far from home",
  })
);

app.notFound((c) =>
  c.json(
    {
      error: "Not Found 🦆",
    },
    404
  )
);

app.post("/upload", async (ctx) => {
  const body = await ctx.req.parseBody();
  const file = body["file"] as File;

  try {
    const searchFacesOutput = await searchFacesByImage(COLLECTION_ID, file);

    const matchedImages =
      searchFacesOutput.FaceMatches?.map(
        (face) => face.Face?.ExternalImageId
      ) || [];

    return ctx.json({
      message: "Imagem processada com sucesso!",
      matched_images: matchedImages,
    });
  } catch (e) {
    const error = e as Error;

    console.error(`Erro ao processar a imagem: ${error}`);

    return ctx.json(
      {
        message: "Erro ao processar a imagem",
        error: error.message,
      },
      500
    );
  }
});

const searchFacesByImage = async (collectionId: string, file: File) => {
  const command = new SearchFacesByImageCommand({
    CollectionId: collectionId,
    Image: {
      Bytes: await file.bytes(),
    },
    FaceMatchThreshold: 90,
    MaxFaces: 1,
  });

  return rekognitionClient.send(command);
};

// export const handler = handle(app);

serve(
  {
    fetch: app.fetch,
    port: 4000,
  },
  () => {
    console.log("Server is running on port 4000");
  }
);
