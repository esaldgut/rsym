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
        image_url
        video_url
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

// DEPRECATED: Removed getPackageByID - use getProductById instead

// DEPRECATED: Removed getAllActivePackagesByProvider - use getAllActiveProductsByProvider instead

// DEPRECATED: Removed getCircuitByID - use getProductById instead

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
  mutation updateProduct($input: UpdateProductInput!) {
    updateProduct(input: $input) {
      cover_image_url
      created_at
      departures {
        id
        origin {
          complementary_description
          coordinates {
            latitude
            longitude
          }
          id
          place
          placeSub
        }
        days
        specific_dates
      }
      description
      destination {
        complementary_description
        coordinates {
          latitude
          longitude
        }
        id
        place
        placeSub
      }
      id
      image_url
      is_foreign
      itinerary
      languages
      min_product_price
      name
      payment_policy {
        created_at
        general_policies {
          change_policy {
            allows_date_change
            deadline_days_to_make_change
          }
        }
        id
        options {
          type
          benefits_or_legal {
            stated
          }
          config {
            cash {
              deadline_days_to_pay
              discount
              discount_type
              payment_methods
            }
            installments {
              days_before_must_be_settled
              deadline_days_to_pay
              down_payment_after
              down_payment_before
              down_payment_type
              installment_intervals
              payment_methods
            }
          }
          description
        }
        product_id
        provider_id
        updated_at
        version
      }
      planned_hotels_or_similar
      preferences
      product_type
      provider_id
      published
      seasons {
        aditional_services
        allotment
        allotment_remain
        category
        end_date
        extra_prices {
          children {
            child_price
            max_minor_age
            min_minor_age
            name
          }
          currency
          id
          max_adult
          max_minor
          price
          room_name
        }
        id
        number_of_nights
        prices {
          children {
            child_price
            max_minor_age
            min_minor_age
            name
          }
          currency
          id
          max_adult
          max_minor
          price
          room_name
        }
        schedules
        start_date
      }
      status
      updated_at
      user_data {
        avatar_url
        bio
        email
        name
        sub
        user_type
        username
      }
      video_url
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
      cover_image_url
      created_at
      departures {
        id
        origin {
          complementary_description
          coordinates {
            latitude
            longitude
          }
          id
          place
          placeSub
        }
        days
        specific_dates
      }
      description
      destination {
        complementary_description
        coordinates {
          latitude
          longitude
        }
        id
        place
        placeSub
      }
      id
      image_url
      is_foreign
      itinerary
      languages
      min_product_price
      name
      payment_policy {
        created_at
        general_policies {
          change_policy {
            allows_date_change
            deadline_days_to_make_change
          }
        }
        id
        options {
          type
          benefits_or_legal {
            stated
          }
          config {
            cash {
              deadline_days_to_pay
              discount
              discount_type
              payment_methods
            }
            installments {
              days_before_must_be_settled
              deadline_days_to_pay
              down_payment_after
              down_payment_before
              down_payment_type
              installment_intervals
              payment_methods
            }
          }
          description
        }
        product_id
        provider_id
        updated_at
        version
      }
      planned_hotels_or_similar
      preferences
      product_type
      provider_id
      published
      seasons {
        aditional_services
        allotment
        allotment_remain
        category
        end_date
        extra_prices {
          children {
            child_price
            max_minor_age
            min_minor_age
            name
          }
          currency
          id
          max_adult
          max_minor
          price
          room_name
        }
        id
        number_of_nights
        prices {
          children {
            child_price
            max_minor_age
            min_minor_age
            name
          }
          currency
          id
          max_adult
          max_minor
          price
          room_name
        }
        schedules
        start_date
      }
      status
      updated_at
      user_data {
        avatar_url
        bio
        email
        name
        sub
        user_type
        username
      }
      video_url
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
        cover_image_url
        created_at
        departures {
          id
          origin {
            complementary_description
            coordinates {
              latitude
              longitude
            }
            id
            place
            placeSub
          }
          days
          specific_dates
        }
        description
        destination {
          complementary_description
          coordinates {
            latitude
            longitude
          }
          id
          place
          placeSub
        }
        id
        image_url
        is_foreign
        itinerary
        languages
        min_product_price
        name
        payment_policy {
          created_at
          general_policies {
            change_policy {
              allows_date_change
              deadline_days_to_make_change
            }
          }
          id
          options {
            type
            benefits_or_legal {
              stated
            }
            config {
              cash {
                deadline_days_to_pay
                discount
                discount_type
                payment_methods
              }
              installments {
                days_before_must_be_settled
                deadline_days_to_pay
                down_payment_after
                down_payment_before
                down_payment_type
                installment_intervals
                payment_methods
              }
            }
            description
          }
          product_id
          provider_id
          updated_at
          version
        }
        planned_hotels_or_similar
        preferences
        product_type
        provider_id
        published
        seasons {
          aditional_services
          allotment
          allotment_remain
          category
          end_date
          extra_prices {
            children {
              child_price
              max_minor_age
              min_minor_age
              name
            }
            currency
            id
            max_adult
            max_minor
            price
            room_name
          }
          id
          number_of_nights
          prices {
            children {
              child_price
              max_minor_age
              min_minor_age
              name
            }
            currency
            id
            max_adult
            max_minor
            price
            room_name
          }
          schedules
          start_date
        }
        status
        updated_at
        user_data {
          avatar_url
          bio
          email
          name
          sub
          user_type
          username
        }
        video_url
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

// ==================== PROVIDER DASHBOARD QUERIES ====================

export const getReservationsBySUB = /* GraphQL */ `
  query GetReservationsBySUB {
    getReservationsBySUB {
      id
      adults
      babys
      kids
      companions {
        name
        family_name
        birthday
        country
        gender
        passport_number
      }
      experience_id
      experience_type
      payment_method
      price_per_kid
      price_per_person
      reservationDate
      status
      total_price
      type
    }
  }
`;

export const getProvidersPoliciesBySub = /* GraphQL */ `
  query GetProvidersPoliciesBySub {
    getProvidersPoliciesBySub {
      policy
      title
    }
  }
`;

export const getPaymentPlan = /* GraphQL */ `
  query GetPaymentPlan($id: ID!) {
    getPaymentPlan(id: $id) {
      id
      product_id
      reservation_id
      status
      payment_type_selected
      currency
      total_cost
      travel_date
      reservation_date
      created_at
      updated_at
      allows_date_change
      change_deadline_days
      benefits_statements
      cash_discount_amount
      cash_discount_percentage
      cash_final_amount
      cash_payment_deadline
      cash_payment_methods
      installment_down_payment_amount
      installment_down_payment_percentage
      installment_amount_per_payment
      installment_number_of_payments
      installment_frequency_days
      installment_total_amount
      installment_first_payment_deadline
      installment_payment_deadline
      installment_payment_methods
      installment_available_days
    }
  }
`;

export const getPaymentPlanByReservation = /* GraphQL */ `
  query GetPaymentPlanByReservation($reservation_id: ID!) {
    getPaymentPlanByReservation(reservation_id: $reservation_id) {
      id
      product_id
      reservation_id
      status
      payment_type_selected
      currency
      total_cost
      travel_date
      reservation_date
      created_at
      updated_at
      allows_date_change
      change_deadline_days
      benefits_statements
      cash_discount_amount
      cash_discount_percentage
      cash_final_amount
      cash_payment_deadline
      cash_payment_methods
      installment_down_payment_amount
      installment_down_payment_percentage
      installment_amount_per_payment
      installment_number_of_payments
      installment_frequency_days
      installment_total_amount
      installment_first_payment_deadline
      installment_payment_deadline
      installment_payment_methods
      installment_available_days
    }
  }
`;
