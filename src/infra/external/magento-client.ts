import axios, { AxiosInstance } from 'axios'
import { ExternalException } from '../../common/application-error'
import { HttpStatusCode } from '../../common/enums'
import { Result } from '../../common/logic'
import { MediaEntry, Product } from '../../common/types'
import { environment } from '../environment'
import { buildAuthorizationHeaderToken } from './magento-oauth'

type ImageUploadInput = {
  position: number
  sku: string
  image: string
  name: string
}

type RemoveImageInput = {
  sku: string
  entry: MediaEntry
  position: number
}

export class Magento2Client {
  private client: AxiosInstance

  constructor() {
    this.client = axios.create({
      baseURL: environment.M2_API_ENDPOINT,
      timeout: 180000, // 3 minutes
    })
  }

  /**
   * Retries a method a given number of times.
   * @description This method is used to retry a given method a given number of times.
   * But this approach is not better way to handle retries, because it's a blocking IO approach.
   * @TODO: Implement a better approach to handle retries.
   */
  async retryMethod(
    retries: number,
    cb: () => Promise<void>,
    cbName?: string,
  ): Promise<Result<unknown, Error>> {
    try {
      let attempt = 0

      while (attempt < retries) {
        try {
          await cb()

          return Result.Ok()
        } catch (error) {
          attempt += 1

          console.warn(`Magento2Client: ${cbName} failed! Attempt <${attempt}>`)
        }
      }

      console.error(
        `Magento2Client: ${cbName} failed after <${retries}> attempts!`,
      )

      return Result.Err(new Error('Max retries reached'))
    } catch (e) {
      const error = e as Error

      console.error(
        `Magento2Client: Unexpected error retrying method: ${error.message}`,
      )

      return Result.Err(error)
    }
  }

  async getProductByCode(megaErpCode: string): Promise<Result<Product, Error>> {
    try {
      const filters = {
        field:
          'searchCriteria[filterGroups][0][filters][0][field]=mega_erp_code',
        value: '&searchCriteria[filterGroups][0][filters][0][value]=',
      }

      const url = `/products?${filters.field}${filters.value}${megaErpCode}`

      const response = await this.client.get<Product>(url, {
        headers: {
          Authorization: buildAuthorizationHeaderToken('GET', url),
        },
      })

      if (response.status !== HttpStatusCode.OK) {
        throw new Error(
          `Magento2Client: Error verifying product code. Status: ${response.status}`,
        )
      }

      return Result.Ok(response.data)
    } catch (e) {
      const error = e as Error

      console.error(
        `Magento2Client: Unexpected error getting product by code: ${error.message}`,
      )

      return Result.Err(error)
    }
  }

  async removeProductImage({
    sku,
    entry,
    position,
  }: RemoveImageInput): Promise<Result<unknown, Error>> {
    try {
      const url = `/products/${encodeURIComponent(sku)}/media/${entry.id}`

      const response = await this.client.delete(url, {
        headers: {
          Authorization: buildAuthorizationHeaderToken('DELETE', url),
        },
      })

      if (
        ![HttpStatusCode.OK, HttpStatusCode.NO_CONTENT].includes(
          response.status,
        )
      ) {
        throw new Error(
          `Magento2Client: Error removing product image. Status: ${response.status}`,
        )
      }

      console.info(
        `Magento2Client: Product <${sku}> image at position <${position}> removed!`,
      )

      return Result.Ok()
    } catch (e) {
      const error = e as Error

      console.error(
        `Magento2Client: Unexpected error removing product image: ${error.message}`,
      )

      return Result.Err(error)
    }
  }

  async uploadProductImage({
    position,
    sku,
    image,
    name,
  }: ImageUploadInput): Promise<Result<unknown, Error>> {
    try {
      const url = `/products/${encodeURIComponent(sku)}/media`

      const types = position === 0 ? ['image', 'small_image', 'thumbnail'] : []

      const formatedName = name
        .toLowerCase()
        .replace(/[\s-]+/g, '_')
        .replace(/[^a-z0-9\._]/g, '')

      const [firstLetter, secondLetter] = formatedName
      const file = `/${firstLetter}/${secondLetter}/${formatedName}_${position}.jpg`

      const entry = {
        file,
        types,
        position,
        disabled: false,
        media_type: 'image',
        content: {
          type: 'image/jpeg',
          name: `${formatedName}_${position}.jpg`,
          base64_encoded_data: image,
        },
      }

      const response = await this.client.post(
        url,
        { entry },
        {
          headers: {
            Authorization: buildAuthorizationHeaderToken('POST', url),
          },
        },
      )

      if (
        ![HttpStatusCode.OK, HttpStatusCode.CREATED].includes(response.status)
      ) {
        throw new Error(
          `Magento2Client: Error uploading product image. Status: ${response.status}`,
        )
      }

      console.info(
        `Magento2Client: Product <${sku}> image at position <${position}> uploaded!`,
      )

      return Result.Ok()
    } catch (e) {
      const error = e as ExternalException

      const details = error.response.data

      console.error(
        `Magento2Client: Unexpected error uploading product image: ${error.message} > ${details?.message ?? ''}`,
      )

      return Result.Err(error)
    }
  }
}
