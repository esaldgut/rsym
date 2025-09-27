/**
 * Operaciones GraphQL para usar con AWS Amplify v6
 * Queries y Mutations del esquema de AppSync
 */

// QUERIES

export const getAllActiveMoments = /* GraphQL */ `
  query GetAllActiveMoments {
    getAllActiveMoments {
      id
      description
      resourceUrl
      audioUrl
      tags
      preferences
      created_at
      likeCount
      viewerHasLiked
      user_data {
        sub
        username
        name
        avatar_url
      }
      destination {
        place
        placeSub
      }
    }
  }
`;

export const getAllMomentsByUser = /* GraphQL */ `
  query GetAllMomentsByUser {
    getAllMomentsByUser {
      id
      description
      resourceUrl
      audioUrl
      tags
      preferences
      created_at
      likeCount
      viewerHasLiked
      user_data {
        sub
        username
        name
        avatar_url
      }
    }
  }
`;

export const getAllCommentsByMomentID = /* GraphQL */ `
  query GetAllCommentsByMomentID($moment_id: ID!) {
    getAllCommentsByMomentID(moment_id: $moment_id) {
      id
      comment
      created_at
      likeCount
      viewerHasLiked
      user_data {
        username
        name
        avatar_url
      }
    }
  }
`;

export const getAllMarketplaceFeed = /* GraphQL */ `
  query GetAllMarketplaceFeed {
    getAllMarketplaceFeed {
      id
      collection_type
      name
      description
      cover_image_url
      location
      preferences
      product_pricing
      provider_id
      published
      startDate
      followerNumber
      user_data {
        username
        name
        avatar_url
      }
    }
  }
`;

export const getPackageByID = /* GraphQL */ `
  query GetPackageByID($id: ID!) {
    getPackageByID(id: $id) {
      id
      name
      description
      cover_image_url
      image_url
      video_url
      provider_id
      destination {
        place
        placeSub
        coordinates
        complementaryDescription
      }
      origin {
        place
        placeSub
        coordinates
        complementaryDescription
      }
      startDate
      endDate
      included_services
      aditional_services
      prices {
        currency
        price
        roomName
      }
      extraPrices {
        currency
        price
        roomName
      }
      capacity
      numberOfNights
      preferences
      categories
      published
      status
      created_at
    }
  }
`;

export const getAllActivePackagesByProvider = /* GraphQL */ `
  query GetAllActivePackagesByProvider($provider_id: ID!) {
    getAllActivePackagesByProvider(provider_id: $provider_id) {
      id
      name
      description
      cover_image_url
      image_url
      video_url
      provider_id
      destination {
        place
        placeSub
        coordinates
        complementaryDescription
      }
      origin {
        place
        placeSub
        coordinates
        complementaryDescription
      }
      startDate
      endDate
      included_services
      aditional_services
      prices {
        currency
        price
        roomName
      }
      extraPrices {
        currency
        price
        roomName
      }
      capacity
      numberOfNights
      preferences
      categories
      published
      status
      created_at
    }
  }
`;

export const getCircuitByID = /* GraphQL */ `
  query GetCircuitByID($id: ID!) {
    getCircuitByID(id: $id) {
      id
      name
      description
      cover_image_url
      image_url
      video_url
      provider_id
      destination {
        place
        placeSub
        coordinates
      }
      startDate
      endDate
      included_services
      language
      preferences
    }
  }
`;

export const getUserByUsername = /* GraphQL */ `
  query GetUserByUsername($username: String!) {
    getUserByUsername(username: $username) {
      id
      username
      email
      given_name
      family_name
      profile_photo_path
      user_type
      profile_preferences
      have_a_visa
      have_a_passport
    }
  }
`;

export const getProductById = /* GraphQL */ `
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
      created_at
      updated_at
      provider_id
      preferences
      languages
      seasons {
        id
        start_date
        end_date
        category
        allotment
        allotment_remain
        schedules
        number_of_nights
        aditional_services
        prices {
          id
          currency
          price
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
          currency
          price
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
      destination {
        id
        place
        placeSub
        complementary_description
        coordinates {
          latitude
          longitude
        }
      }
      departures {
        specific_dates
        days
        origin {
          id
          place
          placeSub
          complementary_description
          coordinates {
            latitude
            longitude
          }
        }
      }
      itinerary
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
          requirements {
            deadline_days_to_pay
          }
          benefits_or_legal {
            stated
          }
        }
        general_policies {
          change_policy {
            allows_date_chage
            deadline_days_to_make_change
          }
        }
      }
      min_product_price
      is_foreign
    }
  }
`;

