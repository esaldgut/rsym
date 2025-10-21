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

export const GET_PRODUCT_BY_ID = /* GraphQL */ `
  query GetProductById($id: ID!) {
    getProductById(id: $id) {
      id
      name
      description
      product_type
      status
      published
      cover_image_url
      image_url
      video_url
      preferences
      languages
      created_at
      updated_at
      provider_id
      destination {
        place
        placeSub
        complementary_description
        coordinates {
          latitude
          longitude
        }
      }
      departures {
        origin {
          place
          placeSub
          complementary_description
          coordinates {
            latitude
            longitude
          }
        }
        days
        specific_dates
      }
      itinerary
      seasons {
        id
        start_date
        end_date
        category
        allotment
        allotment_remain
        number_of_nights
        schedules
        aditional_services
        prices {
          id
          price
          currency
          room_name
          max_adult
          max_minor
          children {
            name
            min_minor_age
            max_minor_age
            child_price
          }
        }
        extra_prices {
          id
          price
          currency
          room_name
          max_adult
          max_minor
          children {
            name
            min_minor_age
            max_minor_age
            child_price
          }
        }
      }
      planned_hotels_or_similar
      payment_policy {
        id
        product_id
        provider_id
        status
        version
        created_at
        updated_at
        options {
          type
          description
          config {
            cash {
              discount
              discount_type
              deadline_days_to_pay
              payment_methods
            }
            installments {
              down_payment_before
              down_payment_type
              down_payment_after
              installment_intervals
              days_before_must_be_settled
              deadline_days_to_pay
              payment_methods
            }
          }
          benefits_or_legal {
            stated
          }
        }
        general_policies {
          change_policy {
            allows_date_change
            deadline_days_to_make_change
          }
        }
      }
      min_product_price
      is_foreign
      user_data {
        sub
        username
        name
        avatar_url
        email
        user_type
      }
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
