/**
 * GraphQL queries for provider products management
 * Supporting pagination, filtering, and metrics
 */

export const GET_PROVIDER_PRODUCTS = /* GraphQL */ `
  query GetAllProductsByEmail($pagination: PaginationInput, $filter: ProductFilterInput) {
    getAllProductsByEmail(pagination: $pagination, filter: $filter) {
      items {
        id
        name
        description
        product_type
        status
        published
        cover_image_url
        created_at
        updated_at
        seasons {
          id
          start_date
          end_date
          category
          allotment
          allotment_remain
        }
        destination {
          place
          placeSub
        }
        min_product_price
      }
      nextToken
      total
    }
  }
`;

export const GET_PROVIDER_PRODUCTS_BY_PROVIDER = /* GraphQL */ `
  query GetAllActiveProductsByProvider($pagination: PaginationInput, $filter: ProductFilterInput) {
    getAllActiveProductsByProvider(pagination: $pagination, filter: $filter) {
      items {
        id
        name
        description
        product_type
        status
        published
        cover_image_url
        created_at
        updated_at
        seasons {
          id
          start_date
          end_date
          category
          allotment
          allotment_remain
        }
        destination {
          place
          placeSub
        }
        min_product_price
      }
      nextToken
      total
    }
  }
`;

export const GET_PRODUCTS_BY_TYPE = /* GraphQL */ `
  query GetProductsByType($product_type: String!, $pagination: PaginationInput, $filter: ProductFilterInput) {
    getProductsByType(product_type: $product_type, pagination: $pagination, filter: $filter) {
      items {
        id
        name
        description
        product_type
        status
        published
        cover_image_url
        created_at
        updated_at
        seasons {
          id
          start_date
          end_date
          category
          allotment
          allotment_remain
        }
        destination {
          place
          placeSub
        }
        min_product_price
      }
      nextToken
      total
    }
  }
`;

export const GET_PRODUCT_METRICS = /* GraphQL */ `
  query GetProductMetrics {
    getAllProductsByEmail(pagination: { limit: 1000 }) {
      items {
        id
        status
        published
        product_type
        created_at
      }
      total
    }
  }
`;