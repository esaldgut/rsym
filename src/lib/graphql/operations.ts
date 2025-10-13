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

// Legacy query - DEPRECATED
// Use getAllActiveAndPublishedProducts instead
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

// OPTIMIZED: Marketplace-specific lightweight query (reduces 90% of fields)
export const getAllActiveAndPublishedProducts = /* GraphQL */ `
  query getAllActiveAndPublishedProducts($filter: ProductFilterInput, $pagination: PaginationInput) {
    getAllActiveAndPublishedProducts(filter: $filter, pagination: $pagination) {
      items {
        id
        name
        description
        product_type
        published
        cover_image_url
        min_product_price
        preferences
        destination {
          place
          placeSub
        }
        seasons {
          id
          start_date
          end_date
          number_of_nights
        }
        user_data {
          username
          name
          avatar_url
        }
      }
      nextToken
      total
    }
  }
`;

// DEPRECATED: Use getProductById instead
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

// DEPRECATED: Use getProductById instead
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

// REMOVED: Duplicate definition - using the enhanced version below

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

// NEW: Get single Product by ID (replaces getPackageByID and getCircuitByID)
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
        image_url
        created_at
        updated_at
        preferences
        languages
        seasons {
          id
          start_date
          end_date
          category
          allotment
          allotment_remain
          prices {
            id
            price
            currency
            room_name
            max_adult
            max_minor
          }
        }
        destination {
          place
          placeSub
          complementary_description
          coordinates {
            latitude
            longitude
          }
        }
        min_product_price
        provider_id
      }
      nextToken
      total
    }
  }
`;

// ==================== FRIENDSHIP QUERIES ====================

export const getMyConnections = /* GraphQL */ `
  query GetMyConnections($status: FriendshipStatus, $limit: Int, $nextToken: String) {
    getMyConnections(status: $status, limit: $limit, nextToken: $nextToken) {
      items {
        id
        userId
        friendId
        status
        initiatedBy
        createdAt
        updatedAt
        user {
          sub
          username
          name
          email
          user_type
          avatar_url
          bio
        }
        friend {
          sub
          username
          name
          email
          user_type
          avatar_url
          bio
        }
      }
      nextToken
      total
    }
  }
`;

export const getPendingConnectionRequests = /* GraphQL */ `
  query GetPendingConnectionRequests($limit: Int, $nextToken: String) {
    getPendingConnectionRequests(limit: $limit, nextToken: $nextToken) {
      items {
        id
        userId
        friendId
        status
        initiatedBy
        createdAt
        user {
          sub
          username
          name
          avatar_url
          user_type
        }
      }
      nextToken
      total
    }
  }
`;

export const getSentConnectionRequests = /* GraphQL */ `
  query GetSentConnectionRequests($limit: Int, $nextToken: String) {
    getSentConnectionRequests(limit: $limit, nextToken: $nextToken) {
      items {
        id
        userId
        friendId
        status
        initiatedBy
        createdAt
        friend {
          sub
          username
          name
          avatar_url
          user_type
        }
      }
      nextToken
      total
    }
  }
`;

export const getMyFollowers = /* GraphQL */ `
  query GetMyFollowers($limit: Int, $nextToken: String) {
    getMyFollowers(limit: $limit, nextToken: $nextToken) {
      items {
        id
        followerId
        followingId
        status
        createdAt
        notificationEnabled
      }
      nextToken
      total
    }
  }
`;

export const getMyFollowing = /* GraphQL */ `
  query GetMyFollowing($limit: Int, $nextToken: String) {
    getMyFollowing(limit: $limit, nextToken: $nextToken) {
      items {
        id
        followerId
        followingId
        status
        createdAt
        notificationEnabled
      }
      nextToken
      total
    }
  }
`;

export const getRelationshipStatus = /* GraphQL */ `
  query GetRelationshipStatus($targetUserId: ID!) {
    getRelationshipStatus(targetUserId: $targetUserId) {
      type
      isConnected
      isFollowing
      isFollower
      connectionStatus
      canSendRequest
      canFollow
    }
  }
`;

export const getMyStats = /* GraphQL */ `
  query GetMyStats {
    getMyStats {
      userId
      connectionsCount
      pendingRequestsReceived
      pendingRequestsSent
      followersCount
      followingCount
      blockedUsersCount
    }
  }
`;

export const getUserStats = /* GraphQL */ `
  query GetUserStats($userId: ID!) {
    getUserStats(userId: $userId) {
      userId
      connectionsCount
      followersCount
      followingCount
      blockedUsersCount
    }
  }
`;

export const getBlockedUsers = /* GraphQL */ `
  query GetBlockedUsers($limit: Int, $nextToken: String) {
    getBlockedUsers(limit: $limit, nextToken: $nextToken) {
      items {
        id
        userId
        friendId
        status
        initiatedBy
        updatedAt
        friend {
          sub
          username
          name
          avatar_url
        }
      }
      nextToken
      total
    }
  }
