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
      capacity
      numberOfNights
      preferences
      categories
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