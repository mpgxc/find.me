import {
  CreateCollectionCommand,
  DeleteCollectionCommand,
  DescribeCollectionCommand,
  Face,
  ListCollectionsCommand,
  ListFacesCommand,
  RekognitionClient,
} from "@aws-sdk/client-rekognition";

type CollectionInfo = {
  CollectionId: string;
  CollectionArn?: string;
  FaceCount?: number;
  CreationTimestamp?: string;
};

type DescribeCollectionResponse = {
  CollectionId: string;
  FaceCount?: number;
  CollectionARN?: string;
  CreationTimestamp?: Date;
  FaceModelVersion?: string;
  extendedRequestId?: string;
  requestId?: string;
  cfId?: string;
};

export class RekognitionCollectionManager {
  constructor(private readonly client: RekognitionClient) {}

  async createCollection(CollectionId: string): Promise<RekognitionCollection> {
    const command = new CreateCollectionCommand({
      CollectionId,
      Tags: {
        Name: CollectionId,
        Description: `Collection for storing faces for ${CollectionId}.`,
      },
    });

    const { CollectionArn } = await this.client.send(command);

    return new RekognitionCollection(
      {
        CollectionId,
        CollectionArn,
      },
      this.client
    );
  }

  async listCollections(MaxResults: number): Promise<RekognitionCollection[]> {
    const command = new ListCollectionsCommand({ MaxResults });
    const { CollectionIds } = await this.client.send(command);

    return (CollectionIds || []).map(
      (CollectionId: string) =>
        new RekognitionCollection({ CollectionId }, this.client)
    );
  }

  async fromCollectionId(CollectionId: string): Promise<RekognitionCollection> {
    return new RekognitionCollection(
      {
        CollectionId,
      },
      this.client
    );
  }
}

export class RekognitionCollection {
  constructor(
    public readonly collection: CollectionInfo,
    private readonly client: RekognitionClient
  ) {}

  async describeCollection(): Promise<DescribeCollectionResponse> {
    const command = new DescribeCollectionCommand({
      CollectionId: this.collection.CollectionId,
    });

    const {
      FaceCount,
      CollectionARN,
      FaceModelVersion,
      CreationTimestamp,
      $metadata: { extendedRequestId, requestId, cfId },
    } = await this.client.send(command);

    return {
      CollectionId: this.collection.CollectionId,
      FaceCount,
      CollectionARN,
      CreationTimestamp,
      FaceModelVersion,
      extendedRequestId,
      requestId,
      cfId,
    };
  }

  async deleteCollection(): Promise<void> {
    const command = new DeleteCollectionCommand({
      CollectionId: this.collection.CollectionId,
    });

    await this.client.send(command);
  }

  async listFaces(maxResults: number): Promise<Face[]> {
    const command = new ListFacesCommand({
      CollectionId: this.collection.CollectionId,
      MaxResults: maxResults,
    });

    const { Faces } = await this.client.send(command);

    return Faces || [];
  }
}