// MUTATIONS

export const createMoment = /* GraphQL */ `
  mutation CreateMoment($input: CreateMomentInput!) {
    createMoment(input: $input) {
      id
      description
      resourceUrl
      audioUrl
      tags
      preferences
      created_at
      user_data {
        username
        name
        avatar_url
      }
    }
  }
`;

export const createComment = /* GraphQL */ `
  mutation CreateComment($input: CreateCommentInput!) {
    createComment(input: $input) {
      id
      comment
      created_at
      user_data {
        username
        name
        avatar_url
      }
    }
  }
`;

export const toggleLike = /* GraphQL */ `
  mutation ToggleLike($item_id: ID!, $item_type: String!) {
    toggleLike(item_id: $item_id, item_type: $item_type) {
      success
      newLikeCount
      viewerHasLiked
    }
  }
`;

export const toggleSave = /* GraphQL */ `
  mutation ToggleSave($item_id: ID!, $item_type: String!) {
    toggleSave(item_id: $item_id, item_type: $item_type) {
      success
      newSaveCount
      viewerHasSaved
    }
  }
`;

export const createReservation = /* GraphQL */ `
  mutation CreateReservation($input: ReservationInput!) {
    createReservation(input: $input) {
      id
      kids
      babys
      adults
      price_per_person
      price_per_kid
      total_price
      experience_id
      experience_type
      reservationDate
      status
    }
  }
`;

export const generatePaymentLink = /* GraphQL */ `
  mutation GeneratePaymentLink($input: PaymentInput!) {
    generatePaymentLink(input: $input) {
      id
      reservation_id
      payment_url
      status
      total
      currency
      payment_method
      created_at
    }
  }
`;

// Package Mutations
export const createPackage = /* GraphQL */ `
  mutation CreatePackage($input: CreatePackageInput!) {
    createPackage(input: $input) {
      id
      name
      description
      cover_image_url
      image_url
      video_url
      provider_id
      destination {
        id
        place
        placeSub
        coordinates
        complementaryDescription
      }
      origin {
        id
        place
        placeSub
        coordinates
        complementaryDescription
      }
      startDate
      endDate
      included_services
      aditional_services
      language
      preferences
      categories
      capacity
      numberOfNights
      prices {
        id
        currency
        price
        roomName
      }
      extraPrices {
        id
        currency
        price
        roomName
      }
      published
      status
      created_at
    }
  }
`;

export const updatePackage = /* GraphQL */ `
  mutation UpdatePackage($id: ID!, $input: UpdatePackageInput!) {
    updatePackage(id: $id, input: $input) {
      id
      name
      description
      cover_image_url
      image_url
      video_url
      provider_id
      destination {
        id
        place
        placeSub
        coordinates
        complementaryDescription
      }
      origin {
        id
        place
        placeSub
        coordinates
        complementaryDescription
      }
      startDate
      endDate
      included_services
      aditional_services
      language
      preferences
      categories
      capacity
      numberOfNights
      prices {
        id
        currency
        price
        roomName
      }
      extraPrices {
        id
        currency
        price
        roomName
      }
      published
      status
      created_at
    }
  }
`;

export const deletePackage = /* GraphQL */ `
  mutation DeletePackage($id: ID!) {
    deletePackage(id: $id) {
      id
      name
      status
      created_at
    }
  }
`;



export const updateProduct = /* GraphQL */ `
  mutation UpdateProduct($input: UpdateProductInput!) {
    updateProduct(input: $input) {
      id
      name
      provider_id
      product_type
      preferences
      languages
      description
      cover_image_url
      image_url
      video_url
      seasons {
        id
        category
        start_date
        end_date
        allotment
        allotment_remain
      }
      payment_policy {
        id
        status
      }
      status
      published
      updated_at
    }
  }
`;

// Mutations para creación de productos (esqueleto)
export const createProductOfTypeCircuit = /* GraphQL */ `
  mutation CreateProductOfTypeCircuit($input: CreateProductOfTypeCircuitInput!) {
    createProductOfTypeCircuit(input: $input) {
      id
      name
      product_type
      status
      created_at
    }
  }
`;

export const createProductOfTypePackage = /* GraphQL */ `
  mutation CreateProductOfTypePackage($input: CreateProductOfTypePackageInput!) {
    createProductOfTypePackage(input: $input) {
      id
      name
      product_type
      status
      created_at
    }
  }
`;

// Provider Products Queries
export const getAllProductsByEmail = /* GraphQL */ `
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

export const getAllActiveProductsByProvider = /* GraphQL */ `
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

export const getProductsByType = /* GraphQL */ `
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