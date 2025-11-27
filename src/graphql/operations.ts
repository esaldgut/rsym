/**
 * GraphQL Operations - 100% Aligned with AWS AppSync Schema
 * Generated from: yarn generate-all
 *
 * This file provides a centralized export of all GraphQL types, operations, and utilities.
 * It ensures type safety across the application by re-exporting generated types and importing
 * all GraphQL operation documents.
 *
 * Structure:
 * 1. Utility Types (Maybe, InputMaybe, Exact, etc.)
 * 2. Scalar Types (AWSDate, AWSDateTime, etc.)
 * 3. Core Types (User, Product, Moment, Reservation, etc.)
 * 4. Input Types (CreateMomentInput, UpdateProductInput, etc.)
 * 5. Enum Types (PaymentMethods, FriendshipStatus, etc.)
 * 6. Operation Types (Mutation, Query, Subscription)
 * 7. GraphQL Documents (mutations, queries, subscriptions)
 */

// ============================================================================
// UTILITY TYPES
// ============================================================================

export type {
  Maybe,
  InputMaybe,
  Exact,
  MakeOptional,
  MakeMaybe,
  MakeEmpty,
  Incremental
} from '../generated/graphql';

// ============================================================================
// SCALAR TYPES
// ============================================================================

export type { Scalars } from '../generated/graphql';

// ============================================================================
// CORE TYPES - User & Authentication
// ============================================================================

export type {
  CognitoUser,
  User,
  UserDevice,
  UserStats,
  UserSearchConnection,
  UserSearchResult
} from '../generated/graphql';

// ============================================================================
// CORE TYPES - Social Features
// ============================================================================

export type {
  // Friendships & Connections
  Friendship,
  FriendshipConnection,
  FriendshipStatus,
  RelationshipStatus,
  RelationshipType,

  // Follow System
  Follow,
  FollowConnection,
  FollowStatus,

  // Blocking
  BlockEvent
} from '../generated/graphql';

// ============================================================================
// CORE TYPES - Moments & Comments
// ============================================================================

export type {
  Moment,
  CreateMomentInput,
  CommentMomentInput,
  Comment,
  CreateCommentInput,
  LikePayload,
  SavePayload
} from '../generated/graphql';

// ============================================================================
// CORE TYPES - Products & Marketplace
// ============================================================================

export type {
  Product,
  ProductConnection,
  ProductFilterInput,
  CreateProductOfTypeCircuitInput,
  CreateProductOfTypePackageInput,
  UpdateProductInput,

  // Pricing & Policies
  Season,
  SeasonInput,
  PricePerPerson,
  PricePerPersonInput,
  ChildRange,
  ChildRangeInput,
  Policy,
  PolicyInput,
  StatePolicy,
  ChangePolicy,
  ChangePolicyInput,

  // Payment Policies
  PaymentPolicy,
  PaymentPolicyInput,
  PaymentOption,
  PaymentOptionInput,
  CashConfig,
  CashConfigInput,
  InstallmentConfig,
  InstallmentConfigInput,

  // Itinerary
  ItineraryDay,
  ItineraryDayInput,

  // Hotels
  Hotel,
  HotelInput,

  // Departures
  GuaranteedDepartures,
  GuaranteedDeparturesInput,

  // Package Specific
  PackageOrigins,
  PackageOriginsInput
} from '../generated/graphql';

// ============================================================================
// CORE TYPES - Reservations & Payments
// ============================================================================

export type {
  Reservation,
  ReservationInput,
  ReservationStatus,

  // Payment Plans
  PaymentPlan,
  PaymentPlanInput,
  PaymentPlanStatus,

  // Payment Processing
  PaymentInput,
  PaymentResponse,

  // Room Distribution
  RoomDistribution,
  RoomDistributionInput,

  // Travelers
  TravelerInfo,
  TravelerInfoInput
} from '../generated/graphql';

// ============================================================================
// CORE TYPES - Messaging & Chat
// ============================================================================

export type {
  Conversation,
  ConversationConnection,
  Message,
  MessageConnection,
  MessageStatus,
  MessageType,
  SendMessageInput,
  LastMessage,
  UnreadCount,
  ParticipantType,
  ChatLocation,
  ChatLocationInput
} from '../generated/graphql';

// ============================================================================
// CORE TYPES - Location & Geography
// ============================================================================

export type {
  Location,
  LocationInput,
  Point,
  PointInput
} from '../generated/graphql';

// ============================================================================
// CORE TYPES - Misc
// ============================================================================

