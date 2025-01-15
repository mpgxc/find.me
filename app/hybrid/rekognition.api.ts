import { RekognitionClient } from "@aws-sdk/client-rekognition";
import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { RekognitionCollectionManager } from "./rekognition-collection-manager";

const app = new Hono().basePath("/api");

const collectionManager = new RekognitionCollectionManager(
  new RekognitionClient({
    region: "us-east-1",
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
    },
  })
);

app.get("/", (ctx) =>
  ctx.json({
    message: "Welcome to the Photo Album API!",
  })
);

app.post("/collections", async (ctx) => {
  const body = await ctx.req.json<{ collectionId: string }>();
  const { collectionId } = body;

  const { collection } = await collectionManager.createCollection(collectionId);

  if (!collection) {
    return ctx.json({ error: "Collection already exists." }, 400);
  }

  return ctx.json(
    {
      message: `Collection ${collection.CollectionId} created.`,
    },
    201
  );
});

app.get("/collections", async (ctx) => {
  const maxResults = +ctx.req.query("maxResults")! || 10;

  const collections = await collectionManager.listCollections(maxResults);

  return ctx.json(collections);
});

app.get("/collections/:collectionId/faces", async (ctx) => {
  const { collectionId } = ctx.req.param();

  const maxResults = +ctx.req.query("maxResults")! || 10;

  const collection = await collectionManager.fromCollectionId(collectionId);

  const faces = await collection.listFaces(maxResults);

  return ctx.json(faces);
});

app.delete("/collections/:collectionId", async (ctx) => {
  const { collectionId } = ctx.req.param();

  const collection = await collectionManager.fromCollectionId(collectionId);

  await collection.deleteCollection();

  return ctx.json({
    message: `Collection ${collectionId} deleted.`,
  });
});

app.onError((error, ctx) => {
  return ctx.json(
    {
      error: error.message ?? "Internal server error.",
    },
    500
  );
});

app.notFound((ctx) => {
  return ctx.json(
    {
      error: "Not found.",
    },
    404
  );
});

serve(
  {
    fetch: app.fetch.bind(app),
    port: 3000,
  },
  () => console.log("Server running and listening on port 3000.")
);
