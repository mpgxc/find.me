import {
  Face,
  FaceMatch,
  ListCollectionsCommand,
  ListFacesCommand,
  RekognitionClient,
  SearchFacesCommand,
} from "@aws-sdk/client-rekognition";

const collectionId = "infra-face-rekognition-sls-dev-collection";

const client = new RekognitionClient({
  region: "us-east-1",
});

async function listFacesInCollection(collectionId: string): Promise<Face[]> {
  const command = new ListFacesCommand({
    CollectionId: collectionId,
  });

  const { Faces } = await client.send(command);

  return Faces?.length ? Faces : [];
}

async function listCollections(): Promise<string[]> {
  const command = new ListCollectionsCommand();

  const { CollectionIds } = await client.send(command);

  return CollectionIds || [];
}

async function faceSearchByFaceId(
  FaceId: string,
  CollectionId: string
): Promise<FaceMatch[]> {
  const command = new SearchFacesCommand({
    FaceId,
    CollectionId,
    FaceMatchThreshold: 90,
  });

  const { FaceMatches } = await client.send(command);

  if (!FaceMatches?.length) {
    return [];
  }

  return FaceMatches;
}

(async () => {
  {
    /*
      const output = await listCollections();

      const output = await listFacesInCollection(collectionId);

      const output = await faceSearchByFaceId(
        "6a643cfb-b90c-4039-ad43-bef026ee54c9",
        collectionId
      );

      console.table(output);
    */
  }
})();