export type {
  PaginationInput,
  Statements,
  StatementsInput,
  DeviceInfoInput
} from '../generated/graphql';

// ============================================================================
// ENUM TYPES
// ============================================================================

export type {
  DiscountType,
  DownPaymentType,
  InstallmentIntervals,
  PaymentMethods,
  PaymentType,
  WeekDays
} from '../generated/graphql';

// ============================================================================
// OPERATION TYPES
// ============================================================================

export type {
  Mutation,
  MutationAcceptConnectionRequestArgs,
  MutationBlockUserArgs,
  MutationCancelConnectionRequestArgs,
  MutationCreateCommentArgs,
  MutationCreateMomentArgs,
  MutationCreateProductOfTypeCircuitArgs,
  MutationCreateProductOfTypePackageArgs,
  MutationCreateReservationArgs,
  MutationDeleteProductArgs,
  MutationFollowUserArgs,
  MutationGeneratePaymentLinkArgs,
  MutationGeneratePaymentPlanArgs,
  MutationMarkMessageAsDeliveredArgs,
  MutationMarkMessagesAsReadArgs,
  MutationRegisterDeviceArgs,
  MutationRejectConnectionRequestArgs,
  MutationRemoveConnectionArgs,
  MutationSendConnectionRequestArgs,
  MutationSendMessageArgs,
  MutationToggleLikeArgs,
  MutationToggleSaveArgs,
  MutationUnblockUserArgs,
  MutationUnfollowUserArgs,
  MutationUpdatePaymentPlanArgs,
  MutationUpdateProductArgs,
  MutationUpdateProvidersPoliciesBySUBArgs,
  MutationUpdateReservationArgs,

  Query,
  QueryGetAllActiveAndPublishedProductsArgs,
  QueryGetAllActiveProductsByProviderArgs,
  QueryGetAllCommentsByMomentIdArgs,
  QueryGetAllProductsByEmailArgs,
  QueryGetBlockedUsersArgs,
  QueryGetConversationByIdArgs,
  QueryGetConversationMessagesArgs,
  QueryGetMyConnectionsArgs,
  QueryGetMyFollowersArgs,
  QueryGetMyFollowingArgs,
  QueryGetOrCreateConversationArgs,
  QueryGetPaymentPlanArgs,
  QueryGetPaymentPlanByReservationArgs,
  QueryGetPendingConnectionRequestsArgs,
  QueryGetProductByIdArgs,
  QueryGetProductsByTypeArgs,
  QueryGetProvidersPoliciesBySubArgs,
  QueryGetRelationshipStatusArgs,
  QueryGetReservationsBySUBArgs,
  QueryGetSentConnectionRequestsArgs,
  QueryGetUserByUsernameArgs,
  QueryGetUserStatsArgs,
  QueryListMyConversationsArgs,
  QuerySearchUsersArgs,

  Subscription,
  SubscriptionOnConnectionRequestAcceptedArgs,
  SubscriptionOnConnectionRequestReceivedArgs,
  SubscriptionOnMessageDeliveredArgs,
  SubscriptionOnMessagesReadArgs,
  SubscriptionOnNewFollowerArgs,
  SubscriptionOnNewMessageArgs,
  SubscriptionOnUserBlockedArgs
} from '../generated/graphql';

// ============================================================================
// GRAPHQL DOCUMENTS - MUTATIONS (27 operations)
// ============================================================================

export { default as acceptConnectionRequest } from './mutations/acceptConnectionRequest.graphql';
export { default as blockUser } from './mutations/blockUser.graphql';
export { default as cancelConnectionRequest } from './mutations/cancelConnectionRequest.graphql';
export { default as createComment } from './mutations/createComment.graphql';
export { default as createMoment } from './mutations/createMoment.graphql';
export { default as createProductOfTypeCircuit } from './mutations/createProductOfTypeCircuit.graphql';
export { default as createProductOfTypePackage } from './mutations/createProductOfTypePackage.graphql';
export { default as createReservation } from './mutations/createReservation.graphql';
export { default as deleteProduct } from './mutations/deleteProduct.graphql';
export { default as followUser } from './mutations/followUser.graphql';
export { default as generatePaymentLink } from './mutations/generatePaymentLink.graphql';
export { default as generatePaymentPlan } from './mutations/generatePaymentPlan.graphql';
export { default as markMessageAsDelivered } from './mutations/markMessageAsDelivered.graphql';
export { default as markMessagesAsRead } from './mutations/markMessagesAsRead.graphql';
export { default as registerDevice } from './mutations/registerDevice.graphql';
export { default as rejectConnectionRequest } from './mutations/rejectConnectionRequest.graphql';
export { default as removeConnection } from './mutations/removeConnection.graphql';
export { default as sendConnectionRequest } from './mutations/sendConnectionRequest.graphql';
export { default as sendMessage } from './mutations/sendMessage.graphql';
export { default as toggleLike } from './mutations/toggleLike.graphql';
export { default as toggleSave } from './mutations/toggleSave.graphql';
export { default as unblockUser } from './mutations/unblockUser.graphql';
export { default as unfollowUser } from './mutations/unfollowUser.graphql';
export { default as updatePaymentPlan } from './mutations/updatePaymentPlan.graphql';
export { default as updateProduct } from './mutations/updateProduct.graphql';
export { default as updateProvidersPoliciesBySUB } from './mutations/updateProvidersPoliciesBySUB.graphql';
export { default as updateReservation } from './mutations/updateReservation.graphql';

