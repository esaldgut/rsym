// Queries para el marketplace
export const GET_ALL_MARKETPLACE_FEED = `
  query GetAllMarketplaceFeed {
    getAllMarketplaceFeed {
      id
      name
      description
      cover_image_url
      avatarUrl
      username
      location
      price
      startDate
      preferences
      collection_type
      provider_id
      published
      followerNumber
    }
  }
`;

export const GET_MARKETPLACE_FEED_BY_LOCATION = `
  query GetMarketplaceFeedByLocation($coordinates: [Float]) {
    getAllMarketplaceFeedByLocation(coordinates: $coordinates) {
      id
      name
      description
      cover_image_url
      avatarUrl
      username
      location
      price
      startDate
      preferences
      collection_type
      provider_id
      published
      followerNumber
    }
  }
`;

// Queries para circuits
export const GET_ALL_ACTIVE_CIRCUITS = `
  query GetAllActiveCircuits {
    getAllActiveCircuits {
      id
      name
      description
      cover_image_url
      image_url
      video_url
      startDate
      endDate
      preferences
      language
      included_services
      provider_id
      published
      status
      created_at
      destination {
        id
        place
        placeSub
        coordinates
        complementaryDescription
      }
      seassons {
        id
        startDate
        endDate
        capacity
        schedules
        categories
        prices {
          id
          price
          currency
          roomName
        }
      }
    }
  }
`;

export const GET_CIRCUITS_BY_PROVIDER = `
  query GetCircuitsByProvider($provider_id: ID!) {
    getAllActiveCircuitsByProvider(provider_id: $provider_id) {
      id
      name
      description
      cover_image_url
      image_url
      startDate
      endDate
      preferences
      language
      included_services
      published
      status
      created_at
      destination {
        place
        placeSub
        coordinates
      }
    }
  }
`;

// Queries para packages
export const GET_ALL_ACTIVE_PACKAGES = `
  query GetAllActivePackages {
    getAllActivePackages {
      id
      name
      description
      cover_image_url
      image_url
      video_url
      startDate
      endDate
      numberOfNights
      capacity
      categories
      preferences
      language
      included_services
      aditional_services
      provider_id
      published
      status
      created_at
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
      }
      prices {
        id
        price
        currency
        roomName
      }
      extraPrices {
        id
        price
        currency
        roomName
      }
    }
  }
`;

export const GET_PACKAGE_BY_ID = `
  query GetPackageByID($id: ID!) {
    getPackageByID(id: $id) {
      id
      name
      description
      cover_image_url
      image_url
      video_url
      startDate
      endDate
      numberOfNights
      capacity
      categories
      preferences
      language
      included_services
      aditional_services
      provider_id
      published
      status
      created_at
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
      }
      prices {
        id
        price
        currency
        roomName
      }
      extraPrices {
        id
        price
        currency
        roomName
      }
    }
  }
`;

// Queries para moments
export const GET_ALL_ACTIVE_MOMENTS = `
  query GetAllActiveMoments {
    getAllActiveMoments {
      id
      description
      resourceType
      resourceUrl
      audioUrl
      experienceLink
      likeCount
      viewerHasLiked
      preferences
      tags
      status
      created_at
      updated_at
      destination {
        place
        placeSub
        coordinates
      }
      user_data {
        id
        username
        name
        profile_picture
        bio
      }
    }
  }
`;

export const GET_MOMENTS_BY_USER = `
  query GetMomentsByUser {
    getAllMomentsByUser {
      id
      description
      resourceType
      resourceUrl
      audioUrl
      experienceLink
      likeCount
      viewerHasLiked
      preferences
      tags
      status
      created_at
      updated_at
      destination {
        place
        placeSub
        coordinates
      }
    }
  }
`;

// Mutations
export const CREATE_MOMENT = `
  mutation CreateMoment($input: CreateMomentInput!) {
    createMoment(input: $input) {
      id
      description
      resourceType
      resourceUrl
      audioUrl
      experienceLink
      preferences
      tags
      created_at
      destination {
        place
        placeSub
        coordinates
      }
    }
  }
`;

export const CREATE_COMMENT = `
  mutation CreateComment($input: CreateCommentInput!) {
    createComment(input: $input) {
      id
      comment
      username
      likeCount
      viewerHasLiked
      status
      created_at
      updated_at
    }
  }
`;

export const TOGGLE_LIKE = `
  mutation ToggleLike($item_id: ID!, $item_type: String!) {
    toggleLike(item_id: $item_id, item_type: $item_type) {
      success
      newLikeCount
      viewerHasLiked
    }
  }
`;
