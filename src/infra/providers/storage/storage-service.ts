import { Result } from '../../../common/logic'

export type StorageRetrieveObjectProps = {
  key: string
  isBase64?: boolean
}

export interface StorageService {
  retrieveObject(
    props: StorageRetrieveObjectProps,
  ): Promise<Result<Buffer | string, Error>>
}