// ============================================================================
// GRAPHQL DOCUMENTS - QUERIES (29 operations)
// ============================================================================

export { default as getAllActiveAndPublishedProducts } from './queries/getAllActiveAndPublishedProducts.graphql';
export { default as getAllActiveMoments } from './queries/getAllActiveMoments.graphql';
export { default as getAllActiveProductsByProvider } from './queries/getAllActiveProductsByProvider.graphql';
export { default as getAllCommentsByMomentID } from './queries/getAllCommentsByMomentID.graphql';
export { default as getAllMomentsByFollowing } from './queries/getAllMomentsByFollowing.graphql';
export { default as getAllMomentsByMyPreferences } from './queries/getAllMomentsByMyPreferences.graphql';
export { default as getAllMomentsByUser } from './queries/getAllMomentsByUser.graphql';
export { default as getAllProductsByEmail } from './queries/getAllProductsByEmail.graphql';
export { default as getBlockedUsers } from './queries/getBlockedUsers.graphql';
export { default as getConversationById } from './queries/getConversationById.graphql';
export { default as getConversationMessages } from './queries/getConversationMessages.graphql';
export { default as getMyConnections } from './queries/getMyConnections.graphql';
export { default as getMyFollowers } from './queries/getMyFollowers.graphql';
export { default as getMyFollowing } from './queries/getMyFollowing.graphql';
export { default as getMyStats } from './queries/getMyStats.graphql';
export { default as getOrCreateConversation } from './queries/getOrCreateConversation.graphql';
export { default as getPaymentPlan } from './queries/getPaymentPlan.graphql';
export { default as getPaymentPlanByReservation } from './queries/getPaymentPlanByReservation.graphql';
export { default as getPendingConnectionRequests } from './queries/getPendingConnectionRequests.graphql';
export { default as getProductById } from './queries/getProductById.graphql';
export { default as getProductsByType } from './queries/getProductsByType.graphql';
export { default as getProvidersPoliciesBySub } from './queries/getProvidersPoliciesBySub.graphql';
export { default as getRelationshipStatus } from './queries/getRelationshipStatus.graphql';
export { default as getReservationsBySUB } from './queries/getReservationsBySUB.graphql';
export { default as getSentConnectionRequests } from './queries/getSentConnectionRequests.graphql';
export { default as getUserByUsername } from './queries/getUserByUsername.graphql';
export { default as getUserStats } from './queries/getUserStats.graphql';
export { default as listMyConversations } from './queries/listMyConversations.graphql';
export { default as searchUsers } from './queries/searchUsers.graphql';

// ============================================================================
// GRAPHQL DOCUMENTS - SUBSCRIPTIONS (7 operations)
// ============================================================================

export { default as onConnectionRequestAccepted } from './subscriptions/onConnectionRequestAccepted.graphql';
export { default as onConnectionRequestReceived } from './subscriptions/onConnectionRequestReceived.graphql';
export { default as onMessageDelivered } from './subscriptions/onMessageDelivered.graphql';
export { default as onMessagesRead } from './subscriptions/onMessagesRead.graphql';
export { default as onNewFollower } from './subscriptions/onNewFollower.graphql';
export { default as onNewMessage } from './subscriptions/onNewMessage.graphql';
export { default as onUserBlocked } from './subscriptions/onUserBlocked.graphql';

// ============================================================================
// OPERATION SUMMARY
// ============================================================================
// Total Operations: 63
// - Mutations: 27
// - Queries: 29
// - Subscriptions: 7
//
// Last Updated: Auto-generated from GraphQL schema
// Schema Source: AWS AppSync (via yarn generate-all)
// ============================================================================