`;

// ==================== FRIENDSHIP MUTATIONS ====================

export const sendConnectionRequest = /* GraphQL */ `
  mutation SendConnectionRequest($targetUserId: ID!) {
    sendConnectionRequest(targetUserId: $targetUserId) {
      id
      userId
      friendId
      status
      initiatedBy
      createdAt
      updatedAt
    }
  }
`;

export const acceptConnectionRequest = /* GraphQL */ `
  mutation AcceptConnectionRequest($requestId: ID!) {
    acceptConnectionRequest(requestId: $requestId) {
      id
      userId
      friendId
      status
      initiatedBy
      updatedAt
    }
  }
`;

export const rejectConnectionRequest = /* GraphQL */ `
  mutation RejectConnectionRequest($requestId: ID!) {
    rejectConnectionRequest(requestId: $requestId) {
      id
      userId
      friendId
      status
      updatedAt
    }
  }
`;

export const cancelConnectionRequest = /* GraphQL */ `
  mutation CancelConnectionRequest($requestId: ID!) {
    cancelConnectionRequest(requestId: $requestId) {
      id
      userId
      friendId
      status
      updatedAt
    }
  }
`;

export const removeConnection = /* GraphQL */ `
  mutation RemoveConnection($connectionId: ID!) {
    removeConnection(connectionId: $connectionId)
  }
`;

export const followUser = /* GraphQL */ `
  mutation FollowUser($targetUserId: ID!) {
    followUser(targetUserId: $targetUserId) {
      id
      followerId
      followingId
      status
      createdAt
      notificationEnabled
    }
  }
`;

export const unfollowUser = /* GraphQL */ `
  mutation UnfollowUser($targetUserId: ID!) {
    unfollowUser(targetUserId: $targetUserId)
  }
`;

export const blockUser = /* GraphQL */ `
  mutation BlockUser($targetUserId: ID!) {
    blockUser(targetUserId: $targetUserId)
  }
`;

export const unblockUser = /* GraphQL */ `
  mutation UnblockUser($targetUserId: ID!) {
    unblockUser(targetUserId: $targetUserId)
  }
`;

// ==================== CHAT QUERIES ====================

export const listMyConversations = /* GraphQL */ `
  query ListMyConversations($limit: Int, $nextToken: String) {
    listMyConversations(limit: $limit, nextToken: $nextToken) {
      items {
        id
        participantIds
        participantUsernames
        participantTypes {
          userId
          userType
        }
        lastMessage {
          content
          senderId
          timestamp
        }
        unreadCount {
          userId
          count
        }
        createdAt
        updatedAt
      }
      nextToken
    }
  }
`;

export const getConversationMessages = /* GraphQL */ `
  query GetConversationMessages($conversationId: ID!, $limit: Int, $nextToken: String) {
    getConversationMessages(conversationId: $conversationId, limit: $limit, nextToken: $nextToken) {
      items {
        id
        conversationId
        senderId
        senderUsername
        content
        type
        metadata {
          imageUrl
          location {
            lat
            lng
          }
        }
        status
        timestamp
        createdAt
      }
      nextToken
    }
  }
`;

export const getOrCreateConversation = /* GraphQL */ `
  query GetOrCreateConversation($participantId: ID!) {
    getOrCreateConversation(participantId: $participantId) {
      id
      participantIds
      participantUsernames
      participantTypes {
        userId
        userType
      }
      lastMessage {
        content
        senderId
        timestamp
      }
      unreadCount {
        userId
        count
      }
      createdAt
      updatedAt
    }
  }
`;

export const getConversationById = /* GraphQL */ `
  query GetConversationById($conversationId: ID!) {
    getConversationById(conversationId: $conversationId) {
      id
      participantIds
      participantUsernames
      participantTypes {
        userId
        userType
      }
      lastMessage {
        content
        senderId
        timestamp
      }
      unreadCount {
        userId
        count
      }
      createdAt
      updatedAt
    }
  }
`;

// ==================== CHAT MUTATIONS ====================

export const sendMessage = /* GraphQL */ `
  mutation SendMessage($input: SendMessageInput!) {
    sendMessage(input: $input) {
      id
      conversationId
      senderId
      senderUsername
      content
      type
      metadata {
        imageUrl
        location {
          lat
          lng
        }
      }
      status
      timestamp
      createdAt
    }
  }
`;

export const markMessagesAsRead = /* GraphQL */ `
  mutation MarkMessagesAsRead($conversationId: ID!) {
    markMessagesAsRead(conversationId: $conversationId)
  }
`;

export const markMessageAsDelivered = /* GraphQL */ `
  mutation MarkMessageAsDelivered($messageId: ID!) {
    markMessageAsDelivered(messageId: $messageId) {
      id
      status
    }
  }
`;